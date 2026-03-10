import { page } from "fresh";
import { define } from "@/utils.ts";
import { getActiveMembers } from "@/utils/members.ts";
import { getEmailBroadcastById } from "@/utils/emailBroadcast.ts";
import EmailComposeForm from "@/islands/EmailComposeForm.tsx";

/**
 * Staff email composer — /staff/emails/compose
 *
 * Supports ?from={id} to pre-fill subject and body from a previous broadcast.
 * Loads the live active member count from KV for the send button label.
 */

export const handler = define.handlers({
  async GET(ctx) {
    const members = await getActiveMembers();
    const memberCount = members.length;

    let initialSubject = "";
    let initialMarkdown = "";

    const fromId = ctx.url.searchParams.get("from");
    if (fromId) {
      const broadcast = await getEmailBroadcastById(fromId);
      if (broadcast) {
        initialSubject = broadcast.subject;
        initialMarkdown = broadcast.markdown;
      }
    }

    return page({ memberCount, initialSubject, initialMarkdown });
  },
});

export default define.page<typeof handler>(function EmailCompose({ data }) {
  const { memberCount, initialSubject, initialMarkdown } = data;

  return (
    <div class="min-h-screen bg-gray-100">
      <div class="max-w-3xl mx-auto px-4 py-12">
        <div class="bg-white rounded-lg shadow-lg p-8">
          {/* Page header */}
          <div class="flex justify-between items-start mb-8">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Compose Email</h1>
              <p class="text-sm text-gray-500 mt-1">
                Write in Markdown — send to all active members
              </p>
            </div>
            <a
              href="/staff/emails"
              class="text-sm font-medium hover:underline shrink-0"
              style="color: #1a5f6e;"
            >
              ← All emails
            </a>
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
      </div>
    </div>
  );
});
