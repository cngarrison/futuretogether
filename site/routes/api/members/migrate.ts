/**
 * POST /api/members/migrate
 *
 * One-time utility: retroactively converts all existing event registrations
 * into member records. Safe to run multiple times — createMember() is an
 * upsert and will not duplicate records.
 *
 * Protected by the staff secret (FT_STAFF_SECRET env var).
 *
 * Usage:
 *   curl -X POST https://futuretogether.community/api/members/migrate \
 *     -H "Authorization: Bearer <FT_STAFF_SECRET>"
 */

import { define } from "@/utils.ts";
import { getAllEvents, getEventRegistrations } from "@/utils/events.ts";
import { createMember } from "@/utils/members.ts";

export const handlers = define.handlers({
  async POST(ctx) {
    // Auth check
    const staffSecret = Deno.env.get("FT_STAFF_PASSWORD_HASH");
    const authHeader = ctx.req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    if (!staffSecret || token !== staffSecret) {
      return new Response("Unauthorized", { status: 401 });
    }

    const events = await getAllEvents();
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const event of events) {
      const registrations = await getEventRegistrations(event.id);
      for (const reg of registrations) {
        if (reg.status === "cancelled") {
          skipped++;
          continue;
        }

        const result = await createMember({
          email: reg.attendee.email,
          firstName: reg.attendee.firstName,
          lastName: reg.attendee.lastName,
          source: "event_registration",
          interests: [],
          heardFrom: reg.engagement?.heardFrom,
        });

        if (!result.success) {
          errors++;
        } else if (result.created) {
          created++;
        } else {
          skipped++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: { created, skipped, errors },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  },
});
