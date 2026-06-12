import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { marked } from "marked";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SentByProfile {
  name_first: string | null;
  name_last: string | null;
}

interface EmailSendRow {
  id: string;
  subject: string;
  body_markdown: string;
  sent_at: string;
  recipient_count: number | null;
  sent_count: number | null;
  profiles: SentByProfile | null;
}

interface PageData {
  send: EmailSendRow;
  contentHtml: string;
  groupName: string;
  groupSlug: string;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const handler = define.handlers<PageData>({
  async GET(ctx) {
    const group = ctx.state.group!;
    const db = ctx.state.supabaseClient!;

    const { data, error } = await db
      .from("email_sends")
      .select("*, profiles!sent_by_id(name_first, name_last)")
      .eq("id", ctx.params.id)
      .eq("group_id", group.id)
      .maybeSingle();

    if (error) {
      console.error("EmailSendDetail: fetch error", error);
    }

    if (!data) {
      return new Response("Not found", { status: 404 });
    }

    const send = data as EmailSendRow;
    const contentHtml = await marked.parse(send.body_markdown ?? "");

    return page({
      send,
      contentHtml,
      groupName: group.name,
      groupSlug: group.slug,
    });
  },
});

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default define.page<typeof handler>(function EmailSendDetailPage(
  { data },
) {
  const { send, contentHtml, groupName, groupSlug } = data as PageData;

  const sentDate = new Date(send.sent_at).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const senderName = [send.profiles?.name_first, send.profiles?.name_last]
    .filter(Boolean)
    .join(" ") || "—";

  return (
    <>
      <Head>
        <title>{send.subject} — Email — {groupName} — Future Together</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Back link */}
        <a
          href={`/groups/${groupSlug}/admin/email/history/`}
          class="inline-block text-sm font-medium mb-6 transition-opacity hover:opacity-70"
          style="color: #1a5f6e;"
        >
          ← Email history
        </a>

        {/* Subject heading */}
        <h1 class="text-2xl sm:text-3xl font-bold text-near-black mb-4">
          {send.subject}
        </h1>

        {/* Stats row */}
        <div
          class="flex flex-wrap gap-6 mb-8 text-sm pb-6"
          style="color: rgba(28,26,24,0.6); border-bottom: 1px solid #e0dbd3;"
        >
          <span>{sentDate}</span>
          {send.recipient_count != null && (
            <span>
              {send.sent_count != null
                ? `${send.sent_count} of ${send.recipient_count} delivered`
                : `${send.recipient_count} recipients`}
            </span>
          )}
          <span>
            Sent by: <strong class="text-near-black">{senderName}</strong>
          </span>
        </div>

        {/* Email content preview */}
        <div class="mb-8">
          <h2
            class="text-xs font-semibold uppercase tracking-wider mb-3"
            style="color: rgba(28,26,24,0.4);"
          >
            Email content
          </h2>
          <div
            class="rounded-lg border p-6 bg-white prose prose-sm max-w-none"
            style="border-color: #e0dbd3;"
            // deno-lint-ignore react-no-danger
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>

        {/* Compose similar */}
        <a
          href={`/groups/${groupSlug}/admin/email/?from=${send.id}`}
          class="inline-block text-sm font-medium transition-opacity hover:opacity-70"
          style="color: #1a5f6e;"
        >
          Compose similar →
        </a>
      </div>
    </>
  );
});
