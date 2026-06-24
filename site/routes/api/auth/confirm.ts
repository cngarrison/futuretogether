/**
 * POST /api/auth/confirm
 *
 * Verifies a Supabase token_hash (from email links) and creates a session.
 * Called by the ConfirmSignIn island — not triggered automatically on page load.
 *
 * WHY THIS EXISTS:
 * Corporate email security scanners follow all links in emails to check for
 * malware/phishing. If we called verifyOtp() server-side when the page loaded,
 * the scanner would consume the one-time token before the real user ever saw it.
 * By deferring verification to a client-side button click, scanners (which don't
 * click buttons and mostly don't execute JavaScript) can't invalidate the token.
 *
 * Body:     { token_hash: string; type: string }
 * Response: { ok: true; redirect: string } | { ok: false; error: string }
 */

import { define } from "@/utils.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";
import { isSiteAdmin, setSessionCookies } from "@/utils/auth.ts";

export const handler = define.handlers({
  async POST(ctx) {
    let body: { token_hash?: string; type?: string };
    try {
      body = await ctx.req.json();
    } catch {
      return Response.json(
        { ok: false, error: "Invalid request body." },
        { status: 400 },
      );
    }

    const { token_hash, type } = body;
    if (!token_hash || !type) {
      return Response.json(
        { ok: false, error: "Missing token_hash or type." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as Parameters<typeof supabase.auth.verifyOtp>[0]["type"],
    });

    if (error || !data.session) {
      console.error(
        "[api/auth/confirm] verifyOtp failed:",
        error?.message ?? "no session",
      );
      return Response.json(
        {
          ok: false,
          error:
            "This link has expired or has already been used. Please request a new one.",
        },
        { status: 401 },
      );
    }

    // Determine post-login destination.
    // Recovery (password reset) → account page to update password.
    // All other flows → account page, unless the user is a site admin.
    let redirect = "/account/";
    if (type !== "recovery") {
      const admin = await isSiteAdmin(data.session.user.id);
      if (admin) redirect = "/admin/";
    }

    const headers = new Headers({ "Content-Type": "application/json" });
    setSessionCookies(headers, data.session, false);
    return new Response(JSON.stringify({ ok: true, redirect }), {
      status: 200,
      headers,
    });
  },
});
