/**
 * POST /api/groups/[slug]/events/[id]/cancel-registration
 *
 * CANONICAL token-based (unauthenticated) cancel for group event registrations.
 * Called by the GroupCancelRegistrationButton island after the user confirms.
 * Token passed as JSON body: { token: string }
 *
 * RELATIONSHIP TO OTHER CANCEL ROUTES:
 *   - This is the preferred route when slug + eventId are known (i.e. the
 *     registration originated from the group events flow).
 *   - /api/events/cancel-registration serves the same purpose for the old
 *     meetup registration flow where the group slug is not in scope at
 *     URL-generation time. It resolves slug/event details internally.
 *   - /api/account/registrations/[id]/cancel — authenticated cancel via account page.
 *   - /groups/[slug]/admin/events/[id]/cancel — cancels the entire event, not a registration.
 *
 * Extra security vs /api/events/cancel-registration:
 *   Verifies that verified.eventId matches the [id] URL param, tying the token
 *   to this specific event path and preventing token reuse across events.
 *
 * Returns:
 *   200 { success: true }
 *   400 { error }  — missing/invalid/expired token, already cancelled
 *   500            — internal error
 *
 * UI flow: site/routes/groups/[slug]/events/[id]/cancel-registration.tsx
 */
import { define } from "@/utils.ts";
import { createAdminClient } from "@/utils/supabase.ts";
import { verifyCancelRegistrationToken } from "@/utils/db/group-registrations.ts";
import { sendGroupEventCancellationEmail } from "@/utils/email/groupEventEmail.ts";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const handler = define.handlers({
  async POST(ctx) {
    try {
      const { slug, id: eventId } = ctx.params;

      // Token comes from JSON body
      let token: string | null = null;
      try {
        const body = await ctx.req.json() as Record<string, string>;
        token = body.token ?? null;
      } catch { /* no body */ }

      if (!token) {
        return json({ error: "Cancellation token is required" }, 400);
      }

      const verified = await verifyCancelRegistrationToken(token);
      if (!verified) {
        return json({
          error: "This cancellation link has expired or is invalid",
        }, 400);
      }
      if (verified.eventId !== eventId) {
        return json({ error: "Invalid cancellation link" }, 400);
      }

      // Admin client is REQUIRED here — not merely convenient.
      // This route authenticates via HMAC token embedded in the cancellation email
      // link, not via a user session. There is no auth.uid() in the request context,
      // so RLS policies on event_registrations (SELECT/UPDATE where profile_id =
      // auth.uid()) and group_events (public SELECT) would both reject the regular
      // session client. Service role bypasses RLS for:
      //   - event_registrations: SELECT status/email/name, UPDATE status → cancelled
      //   - group_events: SELECT title/date/timezone for the cancellation email
      const adminClient = createAdminClient();

      const { data: regRow } = await adminClient
        .from("event_registrations")
        .select("id, status, email, name_first, event_id")
        .eq("id", verified.registrationId)
        .maybeSingle();

      if (!regRow) return json({ error: "Registration not found" }, 400);
      const reg = regRow as Record<string, unknown>;
      if (reg.status === "cancelled") {
        return json({ error: "This registration is already cancelled" }, 400);
      }

      const { data: evRow } = await adminClient
        .from("group_events")
        .select(
          "title, event_date, timezone, group:groups!group_id(slug, name), program:group_programs!program_id(title)",
        )
        .eq("id", eventId)
        .maybeSingle();

      const { error: updateErr } = await adminClient
        .from("event_registrations")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", verified.registrationId);

      if (updateErr) {
        console.error("[cancel-registration] update error:", updateErr);
        return json({ error: "Cancellation failed" }, 500);
      }

      // Fire-and-forget: cancellation confirmation email
      if (evRow) {
        const ev = evRow as Record<string, unknown>;
        const group = (ev.group ?? {}) as Record<string, unknown>;
        void sendGroupEventCancellationEmail({
          groupSlug: (group.slug as string) ?? slug,
          groupName: (group.name as string) ?? "",
          eventTitle: (ev.title as string | null) ??
            ((ev.program as Record<string, unknown> | null)?.title as
              | string
              | null) ??
            "Event",
          eventDate: ev.event_date as string,
          eventTimezone: (ev.timezone as string) ?? "Australia/Sydney",
          nameFirst: (reg.name_first as string) ?? "",
          email: reg.email as string,
        }).catch((err) =>
          console.error("[cancel-registration] email error:", err)
        );
      }

      return json({ success: true }, 200);
    } catch (err) {
      console.error("[cancel-registration] unexpected error:", err);
      return json({ error: "Internal server error" }, 500);
    }
  },
});
