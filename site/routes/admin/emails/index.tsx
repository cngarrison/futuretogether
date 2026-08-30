import { define } from "@/utils.ts";
import { page } from "fresh";
import { getEmailBroadcasts } from "@/utils/db/email-sends.ts";

/**
 * Admin email broadcast list — /admin/emails
 * Lists all past bulk emails, newest first.
 */

type Broadcast = Awaited<ReturnType<typeof getEmailBroadcasts>>[number];

interface PageData {
  broadcasts: Broadcast[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const handler = define.handlers<PageData>({
  async GET(ctx) {
    const broadcasts = await getEmailBroadcasts(ctx.state);
    ctx.state.adminBreadcrumbs = [{ label: "Emails" }];
    return page({ broadcasts });
  },
});

export default define.page<typeof handler>(function EmailList({ data }) {
  const { broadcasts } = data as PageData;

  return (
    <div class="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div class="flex justify-between items-start mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Email Broadcasts</h1>
          <p class="text-sm text-gray-500 mt-1">
            {broadcasts.length === 0
              ? "No emails sent yet"
              : `${broadcasts.length} email${
                broadcasts.length !== 1 ? "s" : ""
              } sent`}
          </p>
        </div>
        <a
          f-client-nav={false}
          href="/admin/emails/compose"
          class="px-4 py-2 rounded-md text-white text-sm font-semibold bg-accent"
        >
          Compose new
        </a>
      </div>

      {/* Empty state */}
      {broadcasts.length === 0
        ? (
          <div class="text-center py-16 text-gray-400">
            <p class="text-lg font-medium text-gray-500">
              No emails sent yet.
            </p>
            <p class="text-sm mt-2">
              <a
                f-client-nav={false}
                href="/admin/emails/compose"
                class="text-primary hover:underline"
              >
                Compose your first member email →
              </a>
            </p>
          </div>
        )
        : (
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b-2 border-gray-200">
                <th class="text-left py-2 pr-4 font-semibold text-gray-600">
                  Subject
                </th>
                <th class="text-left py-2 pr-4 font-semibold text-gray-600 whitespace-nowrap">
                  Sent
                </th>
                <th class="text-left py-2 pr-4 font-semibold text-gray-600">
                  Delivered
                </th>
                <th class="text-right py-2 font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {broadcasts.map((b) => (
                <tr
                  key={b.id}
                  class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td class="py-3 pr-4">
                    <a
                      f-client-nav={false}
                      href={`/admin/emails/${b.id}`}
                      class="font-medium text-primary hover:underline"
                    >
                      {b.subject}
                    </a>
                  </td>
                  <td class="py-3 pr-4 text-gray-500 whitespace-nowrap">
                    {formatDate(b.sentAt)}
                  </td>
                  <td class="py-3 pr-4">
                    <span
                      class={b.failedCount > 0
                        ? "font-medium text-amber-600"
                        : "text-green-700"}
                    >
                      {b.sentCount}/{b.recipientCount}
                    </span>
                    {b.failedCount > 0 && (
                      <span class="text-red-500 ml-2 text-xs">
                        ({b.failedCount} failed)
                      </span>
                    )}
                  </td>
                  <td class="py-3 text-right">
                    <a
                      f-client-nav={false}
                      href={`/admin/emails/compose?from=${b.id}`}
                      class="text-sm font-medium text-accent hover:underline"
                    >
                      Duplicate
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
  );
});
