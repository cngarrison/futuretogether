import { useEffect, useState } from "preact/hooks";

interface Props {
  /** Destination to redirect to after successful auth. */
  next: string;
}

type Status = "processing" | "error";

/**
 * CallbackHandler island — /auth/callback
 *
 * Supabase magic links redirect the browser to /auth/callback with tokens in
 * the URL hash fragment (e.g. #access_token=...&refresh_token=...). Hash
 * fragments are never sent to the server, so they must be read client-side.
 *
 * On mount this island:
 *   1. Parses window.location.hash for access_token + refresh_token
 *   2. POSTs them to /api/auth/session, which validates and sets httpOnly cookies
 *   3. Redirects to `next` on success, shows an error on failure
 */
export default function CallbackHandler({ next }: Props) {
  const [status, setStatus] = useState<Status>("processing");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const hash = globalThis.location.hash.slice(1); // strip leading #

    if (!hash) {
      setStatus("error");
      setErrorMsg("No authentication data found. Please try signing in again.");
      return;
    }

    const params = new URLSearchParams(hash);
    const errorCode = params.get("error");
    const errorDesc = params.get("error_description");

    if (errorCode) {
      setStatus("error");
      setErrorMsg(errorDesc ?? errorCode);
      return;
    }

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const expiresIn = parseInt(params.get("expires_in") ?? "3600", 10);

    if (!accessToken || !refreshToken) {
      setStatus("error");
      setErrorMsg(
        "Incomplete authentication data. Please try signing in again.",
      );
      return;
    }

    fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { error?: string }).error ?? "Session setup failed.",
          );
        }
        // Replace current history entry so Back doesn't return to the hash URL
        globalThis.location.replace(next || "/");
      })
      .catch((err: Error) => {
        setStatus("error");
        setErrorMsg(
          err.message ??
            "An unexpected error occurred. Please try signing in again.",
        );
      });
  }, []);

  if (status === "error") {
    return (
      <div class="text-center py-4">
        <p class="text-red-700 mb-4">{errorMsg}</p>
        <a
          f-client-nav={false}
          href="/login"
          class="text-sm font-medium text-primary"
        >
          Return to sign in
        </a>
      </div>
    );
  }

  return (
    <div class="text-center py-4 text-gray-500">
      Signing you in…
    </div>
  );
}
