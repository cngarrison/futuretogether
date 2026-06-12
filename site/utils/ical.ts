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
 * ical-generator v10 emits DTSTART;TZID=<tz>:<localtime> when a timezone is
 * supplied — DST-safe, compatible with Apple Calendar, Google Calendar, Outlook.
 */

import ical, { ICalAttendeeStatus } from "ical-generator";
import { naiveDatetimeToDate } from "./temporal.ts";
import type { EventConfig } from "@/utils/db/group-events.ts";

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

  const startDate = naiveDatetimeToDate(event.date, timezone);
  const endDate = new Date(startDate.getTime() + event.duration * 60 * 1000);

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
