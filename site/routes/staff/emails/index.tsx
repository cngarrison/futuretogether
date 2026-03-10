import { define } from "@/utils.ts";
import { getEmailBroadcasts } from "@/utils/emailBroadcast.ts";

/**
 * Staff email broadcast list — /staff/emails
 * Lists all past bulk emails, newest first.
 */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default define.page(async function EmailList() {
  const broadcasts = await getEmailBroadcasts();

  return (
    <div class="min-h-screen bg-gray-100">
      <div class="max-w-4xl mx-auto px-4 py-12">
        <div class="bg-white rounded-lg shadow-lg p-8">
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
            <div class="flex items-center gap-4">
              <a
                href="/staff"
                class="text-sm font-medium hover:underline"
                style="color: #1a5f6e;"
              >
                ← Dashboard
              </a>
              <a
                href="/staff/emails/compose"
                class="px-4 py-2 rounded-md text-white text-sm font-semibold"
                style="background-color: #c4853a;"
              >
                Compose new
              </a>
            </div>
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
                    href="/staff/emails/compose"
                    class="hover:underline"
                    style="color: #1a5f6e;"
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
                          href={`/staff/emails/${b.id}`}
                          class="font-medium hover:underline"
                          style="color: #1a5f6e;"
                        >
                          {b.subject}
                        </a>
                      </td>
                      <td class="py-3 pr-4 text-gray-500 whitespace-nowrap">
                        {formatDate(b.sentAt)}
                      </td>
                      <td class="py-3 pr-4">
                        <span
                          class={b.failed > 0
                            ? "font-medium text-amber-600"
                            : "text-green-700"}
                        >
                          {b.sent}/{b.total}
                        </span>
                        {b.failed > 0 && (
                          <span class="text-red-500 ml-2 text-xs">
                            ({b.failed} failed)
                          </span>
                        )}
                      </td>
                      <td class="py-3 text-right">
                        <a
                          href={`/staff/emails/compose?from=${b.id}`}
                          class="text-sm font-medium hover:underline"
                          style="color: #c4853a;"
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
      </div>
    </div>
  );
});
