/**
 * Regression tests for iCalendar serialization of naive local event dates.
 * Run: deno test site/tests/ical.test.ts
 */

import { assertStringIncludes } from "@std/assert";
import { buildGroupEventICal } from "../utils/ical.ts";
import type { EventConfig } from "../utils/db/group-events.ts";

function buildIcal(date: string, duration: number): string {
  const event: EventConfig = {
    id: "0bcf3631-d0d0-47ce-84d4-6a6e5e5ac4a1",
    programId: "a9d37148-3014-4c47-8b54-448c637ec9fe",
    programType: "one-off",
    slug: "timezone-regression",
    title: "Timezone regression test",
    description: "Checks iCalendar local-time serialization.",
    date,
    timezone: "Australia/Sydney",
    duration,
    capacity: 20,
    registrationDeadline: 1,
    isActive: true,
  };

  return buildGroupEventICal({
    event,
    groupSlug: "timezone-test",
    groupName: "Timezone Test Group",
  });
}

Deno.test("iCalendar preserves Sydney wall-clock time for September 2026", () => {
  const ics = buildIcal("2026-09-15T17:00:00", 120);

  assertStringIncludes(
    ics,
    "DTSTART;TZID=Australia/Sydney:20260915T170000",
  );
  assertStringIncludes(
    ics,
    "DTEND;TZID=Australia/Sydney:20260915T190000",
  );
  assertStringIncludes(ics, "BEGIN:VTIMEZONE");
});

Deno.test("iCalendar preserves Sydney wall-clock time during AEDT", () => {
  const ics = buildIcal("2026-01-15T17:00:00", 120);

  assertStringIncludes(
    ics,
    "DTSTART;TZID=Australia/Sydney:20260115T170000",
  );
  assertStringIncludes(
    ics,
    "DTEND;TZID=Australia/Sydney:20260115T190000",
  );
  assertStringIncludes(ics, "BEGIN:VTIMEZONE");
});
