/**
 * POST /api/groups/[slug]/events/[id]/register
 *
 * Group-scoped event registration. Supports authenticated users and guests.
 *
 * Body (JSON):
 *   { nameFirst, nameLast, email, interests?, heardFrom? }
 *
 * Guards:
 *   - Event must exist, be published, and belong to this group (slug match)
 *   - Capacity check (active count < event.capacity)
 *   - Deadline check (event_date - deadline_days > now)
 *   - Duplicate email check (per event)
 *
 * Profile handling:
 *   - Authenticated: profile_id = ctx.state.user.id
 *   - Guest: attempt admin.auth.admin.createUser (no password, email_confirm: true);
 *     on error look up existing profile by email; fallback to profile_id = null
 *
 * Returns:
 *   200 { success: true, registrationId }
 *   400 { error, code }  — EVENT_FULL | DEADLINE_PASSED | DUPLICATE_EMAIL | VALIDATION_ERROR
 *   404                  — event not found / not published / wrong group
 *   500                  — internal error
 */
import { define } from "@/utils.ts";
import { createAdminClient } from "@/utils/supabase.ts";
import { generateCancelRegistrationToken } from "@/utils/db/group-registrations.ts";
import { sendGroupEventConfirmationEmail } from "@/utils/email/groupEventEmail.ts";
import { naiveDatetimeToDate } from "@/utils/temporal.ts";

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
      let body: Record<string, string>;
      try {
        body = await ctx.req.json();
      } catch {
        return json(
          { error: "Invalid request body", code: "VALIDATION_ERROR" },
          400,
        );
      }
      const { nameFirst, nameLast, email, interests, heardFrom } = body;

      // Validate required fields
      if (!nameFirst?.trim() || !nameLast?.trim()) {
        return json({
          error: "First and last name are required",
          code: "VALIDATION_ERROR",
        }, 400);
      }
      if (!email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return json({
          error: "Valid email address is required",
          code: "VALIDATION_ERROR",
        }, 400);
      }

      // Admin client is REQUIRED here — not merely convenient.
      // This route handles both authenticated users AND unauthenticated guests.
      // For guests there is no auth.uid() at all, so the session client cannot
      // satisfy RLS. Specifically, the admin client is needed for:
      //   - group_events: SELECT published event details (capacity, deadline, etc.)
      //   - event_registrations: SELECT for duplicate-email check; INSERT new row
      //   - profiles: SELECT existing profile by email (guest path)
      //   - auth.admin.createUser: create a minimal auth user for guests — this
      //     call requires the service role key regardless of RLS.
      const adminClient = createAdminClient();

      // Load event — must be published and belong to this group
      const { data: evRow, error: evErr } = await adminClient
        .from("group_events")
        .select(`
          id, title, event_date, timezone, duration_minutes, capacity,
          registration_deadline_days, status, group_id, is_registration_required,
          meeting_link, location_name,
          program:group_programs!program_id (
            title, capacity, registration_deadline_days, duration_minutes
          ),
          group:groups!group_id ( slug, name )
        `)
        .eq("id", eventId)
        .maybeSingle();

      if (evErr || !evRow) {
        return json({ error: "Event not found" }, 404);
      }

      const ev = evRow as Record<string, unknown>;
      const prog = (ev.program ?? {}) as Record<string, unknown>;
      const group = (ev.group ?? {}) as Record<string, unknown>;

      // Cross-group guard
      if (group.slug !== slug) {
        return json({ error: "Event not found" }, 404);
      }
      if (ev.status !== "published") {
        return json({ error: "This event is not open for registration" }, 404);
      }

      // Deadline check — event_date is naive local time
      const tz = (ev.timezone as string) ?? "Australia/Sydney";
      const eventDate = naiveDatetimeToDate(ev.event_date as string, tz);
      const deadlineDays = ((ev.registration_deadline_days ??
        prog.registration_deadline_days) as number) ?? 1;
      const deadline = new Date(
        eventDate.getTime() - deadlineDays * 24 * 60 * 60 * 1000,
      );
      if (new Date() >= deadline) {
        return json({
          error: "Registration deadline has passed",
          code: "DEADLINE_PASSED",
        }, 400);
      }

      // Capacity check
      const capacity = (ev.capacity ?? prog.capacity) as number | null;
      if (capacity !== null) {
        const { count } = await adminClient
          .from("event_registrations")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId)
          .eq("status", "registered");
        if ((count ?? 0) >= capacity) {
          return json({ error: "This event is full", code: "EVENT_FULL" }, 400);
        }
      }

      // Duplicate email check
      const normalEmail = email.trim().toLowerCase();
      const { data: existing } = await adminClient
        .from("event_registrations")
        .select("id")
        .eq("event_id", eventId)
        .eq("email", normalEmail)
        .eq("status", "registered")
        .maybeSingle();
      if (existing) {
        return json({ ok: false, error: "already_registered" }, 400);
      }

      // Resolve profile_id
      let profileId: string | null = null;
      if (ctx.state.user) {
        profileId = ctx.state.user.id;
      } else {
        // Guest registration: create minimal auth user (triggers profiles row via DB trigger)
        try {
          const { data: created, error: createErr } = await adminClient.auth
            .admin
            .createUser({
              email: normalEmail,
              email_confirm: true,
              user_metadata: {
                name_first: nameFirst.trim(),
                name_last: nameLast.trim(),
              },
            });
          if (!createErr && created.user?.id) {
            profileId = created.user.id;
          } else {
            // User already exists — look up profile by email
            const { data: existingProfile } = await adminClient
              .from("profiles")
              .select("id")
              .eq("email", normalEmail)
              .maybeSingle();
            if (existingProfile?.id) {
              profileId = (existingProfile as Record<string, unknown>)
                .id as string;
            }
          }
        } catch (err) {
          console.warn("[group/register] profile creation warning:", err);
          // profileId stays null — allowed by schema
        }
      }

      // Insert registration
      const registrationId = crypto.randomUUID();
      const { error: insertErr } = await adminClient.from("event_registrations")
        .insert({
          id: registrationId,
          event_id: eventId,
          profile_id: profileId,
          email: normalEmail,
          name_first: nameFirst.trim(),
          name_last: nameLast.trim(),
          status: "registered",
          source: "web",
          interests: interests?.trim() || null,
          heard_from: heardFrom?.trim() || null,
        });

      if (insertErr) {
        // 23505 = unique_violation — duplicate slipped through application check (race condition)
        if ((insertErr as { code?: string }).code === "23505") {
          return json({ ok: false, error: "already_registered" }, 400);
        }
        console.error("[group/register] insert error:", insertErr);
        return json({ error: "Registration failed" }, 500);
      }

      // Fire-and-forget: send confirmation email with cancel link
      const origin = new URL(ctx.req.url).origin;
      void (async () => {
        try {
          const cancelToken = await generateCancelRegistrationToken(
            registrationId,
            eventId,
          );
          const cancelUrl =
            `${origin}/groups/${slug}/events/${eventId}/cancel-registration?token=${cancelToken}`;
          await sendGroupEventConfirmationEmail({
            groupSlug: slug,
            groupName: group.name as string,
            eventTitle: (ev.title ?? prog.title) as string,
            eventDate: ev.event_date as string,
            eventTimezone: tz,
            durationMinutes:
              ((ev.duration_minutes ?? prog.duration_minutes) as number) ?? 60,
            meetingLink: (ev.meeting_link as string | null) ?? undefined,
            locationName: (ev.location_name as string | null) ?? undefined,
            registrationId,
            nameFirst: nameFirst.trim(),
            email: normalEmail,
            cancelUrl,
          });
        } catch (err) {
          console.error("[group/register] confirmation email error:", err);
        }
      })();

      return json({ success: true, registrationId }, 200);
    } catch (err) {
      console.error("[group/register] unexpected error:", err);
      return json({ error: "Internal server error" }, 500);
    }
  },
});
