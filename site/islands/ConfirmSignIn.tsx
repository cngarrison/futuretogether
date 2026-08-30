import { useState } from "preact/hooks";

interface Props {
  tokenHash: string;
  type: string;
}

type Status = "idle" | "loading" | "error";

/**
 * ConfirmSignIn island — /auth/confirm
 *
 * Renders a button that, when clicked, sends the token_hash to
 * /api/auth/confirm for server-side verification and session creation.
 *
 * Verification is intentionally deferred to the button click — not triggered
 * on mount — so that email security scanners that prefetch links cannot
 * consume the one-time token before the real user acts on it.
 */
export default function ConfirmSignIn({ tokenHash, type }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const buttonLabel = type === "signup"
    ? "Confirm email address"
    : type === "recovery"
    ? "Continue to password reset"
    : "Complete sign-in";

  async function handleClick() {
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token_hash: tokenHash, type }),
      });

      const data = await res.json() as {
        ok: boolean;
        redirect?: string;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setStatus("error");
        setErrorMsg(
          data.error ??
            "This link has expired or has already been used. Please request a new sign-in link.",
        );
        return;
      }

      // Replace history entry so Back doesn't return to the confirm page.
      globalThis.location.replace(data.redirect ?? "/account/");
    } catch {
      setStatus("error");
      setErrorMsg("An unexpected error occurred. Please try again.");
    }
  }

  if (status === "error") {
    return (
      <div class="text-center">
        <p class="text-red-700 mb-6 text-sm leading-relaxed">{errorMsg}</p>
        <a
          f-client-nav={false}
          href="/login"
          class="inline-block px-6 py-3 rounded-lg font-semibold text-sm text-white"
          style="background-color:#c4853a;"
        >
          Return to sign in
        </a>
      </div>
    );
  }

  return (
    <div class="text-center">
      <p class="text-gray-500 mb-8 text-sm leading-relaxed">
        Your link is ready. Click the button below to continue.
      </p>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "loading"}
        class="w-full py-3 px-6 rounded-lg font-semibold text-sm text-white disabled:opacity-60 transition-opacity"
        style="background-color:#c4853a;"
      >
        {status === "loading" ? "Signing you in\u2026" : buttonLabel}
      </button>
    </div>
  );
}
