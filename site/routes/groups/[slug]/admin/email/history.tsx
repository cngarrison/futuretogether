import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getGroupEmailHistory } from "@/utils/db/groups.ts";
import type { GroupEmailSend } from "@/utils/db/groups.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageData {
  groupName: string;
  groupSlug: string;
  history: GroupEmailSend[];
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const handler = define.handlers<PageData>({
  async GET(ctx) {
    const group = ctx.state.group!;
    const history = await getGroupEmailHistory(group.id, ctx.state);
    return page({
      groupName: group.name,
      groupSlug: group.slug,
      history,
    });
  },
});

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default define.page<typeof handler>(function EmailHistoryPage(
  { data },
) {
  const { groupName, groupSlug, history } = data as PageData;

  return (
    <>
      <Head>
        <title>Email history — {groupName} — Future Together</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Heading row */}
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl sm:text-3xl font-bold text-near-black">
            Email history
          </h1>
          <a
            href={`/groups/${groupSlug}/admin/email/`}
            class="text-sm text-primary font-medium transition-opacity hover:opacity-70"
          >
            Compose new →
          </a>
        </div>

        {/* Empty state */}
        {history.length === 0
          ? (
            <div
              class="rounded-lg border p-10 text-center"
              style="border-color: #e0dbd3; background: white;"
            >
              <p class="text-sm mb-2" style="color: rgba(28,26,24,0.5);">
                No emails sent yet.
              </p>
              <a
                href={`/groups/${groupSlug}/admin/email/`}
                class="text-sm text-primary font-medium"
              >
                Compose your first email →
              </a>
            </div>
          )
          : (
            <div
              class="rounded-lg border overflow-hidden"
              style="border-color: #e0dbd3;"
            >
              <table class="w-full text-sm">
                <thead style="background: #f7f4ef; border-bottom: 1px solid #e0dbd3;">
                  <tr>
                    <th
                      class="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style="color: rgba(28,26,24,0.5);"
                    >
                      Date sent
                    </th>
                    <th
                      class="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style="color: rgba(28,26,24,0.5);"
                    >
                      Subject
                    </th>
                    <th
                      class="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style="color: rgba(28,26,24,0.5);"
                    >
                      Recipients
                    </th>
                    <th class="px-4 py-3" />
                  </tr>
                </thead>
                <tbody style="background: white;">
                  {history.map((send, i) => {
                    const date = new Date(send.sent_at).toLocaleDateString(
                      "en-AU",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    );
                    const recipients =
                      send.sent_count != null && send.recipient_count != null
                        ? `${send.sent_count} / ${send.recipient_count}`
                        : String(send.recipient_count ?? "—");

                    return (
                      <tr
                        key={send.id}
                        style={i < history.length - 1
                          ? "border-bottom: 1px solid #e0dbd3;"
                          : ""}
                      >
                        <td
                          class="px-4 py-3 whitespace-nowrap"
                          style="color: rgba(28,26,24,0.6);"
                        >
                          {date}
                        </td>
                        <td class="px-4 py-3 font-medium text-near-black">
                          <a
                            href={`/groups/${groupSlug}/admin/email/${send.id}/`}
                            class="text-primary"
                          >
                            {send.subject}
                          </a>
                        </td>
                        <td
                          class="px-4 py-3"
                          style="color: rgba(28,26,24,0.6);"
                        >
                          {recipients}
                        </td>
                        <td class="px-4 py-3 text-right">
                          <a
                            href={`/groups/${groupSlug}/admin/email/${send.id}/`}
                            class="text-xs text-primary font-medium transition-opacity hover:opacity-70"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </>
  );
});
