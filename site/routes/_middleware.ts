import { define } from "@/utils.ts";
import type { UserAuth, UserProfile } from "@/utils.ts";
import { getSessionFromRequest, getUserFromToken } from "@/utils/auth.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";

/**
 * Root middleware — runs on every request.
 * Validates the sb-access-token cookie and populates ctx.state:
 *   - user: the Supabase User object if authenticated, otherwise null
 *   - profile: the public.profiles row for the authenticated user, otherwise null
 *   - supabaseClient: RLS-scoped client if authenticated, anon client if not
 * Never redirects — auth enforcement is the responsibility of route/sub-middlewares.
 */
export const handler = define.middleware(async (ctx) => {
  const token = getSessionFromRequest(ctx.req);
  if (token) {
    const user = await getUserFromToken(token);
    if (user) {
      ctx.state.user = user as UserAuth;
      ctx.state.supabaseClient = createSupabaseClient(token);
      const { data: profile } = await ctx.state.supabaseClient
        .from("profiles")
        .select(
          "id, email, name_first, name_last, has_password, location, wants_to_organise",
        )
        .eq("id", user.id)
        .single();
      ctx.state.profile = (profile as UserProfile) ?? null;
      return ctx.next();
    }
  }
  // Unauthenticated or invalid token — use anon client
  ctx.state.user = null;
  ctx.state.profile = null;
  ctx.state.supabaseClient = createSupabaseClient();
  return ctx.next();
});
