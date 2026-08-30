#!/usr/bin/env -S deno run --allow-write --allow-read
/**
 * Generates and validates sample .ics files for naive local event dates.
 *
 * Usage: deno run --allow-write --allow-read site/scripts/test-ical.ts
 * Output: site/scripts/test-ical/*.ics
 *
 * Every fixture must retain its stored wall-clock time under Australia/Sydney,
 * including AEST and AEDT. This script throws before reporting success if the
 * DTSTART or DTEND line differs from the expected RFC 5545 value.
 */

import ical from "ical-generator";
import { getVtimezoneComponent } from "@touch4it/ical-timezones";
import { naiveDatetimeToICalDateTime } from "../utils/temporal.ts";

const OUT_DIR = new URL("./test-ical/", import.meta.url).pathname;
const TIMEZONE = "Australia/Sydney";

const CASES = [
  {
    filename: "aest-online.ics",
    label: "AEST online event (UTC+10, June — winter)",
    id: "discuss-our-future-2026-06-22",
    date: "2026-06-22T19:00:00",
    duration: 45,
    expectedStart: "DTSTART;TZID=Australia/Sydney:20260622T190000",
    expectedEnd: "DTEND;TZID=Australia/Sydney:20260622T194500",
  },
  {
    filename: "aedt-online.ics",
    label: "AEDT online event (UTC+11, January — daylight saving)",
    id: "discuss-our-future-2026-01-19",
    date: "2026-01-19T19:00:00",
    duration: 45,
    expectedStart: "DTSTART;TZID=Australia/Sydney:20260119T190000",
    expectedEnd: "DTEND;TZID=Australia/Sydney:20260119T194500",
  },
  {
    filename: "inperson-event.ics",
    label: "In-person event with physical location",
    id: "tumba-community-2026-06-11",
    date: "2026-06-11T18:00:00",
    duration: 90,
    expectedStart: "DTSTART;TZID=Australia/Sydney:20260611T180000",
    expectedEnd: "DTEND;TZID=Australia/Sydney:20260611T193000",
  },
] as const;

function getEventLine(
  content: string,
  property: "DTSTART" | "DTEND",
): string {
  const event = content.match(/BEGIN:VEVENT\r?\n([\s\S]*?)END:VEVENT/);
  if (!event) throw new Error("Missing VEVENT component");
  const line = event[1].split(/\r?\n/).find((item) =>
    item.startsWith(property)
  );
  if (!line) throw new Error(`Missing VEVENT ${property} line`);
  return line;
}

await Deno.mkdir(OUT_DIR, { recursive: true });

for (const fixture of CASES) {
  const end = Temporal.PlainDateTime.from(fixture.date)
    .add({ minutes: fixture.duration })
    .toString();
  const cal = ical({ name: "Future Together" });
  cal.timezone({ name: TIMEZONE, generator: getVtimezoneComponent });
  cal.createEvent({
    id: fixture.id,
    start: naiveDatetimeToICalDateTime(fixture.date, TIMEZONE),
    end: naiveDatetimeToICalDateTime(end, TIMEZONE),
    timezone: TIMEZONE,
    summary: fixture.label,
  });

  const content = cal.toString();
  const actualStart = getEventLine(content, "DTSTART");
  const actualEnd = getEventLine(content, "DTEND");
  if (
    actualStart !== fixture.expectedStart || actualEnd !== fixture.expectedEnd
  ) {
    throw new Error(
      `${fixture.filename}: expected ${fixture.expectedStart} / ${fixture.expectedEnd}; ` +
        `received ${actualStart} / ${actualEnd}`,
    );
  }
  if (!content.includes("BEGIN:VTIMEZONE")) {
    throw new Error(`${fixture.filename}: missing VTIMEZONE component`);
  }

  await Deno.writeTextFile(`${OUT_DIR}${fixture.filename}`, content);
  console.log(`✓ ${fixture.filename}: ${actualStart}; ${actualEnd}`);
}

console.log("All iCalendar serialization assertions passed.");
