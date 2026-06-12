import { page } from "fresh";
import { define } from "@/utils.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";
import { setSessionCookies } from "@/utils/auth.ts";
import CallbackHandler from "@/islands/CallbackHandler.tsx";

/**
 * Auth callback — /auth/callback
 *
 * Handles three flows:
 *
 * 1. Magic link (hash fragment) — the common case.
 *    Supabase redirects the browser here with tokens in the URL hash, e.g.:
 *      /auth/callback?next=/admin/#access_token=...&refresh_token=...
 *    Hash fragments never reach the server, so we render the CallbackHandler
 *    island which reads the hash client-side, POSTs tokens to /api/auth/session,
 *    then redirects to `next`.
 *
 * 2. OTP token_hash (query param) — used if the Supabase email template is
 *    customised to send ?token_hash=...&type=... instead of the default redirect.
 *    Handled entirely server-side via verifyOtp().
 *
 * 3. PKCE code exchange — future OAuth flows.
 *    Handled server-side via exchangeCodeForSession().
 */

export const handler = define.handlers({
  async GET(ctx) {
    const url = new URL(ctx.req.url);
    const next = url.searchParams.get("next") ?? "/";

    // ------------------------------------------------------------------
    // Flow 2: OTP token_hash (server-side)
    // ------------------------------------------------------------------
    const tokenHash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type");

    if (tokenHash && type) {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as Parameters<typeof supabase.auth.verifyOtp>[0]["type"],
      });

      if (error || !data.session) {
        console.error(
          "[auth/callback] OTP verification failed:",
          error?.message,
        );
        return new Response(null, {
          status: 302,
          headers: { Location: "/login?error=auth_failed" },
        });
      }

      const headers = new Headers();
      setSessionCookies(headers, data.session, false);
      headers.set("Location", next);
      return new Response(null, { status: 302, headers });
    }

    // ------------------------------------------------------------------
    // Flow 3: PKCE code exchange (server-side)
    // ------------------------------------------------------------------
    const code = url.searchParams.get("code");

    if (code) {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data.session) {
        console.error("[auth/callback] Code exchange failed:", error?.message);
        return new Response(null, {
          status: 302,
          headers: { Location: "/login?error=auth_failed" },
        });
      }

      const headers = new Headers();
      setSessionCookies(headers, data.session, false);
      headers.set("Location", next);
      return new Response(null, { status: 302, headers });
    }

    // ------------------------------------------------------------------
    // Flow 1: Hash fragment — render island to handle client-side
    // ------------------------------------------------------------------
    return page({ next });
  },
});

interface PageData {
  next: string;
}

export default define.page<typeof handler>(function CallbackPage({ data }) {
  const { next } = data as PageData;
  return (
    <div class="flex items-center justify-center py-16 px-4">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-lg p-10">
        <div class="text-center mb-6">
          <h1 class="text-xl font-bold text-primary">Signing you in…</h1>
        </div>
        <CallbackHandler next={next} />
      </div>
    </div>
  );
});
