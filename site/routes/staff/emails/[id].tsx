import { page } from "fresh";
import { define } from "@/utils.ts";
import { marked } from "marked";
import { getEmailBroadcastById } from "@/utils/emailBroadcast.ts";

/**
 * Staff email broadcast detail — /staff/emails/:id
 * Shows the full content, delivery stats, and recipient list for a past broadcast.
 */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const handler = define.handlers({
  async GET(ctx) {
    const broadcast = await getEmailBroadcastById(ctx.params.id);
    if (!broadcast) {
      return new Response("Broadcast not found", { status: 404 });
    }
    const contentHtml = marked.parse(broadcast.markdown) as string;
    return page({ broadcast, contentHtml });
  },
});

export default define.page<typeof handler>(function BroadcastDetail({ data }) {
  const { broadcast, contentHtml } = data;

  return (
    <div class="min-h-screen bg-gray-100">
      <div class="max-w-3xl mx-auto px-4 py-12">
        <div class="bg-white rounded-lg shadow-lg p-8">

          {/* Header */}
          <div class="flex justify-between items-start mb-6">
            <div class="flex-1 min-w-0 pr-4">
              <a
                href="/staff/emails"
                class="text-sm font-medium hover:underline block mb-3"
                style="color: #1a5f6e;"
              >
                ← All emails
              </a>
              <h1 class="text-xl font-bold text-gray-900 truncate">{broadcast.subject}</h1>
              <p class="text-sm text-gray-500 mt-1">{formatDate(broadcast.sentAt)}</p>
            </div>
            <a
              href={`/staff/emails/compose?from=${broadcast.id}`}
              class="shrink-0 px-4 py-2 rounded-md text-sm font-semibold border hover:shadow-sm transition-shadow"
              style="color: #1a5f6e; border-color: #1a5f6e;"
            >
              Duplicate
            </a>
          </div>

          {/* Delivery stats */}
          <div class="flex gap-6 p-4 rounded-md mb-8 text-sm" style="background-color: #f7f4ef;">
            <div>
              <span class="font-semibold text-gray-800">{broadcast.total}</span>
              <span class="text-gray-500 ml-1">recipients</span>
            </div>
            <div>
              <span class="font-semibold text-green-700">{broadcast.sent}</span>
              <span class="text-gray-500 ml-1">delivered</span>
            </div>
            {broadcast.failed > 0 && (
              <div>
                <span class="font-semibold text-red-600">{broadcast.failed}</span>
                <span class="text-gray-500 ml-1">failed</span>
              </div>
            )}
          </div>

          {/* Email content preview */}
          <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Email content
          </h2>
          <div
            class="border border-gray-200 rounded-md p-5 prose prose-sm max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          {/* Recipient list */}
          <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Recipients ({broadcast.recipientEmails.length})
          </h2>
          <div
            class="border border-gray-200 rounded-md overflow-y-auto"
            style="max-height: 240px;"
          >
            {broadcast.recipientEmails.map((email) => (
              <div
                key={email}
                class="px-4 py-2 border-b border-gray-100 last:border-b-0 text-sm text-gray-600 font-mono"
              >
                {email}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
});
