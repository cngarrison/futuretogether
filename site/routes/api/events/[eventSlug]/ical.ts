/**
 * site/routes/api/events/[eventSlug]/ical.ts
 *
 * iCal (.ics) export for a Future Together event.
 *
 * Route: GET /api/events/:eventSlug/ical
 * Returns: text/calendar with DTSTART;TZID=... format (RFC 5545)
 *
 * Uses buildGroupEventICal() from @/utils/ical.ts for all iCal construction.
 * This route is responsible for:
 *   1. Loading the event config (via getEventById)
 *   2. Fetching group info + attendee data in a single admin query
 *   3. Returning the .ics response
 *
 * event_date is stored as naive local wall-clock time (ft-07i.15).
 * The shared helper passes an ical-generator-compatible local-time adapter,
 * retaining the local DTSTART;TZID=<tz> clock fields.
 */

import { define } from "@/utils.ts";
import { getEventBySlug } from "@/utils/db/group-events.ts";
import { buildGroupEventICal } from "@/utils/ical.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const { eventSlug } = ctx.params;

    // Load event config by slug using the user's scoped client (respects RLS).
    const event = await getEventBySlug(eventSlug, ctx.state);
    if (!event) {
      return new Response("Event not found", { status: 404 });
    }

    // Fetch the DB UUID (for attendee lookup) and group info.
    const { data: evRow } = await ctx.state.supabaseClient
      .from("group_events")
      .select(
        "id, program:group_programs!program_id(group:groups!group_id(slug, name))",
      )
      .eq("slug", eventSlug)
      .maybeSingle();

    // Resolve group slug + name, falling back to platform defaults.
    const program = (evRow as {
      id: string;
      program?: { group?: { slug: string; name: string } };
    } | null)?.program;
    const groupSlug = program?.group?.slug ?? "ft-global";
    const groupName = program?.group?.name ?? "Future Together";

    // Attendee lookup: include ATTENDEE line if the user has a valid registration.
    let attendee: { name?: string; email: string } | undefined;
    if (ctx.state.user && evRow) {
      try {
        const { data: reg } = await ctx.state.supabaseClient
          .from("event_registrations")
          .select("email, name_first, name_last")
          .eq("event_id", (evRow as { id: string }).id)
          .eq("profile_id", ctx.state.user.id)
          .eq("status", "registered")
          .maybeSingle();
        if (reg) {
          const r = reg as {
            email: string;
            name_first: string | null;
            name_last: string | null;
          };
          attendee = {
            name: [r.name_first, r.name_last].filter(Boolean).join(" ") ||
              undefined,
            email: r.email,
          };
        }
      } catch (err) {
        // Non-fatal: still return a valid iCal file without the ATTENDEE line.
        console.error("[ical] attendee lookup failed:", err);
      }
    }

    const icsContent = buildGroupEventICal({
      event,
      groupSlug,
      groupName,
      attendee,
    });

    return new Response(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${eventSlug}.ics"`,
        "Cache-Control": "no-cache, no-store",
      },
    });
  },
});
