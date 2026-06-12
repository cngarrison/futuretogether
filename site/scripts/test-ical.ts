#!/usr/bin/env -S deno run --allow-write
/**
 * site/scripts/test-ical.ts
 *
 * Generates sample .ics files to verify the TZID iCal implementation (ft-07i.15).
 * Covers three cases: AEST (UTC+10), AEDT (UTC+11), and an in-person event.
 *
 * Usage:
 *   deno run --allow-write site/scripts/test-ical.ts
 *
 * Output: site/scripts/test-ical/*.ics
 *
 * After running, test manually:
 *   - Google Calendar: open .ics → check time, check timezone in event details
 *   - Apple Calendar:  open .ics → File → Import → check time + timezone panel
 *   - Outlook:         double-click .ics → verify time and timezone shown
 *
 * What to verify:
 *   1. Time shown matches the intended local time (not UTC-shifted)
 *   2. Timezone panel shows "Australian Eastern Standard Time" or similar
 *   3. AEDT case shifts correctly for daylight saving (should show 7pm, not 6pm)
 *   4. In-person case shows the street address in the location field
 *   5. Open the .ics in a text editor: DTSTART should have TZID= prefix, NOT a Z suffix
 *
 * Good output (correct):
 *   DTSTART;TZID=Australia/Sydney:20260622T190000
 *
 * Bad output (bug):
 *   DTSTART:20260622T090000Z   ← this was the old UTC-Z bug
 */

import ical from "ical-generator";
import { getVtimezoneComponent } from "@touch4it/ical-timezones";
import { naiveDatetimeToDate } from "../utils/temporal.ts";

