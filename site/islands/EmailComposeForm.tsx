import { useSignal } from "@preact/signals";
import { marked } from "marked";

interface Props {
  memberCount: number;
  initialSubject?: string;
  initialMarkdown?: string;
}

const VARIABLE_HINT = "Available variables: {{firstName}}, {{lastName}}, {{fullName}}, {{email}}";

export default function EmailComposeForm(
  { memberCount, initialSubject = "", initialMarkdown = "" }: Props,
) {
  const subject = useSignal(initialSubject);
  const body = useSignal(initialMarkdown);
  const tab = useSignal<"write" | "preview">("write");
  const sending = useSignal(false);
  const result = useSignal<
    { sent: number; failed: number; total: number; testOnly?: boolean; to?: string } | null
  >(null);
  const error = useSignal<string | null>(null);

  function previewHtml(): string {
    try {
      // Replace {{vars}} with [var] placeholders before parsing.
      // marked v17 interprets {{...}} as JS template expressions and throws
      // a ReferenceError if the variable name doesn't exist in scope.
      const previewable = body.value; //.replace(/\{\{(\w+)\}\}/g, "[$1]");
      return marked.parse(previewable, { async: false }) as string;
    } catch (e) {
      console.error("Email preview error:", e);
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
        `Send this email to ${memberCount} active member${
          memberCount !== 1 ? "s" : ""
        }?`,
      )
    ) return;

    sending.value = true;
    error.value = null;
    result.value = null;

    try {
      const res = await fetch("/api/staff/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.value,
          markdown: body.value,
          testOnly,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        error.value = data.error ?? "Send failed. Check the server logs.";
      } else {
        result.value = data;
        // Clear form only on a real bulk send
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
          onInput={(e) =>
            subject.value = (e.target as HTMLInputElement).value}
          class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-[#1a5f6e]"
          placeholder="e.g. New resource: Suggested reading this week"
          disabled={sending.value}
        />
      </div>

      {/* Write / Preview tabs */}
      <div class="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => tab.value = "write"}
          class={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab.value === "write"
              ? "border-[#1a5f6e] text-[#1a5f6e]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => tab.value = "preview"}
          class={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab.value === "preview"
              ? "border-[#1a5f6e] text-[#1a5f6e]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Preview
        </button>
      </div>

      {/* Write pane */}
      {tab.value === "write" && (
        <div>
          <textarea
            value={body.value}
            onInput={(e) =>
              body.value = (e.target as HTMLTextAreaElement).value}
            class="w-full border border-t-0 border-gray-300 rounded-b-md px-3 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:border-[#1a5f6e] resize-y"
            rows={18}
            placeholder={`Write your email in Markdown.\n\nHi {{firstName}},\n\nWe've added a new resource this week...\n\n[Resource title](https://example.com)\n\nBring any questions to the next meetup.\n\n— Charlie`}
            disabled={sending.value}
          />
          <p class="text-xs text-gray-400 mt-1.5">
            Markdown: <code>**bold**</code>, <code>*italic*</code>,{" "}
            <code>[link](url)</code>, <code>## Heading</code>,{" "}
            <code>- list</code>
            <span class="mx-2">·</span>
            {VARIABLE_HINT}
          </p>
        </div>
      )}

      {/* Preview pane */}
      {tab.value === "preview" && (
        <div class="border border-t-0 border-gray-300 rounded-b-md p-4 min-h-64 bg-white">
          {body.value.trim()
            ? (
              <>
                <div
                  class="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewHtml() }}
                />
                <p class="mt-4 text-xs text-gray-400 border-t border-gray-100 pt-3">
                  {"\u26a0\ufe0f Variables ({{firstName}} etc.) will be substituted per member on send. Use \u2018Send test to me\u2019 to preview with real values."}
                </p>
              </>
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
                ✓ Test email sent to{" "}
                <span class="font-mono font-normal">{result.value.to}</span>
                {" "}— check your inbox.
              </p>
            )
            : (
              <p class="text-sm font-semibold text-green-800">
                ✓ Sent — {result.value.sent} of {result.value.total} delivered
                successfully.
              </p>
            )}
          {result.value.failed > 0 && (
            <p class="text-sm text-red-600 mt-1">
              {result.value.failed} failed — check server logs.
            </p>
          )}
        </div>
      )}

      {/* Footer: member count + action buttons */}
      <div class="mt-6 flex items-center justify-between gap-4 flex-wrap">
        <p class="text-sm text-gray-500">
          Sending to{" "}
          <strong class="text-gray-700">
            {memberCount} active member{memberCount !== 1 ? "s" : ""}
          </strong>
        </p>
        <div class="flex gap-3">
          <button
            type="button"
            onClick={() => send(true)}
            disabled={sending.value}
            class="px-4 py-2 rounded-md text-sm font-semibold border disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style="color: #1a5f6e; border-color: #1a5f6e; background: white;"
          >
            {sending.value ? "Sending…" : "Send test to me"}
          </button>
          <button
            type="button"
            onClick={() => send(false)}
            disabled={sending.value || memberCount === 0}
            class="px-6 py-2 rounded-md text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style="background-color: #c4853a;"
          >
            {sending.value
              ? "Sending…"
              : `Send to ${memberCount} member${memberCount !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
