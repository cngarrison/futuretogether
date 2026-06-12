/**
 * site/islands/ResourcesEditor.tsx
 *
 * Minimal island for add/remove/edit resource rows.
 * Serialises resources as JSON into a hidden <input name="resources">.
 * Used by the instance override form in [id]/index.tsx.
 */
import { useSignal } from "@preact/signals";
import type { EventResource } from "@/utils/db/group-events.ts";

/*
interface ResourceItem {
  label: string;
  url: string;
  type: "download" | "link";
  description: string;
}
 */

interface ResourcesEditorProps {
  initialResources?: EventResource[];
}

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5f6e]/30 focus:border-[#1a5f6e]";
const labelClass = "block text-sm font-medium text-near-black mb-1.5";

export default function ResourcesEditor(
  { initialResources }: ResourcesEditorProps,
) {
  const resources = useSignal<EventResource[]>(
    initialResources?.map((r) => ({
      label: r.label ?? "",
      url: r.url ?? "",
      type: r.type ?? "link",
      description: r.description ?? "",
    })) ?? [],
  );

  function addResource() {
    resources.value = [
      ...resources.value,
      { label: "", url: "", type: "link", description: "" },
    ];
  }

  function removeResource(idx: number) {
    resources.value = resources.value.filter((_, i) => i !== idx);
  }

  function updateResource(
    idx: number,
    field: keyof EventResource,
    value: string,
  ) {
    resources.value = resources.value.map((r, i) =>
      i === idx ? { ...r, [field]: value } : r
    );
  }

  return (
    <div>
      {/* Serialise as JSON for form submission */}
      <input
        type="hidden"
        name="resources"
        value={JSON.stringify(resources.value)}
      />

      <div class="space-y-4">
        {resources.value.map((res, idx) => (
          <div
            key={idx}
            class="border border-gray-100 rounded-xl p-4 relative"
          >
            <button
              type="button"
              onClick={() => removeResource(idx)}
              class="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors text-sm leading-none"
              aria-label="Remove resource"
            >
              ✕
            </button>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
              <div>
                <label class={labelClass}>Label</label>
                <input
                  type="text"
                  value={res.label}
                  onInput={(e) =>
                    updateResource(
                      idx,
                      "label",
                      (e.target as HTMLInputElement).value,
                    )}
                  class={inputClass}
                  placeholder="e.g. Slide deck"
                />
              </div>
              <div>
                <label class={labelClass}>URL</label>
                <input
                  type="url"
                  value={res.url}
                  onInput={(e) =>
                    updateResource(
                      idx,
                      "url",
                      (e.target as HTMLInputElement).value,
                    )}
                  class={inputClass}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label class={labelClass}>Type</label>
                <select
                  value={res.type}
                  onChange={(e) =>
                    updateResource(
                      idx,
                      "type",
                      (e.target as HTMLSelectElement).value,
                    )}
                  class={inputClass}
                >
                  <option value="link">Link</option>
                  <option value="download">Download</option>
                </select>
              </div>
              <div>
                <label class={labelClass}>Description (optional)</label>
                <input
                  type="text"
                  value={res.description}
                  onInput={(e) =>
                    updateResource(
                      idx,
                      "description",
                      (e.target as HTMLInputElement).value,
                    )}
                  class={inputClass}
                  placeholder="Brief description"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addResource}
        class="mt-4 text-sm font-medium hover:underline"
        style="color:#1a5f6e;"
      >
        + Add resource
      </button>
    </div>
  );
}
