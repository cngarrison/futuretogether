import { define } from "@/utils.ts";
import {
  getGroupEventById,
  publishGroupEvent,
} from "@/utils/db/group-events.ts";
import {
  getGroupProgramById,
  publishGroupProgram,
} from "@/utils/db/group-programs.ts";
import {
  type AuditActorRole,
  logAdminAction,
  resolvePlatformRole,
} from "@/utils/db/audit-log.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const id = ctx.params.id;
    const userId = ctx.state.user!.id;
    const slug = ctx.params.slug;
    const base = `/groups/${slug}/admin/events/${id}`;

    // Determine whether this id refers to a group_event or a group_program
    const [event, program] = await Promise.all([
      getGroupEventById(id, ctx.state),
      getGroupProgramById(id, ctx.state),
    ]);

    const actorRole: AuditActorRole = ctx.state.isSiteAdminBypass
      ? await resolvePlatformRole(userId)
      : (ctx.state.membership?.role ?? "group_admin") as AuditActorRole;

    if (event) {
      // One-off event — original publish flow
      const { error } = await publishGroupEvent(id, userId, ctx.state);
      if (error) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${base}/?error=${encodeURIComponent(error)}`,
          },
        });
      }
      await logAdminAction(ctx.state, {
        actor_id: userId,
        actor_role: actorRole,
        action: "event.published",
        resource_type: "event",
        resource_id: id,
        resource_slug: event.slug,
        group_id: ctx.state.group?.id,
      });
      return new Response(null, {
        status: 302,
        headers: { Location: `${base}/?published=1` },
      });
    }

    if (program) {
      // Recurring program — publish program + generate initial instances
      const { error } = await publishGroupProgram(id, ctx.state);
      if (error) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${base}/?error=${encodeURIComponent(error)}`,
          },
        });
      }
      await logAdminAction(ctx.state, {
        actor_id: userId,
        actor_role: actorRole,
        action: "program.published",
        resource_type: "program",
        resource_id: id,
        resource_slug: program.slug,
        group_id: ctx.state.group?.id,
      });
      return new Response(null, {
        status: 302,
        headers: { Location: `${base}/?published=1` },
      });
    }

    // Neither found
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/groups/${slug}/admin/events/?error=${
          encodeURIComponent("Event or program not found")
        }`,
      },
    });
  },
});
