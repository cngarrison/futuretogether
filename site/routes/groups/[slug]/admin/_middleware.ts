import { define } from "@/utils.ts";
import { isSiteAdmin } from "@/utils/auth.ts";
import { createAdminClient } from "@/utils/supabase.ts";
import { getGroupBySlugAdmin } from "@/utils/db/groups.ts";

/**
 * Group admin middleware — Fresh v2
 * Protects all /groups/[slug]/admin/* routes.
 *
 * Access is granted if the authenticated user:
 *   (a) has role group_owner or group_admin in group_memberships for this group, OR
 *   (b) has a site_owner or site_admin platform role (bypass — sets isSiteAdminBypass=true)
 *
 * Root _middleware.ts has already populated ctx.state.user.
 * On success: attaches ctx.state.group, ctx.state.membership, ctx.state.isSiteAdminBypass.
 * On failure: redirects to /groups/[slug]/ (or /login if unauthenticated).
 */
export const handler = define.middleware(async (ctx) => {
  const { slug } = ctx.params;
  const user = ctx.state.user;

  // 1. Must be authenticated
  if (!user) {
    const url = new URL(ctx.req.url);
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/login?redirect=${encodeURIComponent(url.pathname)}`,
      },
    });
  }

  // 2. Site admin bypass — can access any group admin without being a member
  if (await isSiteAdmin(user.id)) {
    const group = await getGroupBySlugAdmin(slug);
    if (!group) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/groups/" },
      });
    }
    ctx.state.group = group;
    ctx.state.membership = null;
    ctx.state.isSiteAdminBypass = true;
    return ctx.next();
  }

  // 3. Resolve group by slug (any status/visibility — admin view).
  // Uses admin client via getGroupBySlugAdmin; also provides group.id for membership check.
  const group = await getGroupBySlugAdmin(slug);
  if (!group) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/groups/" },
    });
  }

  // 4. Check for an active group_owner or group_admin membership.
  // Uses admin client: group_memberships RLS restricts cross-user reads.
  const adminClient = createAdminClient();
  const { data: membershipRow, error: membershipError } = await adminClient
    .from("group_memberships")
    .select("id, role, status, email_opt_in")
    .eq("group_id", group.id)
    .eq("profile_id", user.id)
    .in("role", ["group_owner", "group_admin"])
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) {
    console.error("GroupAdmin._middleware membership:", membershipError);
  }

  if (!membershipRow) {
    return new Response(null, {
      status: 302,
      headers: { Location: `/groups/${slug}/` },
    });
  }

  const row = membershipRow as {
    id: string;
    role: "group_owner" | "group_admin" | "member";
    status: string;
    email_opt_in: boolean;
  };

  ctx.state.group = group;
  ctx.state.membership = {
    id: row.id,
    role: row.role,
    status: row.status,
    email_opt_in: row.email_opt_in,
  };
  ctx.state.isSiteAdminBypass = false;

  return ctx.next();
});
