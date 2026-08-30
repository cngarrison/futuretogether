import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import GroupEmailComposeForm from "@/islands/GroupEmailComposeForm.tsx";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmailSendPrefill {
  id: string;
  subject: string;
  body_markdown: string;
}

interface PageData {
  groupName: string;
  groupSlug: string;
  groupId: string;
  recipientCount: number;
  optedOutCount: number;
  emailsThisWeek: number;
  adminEmail: string;
  initialSubject: string;
  initialMarkdown: string;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const handler = define.handlers<PageData>({
  async GET(ctx) {
    const group = ctx.state.group!;
    const groupId = group.id;
    const groupSlug = group.slug;
    const groupName = group.name;
    const db = ctx.state.supabaseClient!;
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const [optInRes, totalActiveRes, emailsRes] = await Promise.all([
      db
        .from("group_memberships")
        .select("*", { count: "exact", head: true })
        .eq("group_id", groupId)
        .eq("status", "active")
        .eq("email_opt_in", true),
      db
        .from("group_memberships")
        .select("*", { count: "exact", head: true })
        .eq("group_id", groupId)
        .eq("status", "active"),
      db
        .from("email_sends")
        .select("*", { count: "exact", head: true })
        .eq("group_id", groupId)
        .gte("sent_at", sevenDaysAgo),
    ]);

    const recipientCount = optInRes.count ?? 0;
    const totalActive = totalActiveRes.count ?? 0;
    const optedOutCount = totalActive - recipientCount;
    const emailsThisWeek = emailsRes.count ?? 0;

    // Handle ?from={id} prefill — fetch a previous send to pre-populate subject/body
    let initialSubject = "";
    let initialMarkdown = "";
    const fromId = ctx.url.searchParams.get("from");
    if (fromId) {
      try {
        const { data: sendRow, error: prefillError } = await db
          .from("email_sends")
          .select("id, subject, body_markdown")
          .eq("id", fromId)
          .eq("group_id", groupId)
          .maybeSingle();
        if (prefillError) {
          console.error("EmailCompose: prefill fetch error", prefillError);
        }
        if (sendRow) {
          const row = sendRow as EmailSendPrefill;
          initialSubject = row.subject ?? "";
          initialMarkdown = row.body_markdown ?? "";
        }
      } catch (err) {
        console.error("EmailCompose: prefill exception", err);
      }
    }

    return page({
      groupName,
      groupSlug,
      groupId,
      recipientCount,
      optedOutCount,
      emailsThisWeek,
      adminEmail: ctx.state.profile?.email ?? "",
      initialSubject,
      initialMarkdown,
    });
  },
});

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default define.page<typeof handler>(function EmailComposePage(
  { data },
) {
  const {
    groupName,
    groupSlug,
    groupId,
    recipientCount,
    optedOutCount,
    emailsThisWeek,
    adminEmail,
    initialSubject,
    initialMarkdown,
  } = data as PageData;

  const atLimit = emailsThisWeek >= 5;
  const nearLimit = emailsThisWeek >= 4 && emailsThisWeek < 5;

  return (
    <>
      <Head>
        <title>Email members — {groupName} — Future Together</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Heading row */}
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl sm:text-3xl font-bold text-near-black">
            Email members
          </h1>
          <a
            f-client-nav={false}
            href={`/groups/${groupSlug}/admin/email/history/`}
            class="text-sm text-primary font-medium transition-opacity hover:opacity-70"
          >
            ← Email history
          </a>
        </div>

        {/* Rate limit warning */}
        {atLimit && (
          <div
            class="mb-5 p-3 rounded-lg text-sm font-medium"
            style="background-color: #fff8e6; color: #7a5a00; border: 1px solid #f0d78a;"
          >
            ⚠ Weekly limit reached. You cannot send more emails until 7 days
            after your oldest recent send.
          </div>
        )}
        {nearLimit && (
          <div
            class="mb-5 p-3 rounded-lg text-sm font-medium"
            style="background-color: #fff8e6; color: #7a5a00; border: 1px solid #f0d78a;"
          >
            ⚠ You’ve sent {emailsThisWeek}{" "}
            emails this week. Limit is 5 per week.
          </div>
        )}

        {/* Recipient info */}
        <p class="text-sm mb-6" style="color: rgba(28,26,24,0.6);">
          Will send to <strong class="text-near-black">{recipientCount}</strong>
          {" "}
          member{recipientCount !== 1 ? "s" : ""}
          {optedOutCount > 0 && <>({optedOutCount} opted out)</>}
        </p>

        {/* Compose form island */}
        <GroupEmailComposeForm
          groupSlug={groupSlug}
          groupId={groupId}
          recipientCount={recipientCount}
          optedOutCount={optedOutCount}
          adminEmail={adminEmail}
          initialSubject={initialSubject}
          initialMarkdown={initialMarkdown}
        />
      </div>
    </>
  );
});
