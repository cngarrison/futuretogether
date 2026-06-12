/**
 * Supabase client utilities
 *
 * Two factory functions:
 *
 * `createSupabaseClient(accessToken?)` — uses SUPABASE_PUBLISHABLE_KEY.
 *   RLS is enforced. Use in server-side Fresh route handlers.
 *   Pass the user’s JWT (extracted from httpOnly cookie) to scope queries
 *   to that user’s RLS context. Without a token, queries run as anon role.
 *
 * `createAdminClient()` — uses SUPABASE_SECRET_KEY. Bypasses RLS entirely.
 *   SERVER-SIDE ONLY — never import in islands or client-reachable code.
 *   Use for: seed scripts, admin route handlers, webhook receivers.
 *
 * Factory functions (not singletons) are intentional: Fresh is a
 * server-rendered framework where each request may carry a different user
 * session. Creating a client per-request avoids session bleed between users.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_PUBLISHABLE_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

if (!SUPABASE_URL) throw new Error("Missing env var: SUPABASE_URL");
if (!SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Missing env var: SUPABASE_PUBLISHABLE_KEY");
}
//console.log('Supabase: ', {SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY: SUPABASE_PUBLISHABLE_KEY.slice(0, 12) + '...'});

/**
 * Create a server-side Supabase client scoped to the given user session.
 *
 * @param accessToken — User’s JWT from the session cookie (optional).
 *   When provided, RLS policies evaluate as the authenticated user.
 *   When omitted, queries run as the `anon` role (public data only).
 *
 * @example
 *   // In a Fresh route handler:
 *   const token = getCookies(req.headers)["sb-access-token"];
 *   const db = createSupabaseClient(token);
 *   const { data } = await db.from("groups").select("*");
 */
export function createSupabaseClient(accessToken?: string): SupabaseClient {
  return createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
}

/**
 * Create a Supabase admin client using the secret key.
 *
 * Bypasses Row-Level Security on all tables.
 * SERVER-SIDE ONLY — never use in islands, client JS, or any
 * browser-reachable code. Treat this key as a root credential.
 *
 * @example
 *   // In a seed script or admin-only route handler:
 *   const admin = createAdminClient();
 *   await admin.from("groups").insert({ slug: "ft-global", ... });
 */
export function createAdminClient(): SupabaseClient {
  const secretKey = Deno.env.get("SUPABASE_SECRET_KEY");
  if (!secretKey) throw new Error("Missing env var: SUPABASE_SECRET_KEY");
  return createClient(SUPABASE_URL!, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
