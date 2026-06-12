import { define } from "@/utils.ts";
import {
  banMember,
  removeGroupMember,
  updateMemberRole,
} from "@/utils/db/group-members.ts";
import {
  logAdminAction,
  resolvePlatformRole,
  type AuditActorRole,
} from "@/utils/db/audit-log.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const body = await ctx.req.json() as {
      membershipId: string;
      action: string;
      newRole?: string;
    };
    const { membershipId, action, newRole } = body;
    if (!membershipId || !action) {
      return Response.json({ error: "membershipId and action are required" }, {
        status: 400,
      });
    }
    let result: { error: string | null };
    let auditAction: "member.role_changed" | "member.removed" | "member.banned";
    if (
      action === "role" && (newRole === "member" || newRole === "group_admin")
    ) {
      result = await updateMemberRole(membershipId, newRole, ctx.state);
      auditAction = "member.role_changed";
    } else if (action === "remove") {
      result = await removeGroupMember(membershipId, ctx.state);
      auditAction = "member.removed";
    } else if (action === "ban") {
      result = await banMember(membershipId, ctx.state);
      auditAction = "member.banned";
    } else {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }
    if (result.error) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    const actorRole: AuditActorRole = ctx.state.isSiteAdminBypass
      ? await resolvePlatformRole(ctx.state.user!.id)
      : (ctx.state.membership?.role ?? "group_admin") as AuditActorRole;
    await logAdminAction(ctx.state, {
      actor_id: ctx.state.user!.id,
      actor_role: actorRole,
      action: auditAction,
      resource_type: "member",
      resource_id: membershipId,
      group_id: ctx.state.group?.id,
      metadata: { action, newRole },
    });
    return Response.json({ ok: true });
  },
});
