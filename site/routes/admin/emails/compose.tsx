import { page } from "fresh";
import { define } from "@/utils.ts";
import { getActiveMembersAdmin } from "@/utils/db/group-members.ts";
import { getEmailBroadcastById } from "@/utils/db/email-sends.ts";
import EmailComposeForm from "@/islands/EmailComposeForm.tsx";

/**
 * Admin email composer — /admin/emails/compose
 *
 * Supports ?from={id} to pre-fill subject and body from a previous broadcast.
 * Loads the live active member count from KV for the send button label.
 */

export const handler = define.handlers({
  async GET(ctx) {
    const members = await getActiveMembersAdmin();
    const memberCount = members.length;

    let initialSubject = "";
    let initialMarkdown = "";

    const fromId = ctx.url.searchParams.get("from");
    if (fromId) {
      const broadcast = await getEmailBroadcastById(fromId, ctx.state);
      if (broadcast) {
        initialSubject = broadcast.subject;
        initialMarkdown = broadcast.bodyMarkdown;
      }
    }

    ctx.state.adminBreadcrumbs = [
      { label: "Emails", href: "/admin/emails" },
      { label: "Compose" },
    ];
    return page({ memberCount, initialSubject, initialMarkdown });
  },
});

export default define.page<typeof handler>(function EmailCompose({ data }) {
  const { memberCount, initialSubject, initialMarkdown } = data;

  return (
    <div class="max-w-3xl mx-auto px-6 py-10">
      {/* Page header */}
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Compose Email</h1>
        <p class="text-sm text-gray-500 mt-1">
          Write in Markdown — send to all active members
        </p>
      </div>

      {memberCount === 0
        ? (
          <div
            class="p-4 rounded-md text-sm"
            style="background-color: #fef9ec; border: 1px solid #c4853a; color: #92400e;"
          >
            No active members found. Emails can be sent once members have
            joined.
          </div>
        )
        : (
          <EmailComposeForm
            memberCount={memberCount}
            initialSubject={initialSubject}
            initialMarkdown={initialMarkdown}
          />
        )}
    </div>
  );
});
