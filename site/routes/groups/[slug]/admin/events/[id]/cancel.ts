/**
 * POST /groups/[slug]/admin/events/[id]/cancel
 *
 * Group-admin action: cancel the ENTIRE EVENT (not an individual registration).
 * Calls cancelGroupEvent() which marks the event as cancelled and
 * (if implemented) notifies all registered attendees.
 *
 * This is completely separate from the registration-cancellation routes:
 *   - /api/groups/[slug]/events/[id]/cancel-registration — attendee cancels their own spot
 *   - /api/events/cancel-registration               — same, old meetup flow
 *   - /api/account/registrations/[id]/cancel         — authenticated attendee cancel
 *
 * No JSON response — uses form POST + 302 redirect back to the admin event page.
 */
import { define } from "@/utils.ts";
import { cancelGroupEvent } from "@/utils/db/group-events.ts";
import {
  type AuditActorRole,
  logAdminAction,
  resolvePlatformRole,
} from "@/utils/db/audit-log.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const eventId = ctx.params.id;
    const slug = ctx.params.slug;
    const { error } = await cancelGroupEvent(eventId, ctx.state);
    if (error) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/groups/${slug}/admin/events/${eventId}/?error=${
            encodeURIComponent(error)
          }`,
        },
      });
    }
    const actorRole: AuditActorRole = ctx.state.isSiteAdminBypass
      ? await resolvePlatformRole(ctx.state.user!.id)
      : (ctx.state.membership?.role ?? "group_admin") as AuditActorRole;
    await logAdminAction(ctx.state, {
      actor_id: ctx.state.user!.id,
      actor_role: actorRole,
      action: "event.cancelled",
      resource_type: "event",
      resource_id: eventId,
      group_id: ctx.state.group?.id,
    });
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/groups/${slug}/admin/events/${eventId}/?cancelled=1`,
      },
    });
  },
});
