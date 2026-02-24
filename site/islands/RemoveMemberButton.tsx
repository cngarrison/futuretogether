/**
 * RemoveMemberButton island — soft-removes a member from the community.
 * Mirrors the CancelRegistrationButton pattern used on staff event pages.
 */

import { useSignal } from "@preact/signals";

interface Props {
  memberId: string;
  memberEmail: string;
}

export default function RemoveMemberButton({ memberId, memberEmail }: Props) {
  const state = useSignal<"idle" | "confirming" | "loading" | "done" | "error">(
    "idle",
  );
  const errorMsg = useSignal("");

  async function handleRemove() {
    state.value = "loading";
    try {
      const res = await fetch(`/api/staff/members/${memberId}/remove`, {
        method: "POST",
      });
      if (res.ok) {
        state.value = "done";
      } else {
        const text = await res.text();
        errorMsg.value = text || "Remove failed";
        state.value = "error";
      }
    } catch {
      errorMsg.value = "Network error";
      state.value = "error";
    }
  }

  if (state.value === "done") {
    return (
      <span class="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-500">
        Removed
      </span>
    );
  }

  if (state.value === "error") {
    return <span class="text-xs text-red-600">{errorMsg.value}</span>;
  }

  if (state.value === "confirming") {
    return (
      <div class="flex flex-col items-left gap-2">
        <span class="text-xs text-gray-600">Remove {memberEmail}?</span>
        <div class="flex items-center gap-2">
          <button
            onClick={handleRemove}
            class="text-xs px-2 py-1 rounded text-white"
            style="background-color: #dc2626;"
          >
            Yes, remove
          </button>
          <button
            onClick={() => state.value = "idle"}
            class="text-xs px-2 py-1 rounded border border-gray-300 text-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (state.value === "loading") {
    return <span class="text-xs text-gray-400">Removing…</span>;
  }

  return (
    <button
      onClick={() => state.value = "confirming"}
      class="text-xs text-red-600 hover:underline"
    >
      Remove
    </button>
  );
}
