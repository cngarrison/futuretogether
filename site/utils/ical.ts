/**
 * site/utils/ical.ts
 *
 * Shared iCalendar builder for Future Together group events.
 *
 * buildGroupEventICal() is the single place that creates an .ics file for any
 * group event. It handles:
 *   - Organizer: group contact address (group-{slug}@futuretogether.community)
 *   - Location: physical address for in-person/hybrid; meeting link for online-only
 *   - Hybrid events: online link surfaced in the description alongside the venue
 *   - Attendee: optional ATTENDEE line (for logged-in registrants)
 *
 * With the local-time adapter from temporal.ts, ical-generator v10 emits
 * DTSTART;TZID=<tz>:<localtime> plus VTIMEZONE — DST-safe and compatible with
 * Apple Calendar, Google Calendar, and Outlook.
 */

import ical, { ICalAttendeeStatus } from "ical-generator";
import { tzlib_get_ical_block } from "timezones-ical-library";
import type { EventConfig } from "@/utils/db/group-events.ts";
import { naiveDatetimeToICalDateTime } from "@/utils/temporal.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GroupEventICalOptions {
  /** Full event config returned by getEventById() */
  event: EventConfig;
  /** Slug of the hosting group (used to derive organizer email) */
  groupSlug: string;
  /** Display name of the hosting group */
  groupName: string;
  /** If the requesting user is a registered attendee, include their details */
  attendee?: {
    name?: string;
    email: string;
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Canonical group contact address — mirrors the FROM address used in group emails. */
function groupContactEmail(groupSlug: string): string {
  return `group-${groupSlug}@futuretogether.community`;
}

/**
 * VTIMEZONE generator for ical-generator's `cal.timezone({ generator })` hook.
 *
 * We previously used `getVtimezoneComponent` from `@touch4it/ical-timezones`,
 * but that package locates its bundled per-zone .ics fragments via
 * `path.join(__dirname, ...)`. Deno Deploy's ESM/bundled runtime does not
 * define `__dirname`, so it threw `ReferenceError: __dirname is not defined`
 * in production (ft-4uy) even though it worked under local `deno serve`.
 *
 * `timezones-ical-library` ships its IANA VTIMEZONE data as plain TS/JSON
 * modules (no filesystem/`__dirname` lookups, zero runtime dependencies), so
 * it works identically under Deno Deploy. `tzlib_get_ical_block(tz)` returns
 * `[vtimezoneBlock, tzidLine]`; we only need the VTIMEZONE block itself here.
 */
// ⚠️ DO NOT reintroduce `@touch4it/ical-timezones` (or any similar package
// that loads bundled per-zone .ics data via `path.join(__dirname, ...)` /
// CJS `require`) here. It throws `ReferenceError: __dirname is not defined`
// under Deno Deploy's ESM/bundled runtime (ft-4uy) — it can appear to work
// fine under local `deno serve`, which masks the incompatibility until
// production. Always use `timezones-ical-library` (or another dependency
// verified to ship data as plain ESM/TS/JSON modules with zero filesystem
// lookups) for VTIMEZONE generation in this project.
function getVtimezoneBlock(tz: string): string {
  const [vtimezoneBlock] = tzlib_get_ical_block(tz);
  if (!vtimezoneBlock) {
    throw new RangeError(`No VTIMEZONE data available for zone: ${tz}`);
  }
  return vtimezoneBlock;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build an iCal string for a group event.
 *
 * Location strategy (RFC 5545 has a single LOCATION field):
 * - In-person only  → LOCATION = venue name
 * - Online only     → LOCATION = meeting link
 * - Hybrid          → LOCATION = venue name; online link appended to description
 */
export function buildGroupEventICal(opts: GroupEventICalOptions): string {
  const { event, groupSlug, groupName, attendee } = opts;
  const timezone = event.timezone ?? "Australia/Sydney";

  // event.date is deliberately a local wall-clock value. The Temporal/Luxon
  // adapter retains those fields for ical-generator's TZID serialization.
  const startDate = naiveDatetimeToICalDateTime(event.date, timezone);
  const endDate = naiveDatetimeToICalDateTime(
    Temporal.PlainDateTime.from(event.date)
      .add({ minutes: event.duration })
      .toString(),
    timezone,
  );

  // Determine location value and whether to surface the online link in description.
  const isHybrid = !!(event.meetingLocation && event.meetingLink);
  const location: string | undefined = event.meetingLocation
    ? event.meetingLocation
    : event.meetingLink
    ? event.meetingLink
    : undefined;

  // Assemble description sections.
  const descParts: string[] = [];
  if (event.description) descParts.push(event.description);
  if (event.topics?.length) {
    descParts.push(
      "\nWhat we'll discuss:\n" +
        event.topics.map((t: string) => `• ${t}`).join("\n"),
    );
  }
  // For hybrid events the physical venue is already in LOCATION; add the link here.
  if (isHybrid && event.meetingLink) {
    descParts.push(`\nJoin online: ${event.meetingLink}`);
  }
  descParts.push(
    `\nMore info: https://futuretogether.community/events/${event.slug}`,
  );

  const cal = ical({ name: "Future Together" });
  cal.timezone({ name: timezone, generator: getVtimezoneBlock });

  const calEvent = cal.createEvent({
    id: event.id,
    start: startDate,
    end: endDate,
    timezone, // → DTSTART;TZID=Australia/Sydney:20260622T190000
    summary: event.title,
    description: descParts.join("\n").trim(),
    url: `https://futuretogether.community/events/${event.slug}`,
    location,
    organizer: {
      name: `${groupName} via Future Together`,
      email: groupContactEmail(groupSlug),
    },
  });

  if (attendee) {
    calEvent.createAttendee({
      name: attendee.name,
      email: attendee.email,
      rsvp: true,
      status: ICalAttendeeStatus.ACCEPTED,
    });
  }

  return cal.toString();
}
