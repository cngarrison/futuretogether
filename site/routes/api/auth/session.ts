import { define } from "@/utils.ts";
import { setSessionCookies } from "@/utils/auth.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";

/**
 * POST /api/auth/session
 *
 * Called by the CallbackHandler island after reading tokens from the URL hash.
 * Validates the access token with Supabase, then sets httpOnly session cookies.
 *
 * Body: { access_token: string, refresh_token: string, expires_in?: number }
 * Response: { ok: true } on success, { error: string } on failure
 */

interface SessionBody {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  remember_me?: boolean;
}

export const handler = define.handlers({
  async POST(ctx) {
    let body: SessionBody;
    try {
      body = await ctx.req.json() as SessionBody;
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const { access_token, refresh_token, expires_in, remember_me } = body;

    if (!access_token || !refresh_token) {
      return json({ error: "Missing tokens" }, 400);
    }

    // Validate the token before trusting it
    const supabase = createSupabaseClient(access_token);
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return json({ error: "Invalid or expired token" }, 401);
    }

    const headers = new Headers({ "Content-Type": "application/json" });
    const session = {
      access_token,
      refresh_token,
      expires_in: expires_in ?? 3600,
      token_type: "bearer",
      user: data.user,
    } as import("@supabase/supabase-js").Session;

    setSessionCookies(headers, session, remember_me ?? false);

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  },
});

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
