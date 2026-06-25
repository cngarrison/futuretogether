/**
 * Inline registration form for a group event.
 * Calls POST /api/groups/[groupSlug]/events/[eventId]/register.
 * Used on the public group page (/groups/[slug]/) next to each event card.
 */
import { JSX } from "preact";
import { useState } from "preact/hooks";

interface Props {
  groupSlug: string;
  eventId: string;
  eventTitle: string;
  isLoggedIn?: boolean;
  /** True when the server confirmed this user is already registered. Show confirmation instead of form. */
  userIsRegistered?: boolean;
  userFirstName?: string;
  userLastName?: string;
  userEmail?: string;
}

export default function GroupEventRegistrationForm({
  groupSlug,
  eventId,
  eventTitle,
  isLoggedIn = false,
  userIsRegistered = false,
  userFirstName = "",
  userLastName = "",
  userEmail = "",
}: Props): JSX.Element {
  const [nameFirst, setNameFirst] = useState(userFirstName);
  const [nameLast, setNameLast] = useState(userLastName);
  const [email, setEmail] = useState(userEmail);
  const [status, setStatus] = useState<
    | "idle"
    | "loading"
    | "success"
    | "error"
    | "full"
    | "deadline"
    | "already_registered"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Server confirmed: already registered — skip the form entirely.
  if (userIsRegistered) {
    return (
      <div
        class="rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3"
        style="background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;"
      >
        <span>
          <strong>You're registered ✓</strong>
        </span>
        <a
          href="/account/groups/"
          class="shrink-0 text-xs font-semibold underline"
          style="color:#065f46;"
        >
          Manage →
        </a>
      </div>
    );
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!nameFirst.trim() || !nameLast.trim()) {
      setStatus("error");
      setErrorMsg("Please enter your name.");
      return;
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setStatus("error");
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch(
        `/api/groups/${groupSlug}/events/${eventId}/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nameFirst, nameLast, email }),
        },
      );
      if (res.ok) {
        setStatus("success");
        return;
      }
      const data = await res.json() as {
        ok?: boolean;
        error?: string;
        code?: string;
      };
      if (data.error === "already_registered") {
        setStatus("already_registered");
        return;
      }
      if (data.code === "EVENT_FULL") {
        setStatus("full");
        return;
      }
      if (data.code === "DEADLINE_PASSED") {
        setStatus("deadline");
        return;
      }
      setStatus("error");
      setErrorMsg(data.error ?? "Registration failed. Please try again.");
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div
        class="rounded-xl px-4 py-3 text-sm"
        style="background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;"
      >
        <strong>You're registered!</strong> Check your email for confirmation.
      </div>
    );
  }

  if (status === "full") {
    return (
      <div
        class="rounded-xl px-4 py-3 text-sm"
        style="background:#fffbeb;border:1px solid #fde68a;color:#92400e;"
      >
        This event is full.
      </div>
    );
  }

  if (status === "deadline") {
    return (
      <div
        class="rounded-xl px-4 py-3 text-sm"
        style="background:#fffbeb;border:1px solid #fde68a;color:#92400e;"
      >
        Registration for this event has closed.
      </div>
    );
  }

  if (status === "already_registered") {
    return (
      <div
        class="rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3"
        style="background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;"
      >
        <span>👍 Looks like you're already signed up!</span>
        <a
          href="/account/groups/"
          class="shrink-0 text-xs font-semibold underline"
          style="color:#065f46;"
        >
          View registrations →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-3">
      {isLoggedIn
        ? (
          <div
            class="rounded-xl px-4 py-3 text-sm"
            style="background:#eef5f7;border:1px solid #d0e4e7;"
          >
            <span class="font-semibold text-near-black">
              {nameFirst} {nameLast}
            </span>{" "}
            <span style="color:rgba(28,26,24,0.6);">&lt;{email}&gt;</span>
          </div>
        )
        : (
          <>
            <div class="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="First name"
                value={nameFirst}
                onInput={(e) => {
                  setNameFirst(e.currentTarget.value);
                  setStatus("idle");
                }}
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                style="focus-ring-color:#1a5f6e;"
                disabled={status === "loading"}
                required
              />
              <input
                type="text"
                placeholder="Last name"
                value={nameLast}
                onInput={(e) => {
                  setNameLast(e.currentTarget.value);
                  setStatus("idle");
                }}
                class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                disabled={status === "loading"}
                required
              />
            </div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onInput={(e) => {
                setEmail(e.currentTarget.value);
                setStatus("idle");
              }}
              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
              disabled={status === "loading"}
              required
            />
          </>
        )}

      {status === "error" && (
        <p class="text-sm" style="color:#dc2626;">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        class="w-full px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-primary transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === "loading" ? "Registering…" : `Register for ${eventTitle}`}
      </button>
    </form>
  );
}
