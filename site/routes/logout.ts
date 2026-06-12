import { define } from "@/utils.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";
import { clearSessionCookies, getSessionFromRequest } from "@/utils/auth.ts";

/**
 * Logout handler — /logout
 *
 * POST: Signs out from Supabase (best-effort), clears session cookies, redirects to /.
 * GET:  Simple redirect to / (belt-and-suspenders for <a href='/logout'> links).
 */
export const handler = define.handlers({
  async POST(ctx) {
    const token = getSessionFromRequest(ctx.req);

    // Best-effort sign out from Supabase (ignore errors — cookies cleared regardless)
    if (token) {
      try {
        await createSupabaseClient(token).auth.signOut();
      } catch {
        // Ignore — we clear cookies either way
      }
    }

    const headers = new Headers();
    clearSessionCookies(headers);
    headers.set("Location", "/");
    return new Response(null, { status: 302, headers });
  },

  async GET(ctx) {
    // GET logout (e.g. <a href="/logout">) — clear cookies and sign out, same as POST
    const token = getSessionFromRequest(ctx.req);
    if (token) {
      try {
        await createSupabaseClient(token).auth.signOut();
      } catch {
        // Ignore — cookies cleared regardless
      }
    }
    const headers = new Headers();
    clearSessionCookies(headers);
    headers.set("Location", "/");
    return new Response(null, { status: 302, headers });
  },
});
