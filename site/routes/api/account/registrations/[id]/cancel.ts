import { define } from "@/utils.ts";

/**
 * POST /api/account/registrations/[id]/cancel
 *
 * Authenticated cancel — a signed-in user cancels their own event registration
 * from their account/profile page. Requires a valid session; verifies that the
 * registration belongs to the calling user (profile_id check).
 *
 * RELATIONSHIP TO OTHER CANCEL ROUTES:
 *   - /api/groups/[slug]/events/[id]/cancel-registration — token-based (no login
 *     required), used from the cancellation link in confirmation emails.
 *   - /api/events/cancel-registration — same as above but for the old meetup flow.
 *   - /groups/[slug]/admin/events/[id]/cancel — cancels the entire event,
 *     not an individual registration.
 *
 * Idempotent — already-cancelled registrations return { ok: true }.
 * Returns 400 if the event has already passed or the registration is in
 * a non-cancellable state.
 */
export const handler = define.handlers({
  async POST(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return Response.json({ error: "Unauthorised" }, { status: 401 });
    }

    const registrationId = ctx.params.id;
    // RLS allows authenticated users to SELECT/UPDATE their own event_registrations
    // rows (profile_id = auth.uid()), so the session client is sufficient here.
    const db = ctx.state.supabaseClient;

    // Fetch the registration row
    const { data: reg, error: fetchError } = await db
      .from("event_registrations")
      .select("id, profile_id, status, event_id")
      .eq("id", registrationId)
      .maybeSingle();

    if (fetchError) {
      console.error("cancel-registration: fetch error", fetchError);
      return Response.json({ error: "Server error" }, { status: 500 });
    }
    if (!reg) {
      return Response.json({ error: "Registration not found" }, {
        status: 404,
      });
    }

    const row = reg as {
      id: string;
      profile_id: string;
      status: string;
      event_id: string;
    };

    // Verify ownership
    if (row.profile_id !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Idempotent — already cancelled
    if (row.status === "cancelled") {
      return Response.json({ ok: true });
    }

    // Only 'registered' status can be cancelled
    if (row.status !== "registered") {
      return Response.json(
        { error: `Cannot cancel a registration with status '${row.status}'.` },
        { status: 400 },
      );
    }

    // Fetch event_date to check whether it's in the past
    const { data: evRow, error: evError } = await db
      .from("group_events")
      .select("event_date")
      .eq("id", row.event_id)
      .maybeSingle();

    if (evError) {
      console.error("cancel-registration: event fetch error", evError);
      return Response.json({ error: "Server error" }, { status: 500 });
    }

    const eventDate = (evRow as { event_date: string | null } | null)
      ?.event_date;
    if (eventDate) {
      try {
        const eventPDT = Temporal.PlainDateTime.from(eventDate);
        const nowPDT = Temporal.Now.plainDateTimeISO("Australia/Sydney");
        if (Temporal.PlainDateTime.compare(eventPDT, nowPDT) < 0) {
          return Response.json({ error: "Event has already passed." }, {
            status: 400,
          });
        }
      } catch (err) {
        console.error(
          "cancel-registration: temporal parse error (non-fatal)",
          err,
        );
      }
    }

    // Cancel the registration
    const { error: cancelError } = await db
      .from("event_registrations")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", registrationId);

    if (cancelError) {
      console.error("cancel-registration: update error", cancelError);
      return Response.json({ error: cancelError.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  },
});
