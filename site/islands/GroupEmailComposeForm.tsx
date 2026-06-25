import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { marked } from "marked";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  groupSlug: string;
  groupId: string;
  recipientCount: number;
  optedOutCount: number;
  adminEmail: string;
  initialSubject?: string;
  initialMarkdown?: string;
}

interface SendResult {
  sent: number;
  failed: number;
  total: number;
  testOnly?: boolean;
  to?: string;
  sendId?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Island
// ---------------------------------------------------------------------------

export default function GroupEmailComposeForm({
  groupSlug,
  groupId,
  recipientCount,
  adminEmail,
  initialSubject = "",
  initialMarkdown = "",
}: Props) {
  const subject = useSignal(initialSubject);
  const body = useSignal(initialMarkdown);

  // Sync props into signals after hydration (same pattern as EmailComposeForm)
  useEffect(() => {
    if (initialSubject) subject.value = initialSubject;
    if (initialMarkdown) body.value = initialMarkdown;
  }, [initialSubject, initialMarkdown]);

  const tab = useSignal<"write" | "preview">("write");
  const sending = useSignal(false);
  const result = useSignal<SendResult | null>(null);
  const error = useSignal<string | null>(null);

  function previewHtml(): string {
    try {
      return marked.parse(body.value, { async: false }) as string;
    } catch (e) {
      console.error("GroupEmail preview error:", e);
      return "<p><em>Preview unavailable — check console for details.</em></p>";
    }
  }

  async function send(testOnly: boolean) {
    if (!subject.value.trim() || !body.value.trim()) {
      error.value = "Subject and message body are required.";
      return;
    }
    if (
      !testOnly &&
      !confirm(
        `Send to ${recipientCount} member${recipientCount !== 1 ? "s" : ""}?`,
      )
    ) {
      return;
    }

    sending.value = true;
    error.value = null;
    result.value = null;

    try {
      const res = await fetch(
        `/api/groups/${groupSlug}/admin/email/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: subject.value,
            markdown: body.value,
            testOnly,
            groupId,
          }),
        },
      );
      const data = await res.json() as SendResult;
      if (!res.ok) {
        error.value = data.error ?? "Send failed. Check the server logs.";
      } else {
        result.value = data;
        // Clear form on a successful real send
        if (!testOnly) {
          subject.value = "";
          body.value = "";
          tab.value = "write";
        }
      }
    } catch {
      error.value = "Network error. Please try again.";
    } finally {
      sending.value = false;
    }
  }

  return (
    <div>
      {/* Subject line */}
      <div class="mb-5">
        <label
          for="email-subject"
          class="block text-sm font-semibold text-gray-700 mb-1"
        >
          Subject
        </label>
        <input
          id="email-subject"
          type="text"
          value={subject.value}
          onInput={(e) => subject.value = (e.target as HTMLInputElement).value}
          class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-primary"
          placeholder="e.g. This week’s meetup agenda"
          disabled={sending.value}
        />
      </div>

      {/* Write / Preview tabs */}
      <div class="flex border-b border-gray-200">
        {(["write", "preview"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => tab.value = t}
            class={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab.value === t
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "write" ? "Write" : "Preview"}
          </button>
        ))}
      </div>

      {/* Write pane */}
      {tab.value === "write" && (
        <div>
          <textarea
            value={body.value}
            onInput={(e) =>
              body.value = (e.target as HTMLTextAreaElement).value}
            class="w-full border border-t-0 border-gray-300 rounded-b-md px-3 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:border-primary resize-y"
            rows={18}
            placeholder={`Write your email in Markdown.\n\nHi everyone,\n\nWe\'re meeting this week...\n\n\u2014 Your name`}
            disabled={sending.value}
          />
          <p class="text-xs text-gray-400 mt-1.5">
            Markdown: <code>**bold**</code>, <code>*italic*</code>,{" "}
            <code>[link](url)</code>, <code>## Heading</code>,{" "}
            <code>- list</code>
          </p>
        </div>
      )}

      {/* Preview pane */}
      {tab.value === "preview" && (
        <div class="border border-t-0 border-gray-300 rounded-b-md p-4 min-h-64 bg-white">
          {body.value.trim()
            ? (
              <div
                class="prose prose-sm max-w-none"
                // deno-lint-ignore react-no-danger
                dangerouslySetInnerHTML={{ __html: previewHtml() }}
              />
            )
            : (
              <p class="text-sm text-gray-400 italic">
                Nothing to preview yet. Switch to Write and add some content.
              </p>
            )}
        </div>
      )}

      {/* Error message */}
      {error.value && (
        <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error.value}
        </div>
      )}

      {/* Success message */}
      {result.value && (
        <div class="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          {result.value.testOnly
            ? (
              <p class="text-sm font-semibold text-green-800">
                ✓ Test sent to{" "}
                <span class="font-mono font-normal">
                  {result.value.to ?? adminEmail}
                </span>{" "}
                — check your inbox.
              </p>
            )
            : (
              <p class="text-sm font-semibold text-green-800">
                ✓ Sent — {result.value.sent} of {result.value.total}{" "}
                delivered successfully.
              </p>
            )}
          {(result.value.failed ?? 0) > 0 && (
            <p class="text-sm text-red-600 mt-1">
              {result.value.failed} failed — check server logs.
            </p>
          )}
        </div>
      )}

      {/* Footer: action buttons */}
      <div class="mt-6 flex items-center justify-end gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => send(true)}
          disabled={sending.value}
          class="px-4 py-2 rounded-md text-sm text-primary font-semibold bg-white border border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {sending.value ? "Sending…" : "Send test to me"}
        </button>
        <button
          type="button"
          onClick={() => send(false)}
          disabled={sending.value || recipientCount === 0}
          class="px-6 py-2 rounded-md text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity bg-primary"
        >
          {sending.value
            ? "Sending…"
            : `Send to ${recipientCount} member${
              recipientCount !== 1 ? "s" : ""
            }`}
        </button>
      </div>
    </div>
  );
}
