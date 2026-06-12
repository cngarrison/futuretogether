import { define } from "@/utils.ts";
import { setCookie } from "@std/http";
import { isLocalDev } from "@/utils/app.ts";
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
}

export const handler = define.handlers({
  async POST(ctx) {
    let body: SessionBody;
    try {
      body = await ctx.req.json() as SessionBody;
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const { access_token, refresh_token, expires_in } = body;

    if (!access_token || !refresh_token) {
      return json({ error: "Missing tokens" }, 400);
    }

    // Validate the token before trusting it
    const supabase = createSupabaseClient(access_token);
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return json({ error: "Invalid or expired token" }, 401);
    }

    const secure = !isLocalDev();
    const headers = new Headers({ "Content-Type": "application/json" });

    setCookie(headers, {
      name: "sb-access-token",
      value: access_token,
      path: "/",
      httpOnly: true,
      secure,
      sameSite: "Lax",
      maxAge: expires_in ?? 3600,
    });

    setCookie(headers, {
      name: "sb-refresh-token",
      value: refresh_token,
      path: "/",
      httpOnly: true,
      secure,
      sameSite: "Lax",
      maxAge: 7 * 24 * 3600,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  },
});

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
