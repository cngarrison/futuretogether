import { define } from "@/utils.ts";
import { marked } from "marked";
import {
  BatchEmailItem,
  buildEmailHtml,
  FROM_EMAIL,
  FROM_NAME,
  sendEmail,
  sendEmailBatch,
} from "@/utils/email.ts";
import { getActiveMembersAdmin } from "@/utils/db/group-members.ts";
import type { Member } from "@/utils/db/group-members.ts";
import { logAdminAction, resolvePlatformRole } from "@/utils/db/audit-log.ts";
import { saveEmailBroadcast } from "@/utils/db/email-sends.ts";

/**
 * POST /api/admin/emails/send
 *
 * Sends a markdown-authored email to all active members via the
 * Resend batch API (max 100 per call; loops for larger lists).
 *
 * Supports {{firstName}}, {{lastName}}, {{fullName}}, {{email}}
 * variable interpolation per recipient.
 *
 * With testOnly: true, sends a single email to the address configured
 * in FT_EMAIL_TEST (JSON env var) using the test member variables.
 *
 * Protected by /api/admin/_middleware.ts (Supabase session auth).
 *
 * Request body: { subject: string; markdown: string; testOnly?: boolean }
 * Response:     { sent, failed, total, testOnly?, to?, broadcastId? }
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TestConfig {
  to: string;
  vars: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Variable interpolation
// ---------------------------------------------------------------------------

/** Replace {{varName}} tokens in text. Unrecognised vars are left as-is. */
function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function memberVars(member: Member): Record<string, string> {
  const firstName = member.firstName?.trim() || "member";
  const lastName = member.lastName?.trim() || "";
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;
  return { firstName, lastName, fullName, email: member.email };
}

/**
 * Parse FT_EMAIL_TEST env var (JSON string) to get test recipient config.
 *
 * Expected format:
 *   {"to":"you@example.com","firstName":"Charlie","lastName":"Garrison","email":"you@example.com"}
 *
 * Falls back to FT_CONTACT_EMAIL / FROM_EMAIL with placeholder values if not set.
 */
function getTestConfig(): TestConfig {
  const raw = Deno.env.get("FT_EMAIL_TEST");
  const fallbackTo = Deno.env.get("FT_CONTACT_EMAIL") ??
    Deno.env.get("FROM_EMAIL") ?? FROM_EMAIL;

  if (!raw) {
    return {
      to: fallbackTo,
      vars: {
        firstName: "Test",
        lastName: "Member",
        fullName: "Test Member",
        email: fallbackTo,
      },
    };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const firstName = parsed.firstName ?? "Test";
    const lastName = parsed.lastName ?? "Member";
    return {
      to: parsed.to ?? fallbackTo,
      vars: {
        firstName,
        lastName,
        fullName: parsed.fullName ?? `${firstName} ${lastName}`,
        email: parsed.email ?? fallbackTo,
      },
    };
  } catch {
    console.error("Failed to parse FT_EMAIL_TEST JSON — using defaults");
    return {
      to: fallbackTo,
      vars: {
        firstName: "Test",
        lastName: "Member",
        fullName: "Test Member",
        email: fallbackTo,
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const handler = define.handlers({
  async POST(ctx) {
    let reqBody: { subject?: string; markdown?: string; testOnly?: boolean };
    try {
      reqBody = await ctx.req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { subject, markdown, testOnly } = reqBody;

    if (!subject?.trim() || !markdown?.trim()) {
      return new Response(
        JSON.stringify({ error: "Both subject and markdown are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const subjectTrimmed = subject.trim();
    const markdownTrimmed = markdown.trim();
    const from = `${FROM_NAME} <${FROM_EMAIL}>`;

    // -----------------------------------------------------------------------
    // Test send — single email to configured test address
    // -----------------------------------------------------------------------
    // sendEmail() applies the env gate (allowlist check) internally.
    if (testOnly) {
      const testConfig = getTestConfig();
      const interpolated = interpolate(markdownTrimmed, testConfig.vars);
      const contentHtml = marked.parse(interpolated, {
        async: false,
      }) as string;
      const emailHtml = buildEmailHtml(contentHtml, `[TEST] ${subjectTrimmed}`);

      const ok = await sendEmail({
        to: testConfig.to,
        subject: `[TEST] ${subjectTrimmed}`,
        html: emailHtml,
      });

      await logAdminAction(ctx.state, {
        actor_id: ctx.state.user!.id,
        actor_role: await resolvePlatformRole(ctx.state.user!.id),
        action: "email.sent",
        resource_type: "email",
        metadata: {
          subject: subjectTrimmed,
          test_only: true,
          to: testConfig.to,
        },
      });

      return new Response(
        JSON.stringify({
          sent: ok ? 1 : 0,
          failed: ok ? 0 : 1,
          total: 1,
          testOnly: true,
          to: testConfig.to,
        }),
        {
          status: ok ? 200 : 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // -----------------------------------------------------------------------
    // Bulk send — all active members, with per-member variable interpolation
    // -----------------------------------------------------------------------
    const members = await getActiveMembersAdmin();
    if (members.length === 0) {
      return new Response(
        JSON.stringify({ error: "No active members to send to" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const items: BatchEmailItem[] = await Promise.all(
      members.map(async (m) => {
        const interpolated = interpolate(markdownTrimmed, memberVars(m));
        const contentHtml = await marked.parse(interpolated);
        return {
          from,
          to: m.email,
          subject: subjectTrimmed,
          html: buildEmailHtml(contentHtml, subjectTrimmed),
        };
      }),
    );

    // sendEmailBatch() applies the env gate (blocks entirely in non-prod) internally.
    const { sent, failed, error: batchError } = await sendEmailBatch(items);
    if (batchError && sent === 0) {
      return new Response(JSON.stringify({ error: batchError }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    const total = members.length;
    const broadcastId = crypto.randomUUID();
    const adminProfileId = ctx.state.user?.id ?? "";

    await saveEmailBroadcast({
      id: broadcastId,
      subject: subjectTrimmed,
      bodyMarkdown: markdownTrimmed,
      sentAt: new Date().toISOString(),
      recipientCount: total,
      sentCount: sent,
      failedCount: failed,
      recipientEmails: members.map((m) => m.email),
      sentByProfileId: adminProfileId,
      resendBatchId: undefined,
    }, ctx.state);

    await logAdminAction(ctx.state, {
      actor_id: ctx.state.user!.id,
      actor_role: await resolvePlatformRole(ctx.state.user!.id),
      action: "email.sent",
      resource_type: "email",
      resource_id: broadcastId,
      metadata: { subject: subjectTrimmed, sent, failed, total },
    });

    return new Response(
      JSON.stringify({ sent, failed, total, broadcastId }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  },
});
