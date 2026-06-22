import { define } from "@/utils.ts";
import {
  type AuditActorRole,
  logAdminAction,
  resolvePlatformRole,
} from "@/utils/db/audit-log.ts";
import { marked } from "marked";
import {
  BatchEmailItem,
  buildEmailHtml,
  sendEmail,
  sendEmailBatch,
  SITE_URL,
} from "@/utils/email.ts";

// ---------------------------------------------------------------------------
// Token generation (same HMAC pattern as groups.ts)
// ---------------------------------------------------------------------------

async function computeHmacBase64Url(
  secret: string,
  message: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/** Generate an unsubscribe token: {profileId}.{groupId}.{expiresAt}.{sig} */
async function generateUnsubToken(
  profileId: string,
  groupId: string,
): Promise<string> {
  const secret = Deno.env.get("FT_TOKEN_SECRET") ?? "ft-dev-secret";
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const message = `${profileId}.${groupId}.${expiresAt}`;
  const sig = await computeHmacBase64Url(secret, message);
  return `${profileId}.${groupId}.${expiresAt}.${sig}`;
}

// ---------------------------------------------------------------------------
// Variable interpolation
// ---------------------------------------------------------------------------

/** Replace {{varName}} tokens in text. Unrecognised vars are left as-is. */
function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function memberVars(
  profile: { name_first: string | null; name_last: string | null; email: string },
): Record<string, string> {
  const firstName = profile.name_first?.trim() || "member";
  const lastName = profile.name_last?.trim() || "";
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;
  return { firstName, lastName, fullName, email: profile.email };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MemberRow {
  profile_id: string;
  profiles: {
    name_first: string | null;
    name_last: string | null;
    email: string;
  } | null;
}

// ---------------------------------------------------------------------------
// Route handler
// Protected by site/routes/api/groups/[slug]/admin/_middleware.ts
// ---------------------------------------------------------------------------

export const handler = define.handlers({
  async POST(ctx) {
    const { slug } = ctx.params;

    // 1. Parse request body
    let reqBody: {
      subject?: string;
      markdown?: string;
      testOnly?: boolean;
      groupId?: string;
    };
    try {
      reqBody = await ctx.req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { subject, markdown, testOnly, groupId } = reqBody;

    // 2. Validate required fields
    if (!subject?.trim() || !markdown?.trim()) {
      return Response.json(
        { error: "Subject and markdown are required" },
        { status: 400 },
      );
    }
    if (!groupId) {
      return Response.json({ error: "groupId is required" }, { status: 400 });
    }

    // 3. Verify groupId matches the group from middleware
    const gr = ctx.state.group!;
    if (gr.id !== groupId) {
      return Response.json(
        { error: "groupId does not match URL slug" },
        { status: 400 },
      );
    }

    const adminEmail = ctx.state.profile?.email ?? "";
    const adminProfileId = ctx.state.user?.id ?? "";
    const fromAddress = `group-${slug}@futuretogether.community`;
    const subjectTrimmed = subject.trim();
    const markdownTrimmed = markdown.trim();

    // -------------------------------------------------------------------------
    // Test send — single email to admin's own address
    // sendEmail() applies the env gate (allowlist check) internally.
    // -------------------------------------------------------------------------
    if (testOnly) {
      //const token = await generateUnsubToken(adminProfileId, groupId);
      //const unsubUrl = `${SITE_URL}/api/groups/${slug}/unsubscribe?token=${token}`;
      const adminProfile = ctx.state.profile;
      const testVars = memberVars({
        name_first: adminProfile?.name_first ?? "Test",
        name_last: adminProfile?.name_last ?? "Member",
        email: adminEmail,
      });
      const interpolated = interpolate(markdownTrimmed, testVars);
      const contentHtml = await marked.parse(interpolated);
      const html = buildEmailHtml(contentHtml, subjectTrimmed);

      const ok = await sendEmail({
        to: adminEmail,
        subject: `[TEST] ${subjectTrimmed}`,
        html,
        replyTo: adminEmail,
      });

      if (!ok) {
        return Response.json(
          {
            error:
              "Test email blocked or failed. Check FT_EMAIL_ALLOWLIST and server logs.",
          },
          { status: 403 },
        );
      }

      const testActorRole: AuditActorRole = ctx.state.isSiteAdminBypass
        ? await resolvePlatformRole(adminProfileId)
        : (ctx.state.membership?.role ?? "group_admin") as AuditActorRole;
      await logAdminAction(ctx.state, {
        actor_id: adminProfileId,
        actor_role: testActorRole,
        action: "email.sent",
        resource_type: "email",
        group_id: groupId,
        resource_slug: gr.slug,
        metadata: { subject: subjectTrimmed, test_only: true, to: adminEmail },
      });

      return Response.json({
        sent: 1,
        failed: 0,
        total: 1,
        testOnly: true,
        to: adminEmail,
      });
    }

    // -------------------------------------------------------------------------
    // Real send — fetch opted-in members and send in batch
    // -------------------------------------------------------------------------
    const { data: memberships, error: membersError } = await ctx.state
      .supabaseClient!
      .from("group_memberships")
      .select("profile_id, profiles!profile_id(name_first, name_last, email)")
      .eq("group_id", groupId)
      .eq("status", "active")
      .eq("email_opt_in", true);

    if (membersError) {
      console.error("EmailSend: fetch members error", membersError);
      return Response.json(
        { error: "Failed to fetch members" },
        { status: 500 },
      );
    }

    const members = (memberships ?? []) as MemberRow[];

    if (members.length === 0) {
      return Response.json(
        { error: "No opted-in members to send to" },
        { status: 400 },
      );
    }

    // Build batch items (one per member, with per-member unsubscribe token)
    const batchItems: BatchEmailItem[] = await Promise.all(
      members.map(async (m) => {
        const profileId = m.profile_id;
        const email = m.profiles?.email ?? "";
        const token = await generateUnsubToken(profileId, groupId);
        const unsubUrl =
          `${SITE_URL}/api/groups/${slug}/unsubscribe?token=${token}`;
        const interpolated = interpolate(markdownTrimmed, memberVars({
          name_first: m.profiles?.name_first ?? null,
          name_last: m.profiles?.name_last ?? null,
          email,
        }));
        const contentHtml = await marked.parse(interpolated);
        return {
          from: `${gr.name} <${fromAddress}>`,
          reply_to: adminEmail,
          to: email,
          subject: subjectTrimmed,
          html: buildEmailHtml(contentHtml, subjectTrimmed),
          headers: {
            "List-Unsubscribe":
              `<${unsubUrl}>, <mailto:unsubscribe@futuretogether.community>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        };
      }),
    );

    // sendEmailBatch() applies the env gate (blocks entirely in non-prod) internally.
    const { sent, failed, firstBatchId, error: batchError } =
      await sendEmailBatch(batchItems);
    if (batchError && sent === 0) {
      return Response.json({ error: batchError }, { status: 403 });
    }

    // Log to email_sends table
    let sendId: string | null = null;
    try {
      const { data: insertedRow, error: insertError } = await ctx.state
        .supabaseClient!
        .from("email_sends")
        .insert({
          group_id: groupId,
          sent_by_id: adminProfileId,
          subject: subjectTrimmed,
          body_markdown: markdownTrimmed,
          resend_batch_id: firstBatchId ?? null,
          recipient_count: members.length,
          sent_count: sent,
          sent_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("EmailSend: email_sends insert error", insertError);
      } else {
        sendId = (insertedRow as { id: string }).id;
      }
    } catch (err) {
      console.error("EmailSend: email_sends insert exception", err);
    }

    const actorRole: AuditActorRole = ctx.state.isSiteAdminBypass
      ? await resolvePlatformRole(adminProfileId)
      : (ctx.state.membership?.role ?? "group_admin") as AuditActorRole;
    await logAdminAction(ctx.state, {
      actor_id: adminProfileId,
      actor_role: actorRole,
      action: "email.sent",
      resource_type: "email",
      resource_id: sendId ?? undefined,
      group_id: groupId,
      resource_slug: gr.slug,
      metadata: {
        subject: subjectTrimmed,
        sent,
        failed,
        total: members.length,
      },
    });

    return Response.json({ sent, failed, total: members.length, sendId });
  },
});