const OUT_DIR = new URL("./test-ical/", import.meta.url).pathname;
await Deno.mkdir(OUT_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Mock EventConfig objects — no Supabase calls needed
// ---------------------------------------------------------------------------

const CASES = [
  {
    filename: "aest-online.ics",
    label: "AEST online event (UTC+10, June — winter)",
    event: {
      id: "discuss-our-future-2026-06-22",
      slug: "discuss-our-future-2026-06-22",
      title: "Discuss Our Future: Preparing for AI’s Impact (AEST test)",
      description:
        "A monthly conversation about AI and society. This .ics is a test file for ft-07i.15.",
      // 7:00 PM Sydney AEST (UTC+10) = 09:00 UTC
      date: "2026-06-22T19:00:00",
      timezone: "Australia/Sydney",
      duration: 45,
      topics: [
        "🎯 What AI can already do that surprises most people",
        "🔑 Who benefits from these changes — and who doesn’t",
      ],
      meetingLink: "https://whereby.com/futuretogether",
      meetingLocation: null,
    },
  },
  {
    filename: "aedt-online.ics",
    label: "AEDT online event (UTC+11, January — daylight saving)",
    event: {
      id: "discuss-our-future-2026-01-19",
      slug: "discuss-our-future-2026-01-19",
      title: "Discuss Our Future: Preparing for AI’s Impact (AEDT test)",
      description:
        "A monthly conversation about AI and society. This .ics is a test file for ft-07i.15 AEDT case.",
      // 7:00 PM Sydney AEDT (UTC+11) = 08:00 UTC previous calculation
      date: "2026-01-19T19:00:00",
      timezone: "Australia/Sydney",
      duration: 45,
      topics: [
        "🎯 Automation, jobs, and what history tells us",
        "🧠 What AI companies are actually building right now",
      ],
      meetingLink: "https://whereby.com/futuretogether",
      meetingLocation: null,
    },
  },
  {
    filename: "inperson-event.ics",
    label: "In-person event with physical location",
    event: {
      id: "tumba-community-2026-06-11",
      slug: "tumba-community-2026-06-11",
      title: "The Future Is Arriving. Is Tumbarumba Ready?",
      description:
        "A community conversation in Tumbarumba about AI and what it means for regional towns.",
      // 6:00 PM AEST
      date: "2026-06-11T18:00:00",
      timezone: "Australia/Sydney",
      duration: 90,
      topics: [
        "🌳 What AI means for regional communities and rural economies",
        "💼 Local jobs, farming, services — what’s actually changing",
        "🗣️ What we can do about it together",
      ],
      meetingLink: null,
      meetingLocation: "Café Nest Cinema, Tumbarumba NSW 2653",
    },
  },
];

// ---------------------------------------------------------------------------
// Generate each .ics file
// ---------------------------------------------------------------------------

const FROM_EMAIL = "hello@futuretogether.community";
const FROM_NAME = "Future Together";

for (const { filename, label, event } of CASES) {
  const tz = event.timezone;
  const startDate = naiveDatetimeToDate(event.date, tz);
  const endDate = new Date(startDate.getTime() + event.duration * 60 * 1000);

  const cal = ical({ name: FROM_NAME });
  cal.timezone({ name: tz, generator: getVtimezoneComponent });

  cal.createEvent({
    id: event.id,
    start: startDate,
    end: endDate,
    timezone: tz,
    summary: event.title,
    description: [
      event.description,
      "",
      event.topics.length
        ? "What we’ll discuss:\n" + event.topics.map((t) => `• ${t}`).join("\n")
        : "",
      "",
      `More info: https://futuretogether.community/events/${event.slug}`,
    ]
      .join("\n")
      .trim(),
    url: `https://futuretogether.community/events/${event.slug}`,
    location: event.meetingLocation ?? event.meetingLink ?? undefined,
    organizer: { name: FROM_NAME, email: FROM_EMAIL },
  });

  const content = cal.toString();
  const outPath = `${OUT_DIR}${filename}`;
  await Deno.writeTextFile(outPath, content);

  // Extract and print the DTSTART line for quick visual verification
  const dtstart = content.split("\n").find((l) => l.startsWith("DTSTART"));
  console.log(`✓ ${filename}`);
  console.log(`  Case:    ${label}`);
  console.log(`  Stored:  ${event.date} (naive local ${tz})`);
  console.log(`  UTC:     ${startDate.toISOString()}`);
  console.log(`  iCal:    ${dtstart?.trim() ?? "(not found)"}`);
  console.log(`  File:    ${outPath}`);
  console.log();
}

// ---------------------------------------------------------------------------
// Print testing instructions
// ---------------------------------------------------------------------------

console.log("=".repeat(60));
console.log("MANUAL TESTING INSTRUCTIONS");
console.log("=".repeat(60));
console.log("\nFiles saved to: " + OUT_DIR);
console.log(
  "Open each file in a calendar app and verify the following:\n",
);
console.log(
  "[1] AEST case (aest-online.ics)",
);
console.log("    Expected: Monday 22 June 2026, 7:00 PM – 7:45 PM AEST");
console.log("    \u2022 Google Calendar: Import .ics and open event details");
console.log(
  "    \u2022 Apple Calendar:  File → Import → check time and timezone",
);
console.log();
console.log(
  "[2] AEDT case (aedt-online.ics)",
);
console.log("    Expected: Monday 19 January 2026, 7:00 PM – 7:45 PM AEDT");
console.log("    IMPORTANT: time must be 7:00 PM, not 8:00 PM or 6:00 PM");
console.log(
  "    This tests that DST is handled correctly (AEDT = UTC+11, not AEST UTC+10)",
);
console.log();
console.log(
  "[3] In-person case (inperson-event.ics)",
);
console.log(
  "    Expected: Thursday 11 June 2026, 6:00 PM – 7:30 PM AEST",
);
console.log(
  "    Location field: Caf\u00e9 Nest Cinema, Tumbarumba NSW 2653",
);
console.log();
console.log("[4] Open any .ics in a text editor and check:");
console.log(
  "    GOOD (TZID format):  DTSTART;TZID=Australia/Sydney:20260622T190000",
);
console.log(
  "    BAD  (UTC-Z format): DTSTART:20260622T090000Z  \u2190 this is the old bug",
);
console.log();
