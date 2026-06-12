import { define } from "@/utils.ts";
import { getGroupProgramById } from "@/utils/db/group-programs.ts";
import { generateRecurringInstancesForProgram } from "@/utils/cron.ts";
import {
  logAdminAction,
  resolvePlatformRole,
  type AuditActorRole,
} from "@/utils/db/audit-log.ts";

/**
 * POST /groups/[slug]/admin/events/[id]/generate-instances
 * Manually triggers instance generation for a recurring program.
 * Redirects to the program detail page with ?generated=1.
 */
export const handler = define.handlers({
  GET() {
    return new Response(null, { status: 405 });
  },

  async POST(ctx) {
    const group = ctx.state.group!;
    const id = ctx.params.id;
    const slug = group.slug;
    const base = `/groups/${slug}/admin/events/${id}`;

    // Verify the program belongs to this group
    const program = await getGroupProgramById(id, ctx.state);
    if (!program) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${base}/?error=${encodeURIComponent("Program not found")}`,
        },
      });
    }
    if (program.group_id !== group.id) {
      return new Response("Not found", { status: 404 });
    }

    try {
      const { error: genError } = await generateRecurringInstancesForProgram(
        program.id,
      );
      if (genError) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${base}/?error=${encodeURIComponent(genError)}`,
          },
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${base}/?error=${encodeURIComponent(msg)}`,
        },
      });
    }

    const actorRole: AuditActorRole = ctx.state.isSiteAdminBypass
      ? await resolvePlatformRole(ctx.state.user!.id)
      : (ctx.state.membership?.role ?? "group_admin") as AuditActorRole;
    await logAdminAction(ctx.state, {
      actor_id: ctx.state.user!.id,
      actor_role: actorRole,
      action: "event.instances_generated",
      resource_type: "program",
      resource_id: program.id,
      resource_slug: program.slug,
      group_id: group.id,
    });
    return new Response(null, {
      status: 302,
      headers: { Location: `${base}/?generated=1` },
    });
  },
});
