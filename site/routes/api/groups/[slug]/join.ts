import { define } from "@/utils.ts";
import { getGroupBySlug } from "@/utils/db/groups.ts";
import { isGroupMember, joinGroup } from "@/utils/db/group-members.ts";

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const handler = define.handlers({
  GET() {
    return jsonResponse({ error: "Method not allowed" }, 405);
  },

  async POST(ctx) {
    const { slug } = ctx.params;
    //console.warn("RouteApiGroupsJoin: params", ctx.params);

    // 1. Look up group — must be active and not private
    const group = await getGroupBySlug(slug, ctx.state);
    if (!group) {
      return jsonResponse({ error: "Group not found" }, 404);
    }

    // 2. Get session user from state (populated by root _middleware.ts)
    const user = ctx.state.user;
    if (!user) {
      return jsonResponse({ error: "Not authenticated" }, 401);
    }

    const profileId = user.id;

    // 3. Check if already a member
    const alreadyMember = await isGroupMember(group.id, profileId, ctx.state);
    if (alreadyMember) {
      return new Response(null, {
        status: 303,
        headers: { Location: `/groups/${slug}/` },
      });
    }

    // 4. Join the group
    const { error } = await joinGroup(
      group.id,
      profileId,
      "self-joined",
      ctx.state,
    );
    //console.warn("RouteApiGroupsJoin: joinGroup-error", error);
    if (error) {
      return jsonResponse({ error }, 500);
    }

    return new Response(null, {
      status: 303,
      headers: { Location: `/groups/${slug}/` },
    });
  },
});
