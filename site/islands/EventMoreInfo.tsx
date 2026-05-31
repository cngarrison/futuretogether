import { useSignal } from "@preact/signals";

interface Props {
  html: string;
  label?: string;
}

export default function EventMoreInfo(
  { html, label = "More information" }: Props,
) {
  const open = useSignal(false);

  return (
    <div
      class="bg-white rounded-2xl overflow-hidden"
      style="border: 1px solid #d0e4e7;"
    >
      {/* Toggle button */}
      <button
        type="button"
        class="w-full flex items-center justify-between p-8 text-left"
        onClick={() => (open.value = !open.value)}
        aria-expanded={open.value}
      >
        <span
          class="text-xl font-bold"
          style="color: #1a5f6e;"
        >
          {label}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="#1a5f6e"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          style={{
            transform: open.value ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <path d="M2 5l6 6 6-6" />
        </svg>
      </button>

      {/* Collapsible content */}
      {open.value && (
        <div
          class="px-8 pb-8"
        >
          <div
            class="prose max-w-none"
            style="--tw-prose-headings: #1a5f6e;"
            // deno-lint-ignore react-no-danger
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )}
    </div>
  );
}
