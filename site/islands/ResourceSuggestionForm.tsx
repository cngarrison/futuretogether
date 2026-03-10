import { signal } from "@preact/signals";
import { useRef } from "preact/hooks";

const CATEGORIES = [
  "Perspectives",
  "Context & Frameworks",
  "Preparation & Resilience",
  "Stay Informed",
  "Not sure — you decide",
];

interface FormState {
  status: "idle" | "submitting" | "success" | "error";
  errorMessage: string;
}

const state = signal<FormState>({ status: "idle", errorMessage: "" });

export default function ResourceSuggestionForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;

    const data = new FormData(form);
    const url = (data.get("url") as string ?? "").trim();
    const title = (data.get("title") as string ?? "").trim();
    const why = (data.get("why") as string ?? "").trim();

    if (!url || !title || !why) {
      state.value = {
        status: "error",
        errorMessage: "Please fill in all required fields.",
      };
      return;
    }

    state.value = { status: "submitting", errorMessage: "" };

    try {
      const res = await fetch("/api/resources/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          title,
          why,
          category: (data.get("category") as string ?? "").trim() || undefined,
          name: (data.get("name") as string ?? "").trim() || undefined,
          email: (data.get("email") as string ?? "").trim() || undefined,
        }),
      });

      if (res.ok) {
        state.value = { status: "success", errorMessage: "" };
        form.reset();
      } else {
        const text = await res.text();
        state.value = {
          status: "error",
          errorMessage: text || "Something went wrong. Please try again.",
        };
      }
    } catch {
      state.value = {
        status: "error",
        errorMessage:
          "Network error. Please check your connection and try again.",
      };
    }
  };

  const { status, errorMessage } = state.value;

  if (status === "success") {
    return (
      <div
        class="rounded-xl p-6 text-center"
        style="background-color: #eef5f7; border: 1px solid #d0e4e7;"
      >
        <div
          class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl"
          style="background-color: #1a5f6e;"
        >
          ✓
        </div>
        <h3 class="text-lg font-bold mb-2" style="color: #1c1a18;">
          Thanks for the suggestion!
        </h3>
        <p class="text-sm leading-relaxed" style="color: rgba(28,26,24,0.7);">
          We'll take a look and add it to the list if it's a good fit.
        </p>
      </div>
    );
  }

  const isSubmitting = status === "submitting";

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      class="flex flex-col gap-5"
      noValidate
    >
      {/* URL */}
      <div>
        <label
          for="suggest-url"
          class="block text-sm font-semibold mb-1.5"
          style="color: #1c1a18;"
        >
          URL <span style="color: #c4853a;">*</span>
        </label>
        <input
          id="suggest-url"
          name="url"
          type="url"
          placeholder="https://"
          required
          disabled={isSubmitting}
          class="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
          style="border: 1px solid #d0e4e7; background: white; color: #1c1a18;"
        />
      </div>

      {/* Title */}
      <div>
        <label
          for="suggest-title"
          class="block text-sm font-semibold mb-1.5"
          style="color: #1c1a18;"
        >
          Title <span style="color: #c4853a;">*</span>
        </label>
        <input
          id="suggest-title"
          name="title"
          type="text"
          placeholder="Name of the article, video, or site"
          required
          disabled={isSubmitting}
          class="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
          style="border: 1px solid #d0e4e7; background: white; color: #1c1a18;"
        />
      </div>

      {/* Why */}
      <div>
        <label
          for="suggest-why"
          class="block text-sm font-semibold mb-1.5"
          style="color: #1c1a18;"
        >
          Why should we include this? <span style="color: #c4853a;">*</span>
        </label>
        <p class="text-xs mb-2" style="color: rgba(28,26,24,0.5);">
          What makes it useful? Who is it for? Why did it matter to you?
        </p>
        <textarea
          id="suggest-why"
          name="why"
          rows={4}
          required
          disabled={isSubmitting}
          placeholder="A short explanation of why this is worth reading, watching, or using…"
          class="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors resize-y"
          style="border: 1px solid #d0e4e7; background: white; color: #1c1a18;"
        />
      </div>

      {/* Category (optional) */}
      <div>
        <label
          for="suggest-category"
          class="block text-sm font-semibold mb-1.5"
          style="color: #1c1a18;"
        >
          Suggested category{" "}
          <span class="font-normal" style="color: rgba(28,26,24,0.45);">
            — optional
          </span>
        </label>
        <div class="relative">
          <select
            id="suggest-category"
            name="category"
            disabled={isSubmitting}
            class="w-full appearance-none rounded-lg px-4 py-2.5 text-sm outline-none transition-colors pr-10"
            style="border: 1px solid #d0e4e7; background: white; color: #1c1a18;"
          >
            <option value="">— choose one if you like —</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span
            class="pointer-events-none absolute inset-y-0 right-3 flex items-center"
            style="color: rgba(28,26,24,0.4);"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>
      </div>

      {/* Name + Email (optional) */}
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label
            for="suggest-name"
            class="block text-sm font-semibold mb-1.5"
            style="color: #1c1a18;"
          >
            Your name{" "}
            <span class="font-normal" style="color: rgba(28,26,24,0.45);">
              — optional
            </span>
          </label>
          <input
            id="suggest-name"
            name="name"
            type="text"
            placeholder="First name is fine"
            disabled={isSubmitting}
            class="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
            style="border: 1px solid #d0e4e7; background: white; color: #1c1a18;"
          />
        </div>
        <div>
          <label
            for="suggest-email"
            class="block text-sm font-semibold mb-1.5"
            style="color: #1c1a18;"
          >
            Your email{" "}
            <span class="font-normal" style="color: rgba(28,26,24,0.45);">
              — optional
            </span>
          </label>
          <input
            id="suggest-email"
            name="email"
            type="email"
            placeholder="In case we have questions"
            disabled={isSubmitting}
            class="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
            style="border: 1px solid #d0e4e7; background: white; color: #1c1a18;"
          />
        </div>
      </div>

      {/* Error */}
      {status === "error" && errorMessage && (
        <p
          class="text-sm rounded-lg px-4 py-3"
          style="background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca;"
        >
          {errorMessage}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        class="inline-flex items-center justify-center gap-2 w-full px-6 py-3 text-white font-semibold rounded-xl transition-opacity hover:opacity-90 disabled:opacity-60"
        style="background-color: #c4853a;"
      >
        {isSubmitting
          ? (
            <>
              <svg
                class="animate-spin"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                aria-hidden="true"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Sending…
            </>
          )
          : (
            "Submit suggestion →"
          )}
      </button>
    </form>
  );
}
