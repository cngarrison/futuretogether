import { define } from "@/utils.ts";
import { isSiteAdmin } from "@/utils/auth.ts";
import { createAdminClient } from "@/utils/supabase.ts";
import { getGroupBySlugAdmin } from "@/utils/db/groups.ts";

/**
 * Group admin API middleware — Fresh v2
 * Protects all /api/groups/[slug]/admin/* API routes.
 *
 * Note: placed at /api/groups/[slug]/admin/ (not /api/groups/[slug]/) to avoid
 * conflicting with the public /api/groups/[slug]/join endpoint.
 *
 * Access is granted if the authenticated user:
 *   (a) has role group_owner or group_admin in group_memberships for this group, OR
 *   (b) has a site_owner or site_admin platform role
 *
 * On success: attaches ctx.state.group, ctx.state.membership, ctx.state.isSiteAdminBypass.
 * On failure: returns 401/403 JSON — never redirects (API route).
 */
export const handler = define.middleware(async (ctx) => {
  const { slug } = ctx.params;
  const user = ctx.state.user;

  // 1. Must be authenticated
  if (!user) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  // 2. Site admin bypass
  if (await isSiteAdmin(user.id)) {
    const group = await getGroupBySlugAdmin(slug);
    if (!group) {
      return Response.json({ error: "Group not found" }, { status: 404 });
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
    return Response.json({ error: "Group not found" }, { status: 404 });
  }

  // 4. Check membership.
  // Uses admin client: group_memberships RLS restricts cross-user reads.
  const admin = createAdminClient();
  const { data: membershipRow, error: membershipError } = await admin
    .from("group_memberships")
    .select("id, role, status, email_opt_in")
    .eq("group_id", group.id)
    .eq("profile_id", user.id)
    .in("role", ["group_owner", "group_admin"])
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) {
    console.error("GroupAdminApi._middleware membership:", membershipError);
  }
  if (!membershipRow) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
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
