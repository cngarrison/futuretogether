/**
 * Confirm + execute a group event registration cancellation.
 * Used on /groups/[slug]/events/[id]/cancel-registration
 *
 * Posts { token } to the API route and shows success or error inline.
 */
import { JSX } from "preact";
import { useState } from "preact/hooks";

interface Props {
  token: string;
  apiUrl: string; // POST /api/groups/[slug]/events/[id]/cancel-registration
  groupsUrl: string; // redirect after success
  eventTitle: string;
}

export default function GroupCancelRegistrationButton({
  token,
  apiUrl,
  groupsUrl,
  //eventTitle,
}: Props): JSX.Element {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleCancel = async () => {
    setStatus("loading");
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setStatus("success");
        return;
      }
      const data = await res.json() as { error?: string };
      setStatus("error");
      setErrorMsg(data.error ?? "Cancellation failed. Please try again.");
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div class="space-y-4">
        <div
          class="rounded-xl px-4 py-3 text-sm text-center"
          style="background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;"
        >
          <strong>Registration cancelled.</strong>{" "}
          You’ll receive a confirmation email shortly.
        </div>
        <a
          href={groupsUrl}
          class="block text-sm font-semibold text-center"
          style="color:#1a5f6e;"
        >
          Return to group &rarr;
        </a>
      </div>
    );
  }

  return (
    <div class="space-y-3">
      {status === "error" && (
        <p class="text-sm text-center" style="color:#dc2626;">{errorMsg}</p>
      )}
      <button
        type="button"
        onClick={handleCancel}
        disabled={status === "loading"}
        class="w-full px-4 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style="background:#dc2626;"
      >
        {status === "loading" ? "Cancelling…" : "Yes, cancel my registration"}
      </button>
      <a
        href={groupsUrl}
        class="block text-sm text-center"
        style="color:#1a5f6e;"
      >
        No, keep my registration &rarr;
      </a>
    </div>
  );
}
