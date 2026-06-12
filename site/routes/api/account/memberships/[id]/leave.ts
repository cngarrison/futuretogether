import { define } from "@/utils.ts";
import { departGroup } from "@/utils/db/group-members.ts";

/**
 * POST /api/account/memberships/[id]/leave
 *
 * Authenticated user leaves a group (soft delete via departGroup).
 * Returns 400 with error message on business-rule violations.
 */
export const handler = define.handlers({
  async POST(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return Response.json({ error: "Unauthorised" }, { status: 401 });
    }

    const membershipId = ctx.params.id;
    const { error } = await departGroup(membershipId, user.id, ctx.state);

    if (error) {
      return Response.json({ error }, { status: 400 });
    }

    return Response.json({ ok: true });
  },
});
