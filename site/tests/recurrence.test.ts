/**
 * site/tests/recurrence.test.ts
 *
 * Unit tests for site/utils/recurrence.ts
 * Run: deno test site/tests/recurrence.test.ts --allow-env
 */

import { assert, assertEquals } from "@std/assert";
import {
  expandRRule,
  getNthWeekdayOfMonth,
  parseRRule,
} from "../utils/recurrence.ts";

// ---------------------------------------------------------------------------
// parseRRule
// ---------------------------------------------------------------------------

Deno.test("parseRRule: simple FREQ=MONTHLY", () => {
  const result = parseRRule("FREQ=MONTHLY");
  assertEquals(result, { FREQ: "MONTHLY" });
});

Deno.test("parseRRule: full rule FREQ=MONTHLY;BYDAY=3TU;COUNT=6", () => {
  const result = parseRRule("FREQ=MONTHLY;BYDAY=3TU;COUNT=6");
  assertEquals(result, { FREQ: "MONTHLY", BYDAY: "3TU", COUNT: "6" });
});

Deno.test("parseRRule: UNTIL with date string", () => {
  const result = parseRRule("FREQ=MONTHLY;UNTIL=20261231");
  assertEquals(result, { FREQ: "MONTHLY", UNTIL: "20261231" });
});

Deno.test("parseRRule: unknown/extra keys are preserved", () => {
  const result = parseRRule("FREQ=WEEKLY;INTERVAL=2;WKST=MO;X-CUSTOM=FOO");
  assertEquals(result["FREQ"], "WEEKLY");
  assertEquals(result["INTERVAL"], "2");
  assertEquals(result["WKST"], "MO");
  assertEquals(result["X-CUSTOM"], "FOO");
});

Deno.test("parseRRule: empty string returns empty object", () => {
  // A single empty segment produces { "": "" }, so we just check FREQ is absent
  const result = parseRRule("");
  assertEquals(result["FREQ"], undefined);
});

// ---------------------------------------------------------------------------
// getNthWeekdayOfMonth
// ---------------------------------------------------------------------------

const TIME_10 = Temporal.PlainTime.from("10:00:00");

Deno.test("getNthWeekdayOfMonth: 3rd Tuesday of July 2026 is the 21st", () => {
  // July 2026: 1st = Wednesday (3), so 1st Tuesday = 7th, 2nd=14th, 3rd=21st
  const result = getNthWeekdayOfMonth(2026, 7, 2, 3, TIME_10);
  assert(result !== null, "Expected a non-null result");
  assertEquals(result.day, 21);
  assertEquals(result.month, 7);
  assertEquals(result.year, 2026);
});

Deno.test("getNthWeekdayOfMonth: 1st Monday of August 2026 is the 3rd", () => {
  // August 2026: 1st = Saturday (6), so 1st Monday = 3rd
  const result = getNthWeekdayOfMonth(2026, 8, 1, 1, TIME_10);
  assert(result !== null, "Expected a non-null result");
  assertEquals(result.day, 3);
  assertEquals(result.month, 8);
  assertEquals(result.year, 2026);
});

Deno.test("getNthWeekdayOfMonth: last Monday of June 2026 (ordinal=-1) is the 29th", () => {
  // June 2026: 30th = Tuesday, so last Monday = 29th
  const result = getNthWeekdayOfMonth(2026, 6, 1, -1, TIME_10);
  assert(result !== null, "Expected a non-null result");
  assertEquals(result.day, 29);
  assertEquals(result.month, 6);
  assertEquals(result.year, 2026);
});

Deno.test("getNthWeekdayOfMonth: returns null when ordinal falls outside month", () => {
  // February 2026 has 28 days. 5th Tuesday:
  // Feb 1 = Sunday (7), so 1st Tue = Feb 3, 5th Tue = Feb 3 + 28 = Mar 3 → outside Feb
  const result = getNthWeekdayOfMonth(2026, 2, 2, 5, TIME_10);
  assertEquals(result, null);
});

Deno.test("getNthWeekdayOfMonth: time-of-day is preserved from the time argument", () => {
  const customTime = Temporal.PlainTime.from("18:30:00");
  const result = getNthWeekdayOfMonth(2026, 7, 2, 3, customTime);
  assert(result !== null, "Expected a non-null result");
  assertEquals(result.hour, 18);
  assertEquals(result.minute, 30);
  assertEquals(result.second, 0);
});

// ---------------------------------------------------------------------------
// expandRRule
// ---------------------------------------------------------------------------
//
// NOTE: expandRRule filters out dates that are:
//   (a) before Temporal.Now.plainDateTimeISO(seedTimezone), or
//   (b) after Temporal.Now.plainDateTimeISO(seedTimezone).toPlainDate()
//         .add({ months: lookaheadMonths })
//
// We therefore build seeds dynamically from "now" so tests are date-agnostic.

const TZ = "UTC";

/** Returns a naive datetime string for today at the given time */
function seedNow(timeStr: string): string {
  const now = Temporal.Now.plainDateTimeISO(TZ);
  return `${now.toPlainDate()}T${timeStr}`;
}

/** Returns this month's third Tuesday at the given time for a BYDAY=3TU seed. */
function seedThirdTuesday(timeStr: string): string {
  const now = Temporal.Now.plainDateTimeISO(TZ);
  const seed = getNthWeekdayOfMonth(
    now.year,
    now.month,
    2,
    3,
    Temporal.PlainTime.from(timeStr),
  );
  assert(seed !== null, "Every month has a third Tuesday");
  return seed.toString();
}

Deno.test("expandRRule FREQ=MONTHLY;BYDAY=3TU: all results are Tuesdays at 10:00", () => {
  const seed = seedThirdTuesday("10:00:00");
  const results = expandRRule("FREQ=MONTHLY;BYDAY=3TU", seed, TZ, 3);
  // The lookahead endpoint is inclusive, so this window can contain four
  // third Tuesdays: the seed occurrence plus one in each of the next 3 months.
  assert(results.length <= 4, `Expected ≤4 results, got ${results.length}`);
  for (const dt of results) {
    // dayOfWeek: 2 = Tuesday in Temporal convention
    assertEquals(
      dt.dayOfWeek,
      2,
      `Expected Tuesday, got dayOfWeek=${dt.dayOfWeek} for ${dt}`,
    );
    assertEquals(dt.hour, 10, `Expected hour=10 for ${dt}`);
    assertEquals(dt.minute, 0, `Expected minute=0 for ${dt}`);
  }
});

Deno.test("expandRRule FREQ=WEEKLY;INTERVAL=2: gaps are exactly 14 days", () => {
  const seed = seedNow("09:00:00");
  const results = expandRRule("FREQ=WEEKLY;INTERVAL=2", seed, TZ, 3);
  assert(
    results.length >= 2,
    `Expected at least 2 results, got ${results.length}`,
  );
  for (let i = 1; i < results.length; i++) {
    const prev = results[i - 1].toPlainDate();
    const curr = results[i].toPlainDate();
    const gap = prev.until(curr, { largestUnit: "days" }).days;
    assertEquals(
      gap,
      14,
      `Expected 14-day gap between result ${i - 1} and ${i}, got ${gap}`,
    );
  }
});

Deno.test("expandRRule COUNT=2: stops after 2 results", () => {
  const seed = seedNow("10:00:00");
  const results = expandRRule("FREQ=MONTHLY;COUNT=2", seed, TZ, 12);
  assert(
    results.length <= 2,
    `Expected ≤2 results due to COUNT=2, got ${results.length}`,
  );
});

Deno.test("expandRRule UNTIL: stops at the specified date", () => {
  // UNTIL one month from now — results should all be on or before that date
  const now = Temporal.Now.plainDateTimeISO(TZ);
  const untilDate = now.toPlainDate().add({ months: 1 });
  const untilStr = `${untilDate.year}${
    String(untilDate.month).padStart(2, "0")
  }${String(untilDate.day).padStart(2, "0")}`;
  const seed = `${now.toPlainDate()}T10:00:00`;
  const results = expandRRule(`FREQ=WEEKLY;UNTIL=${untilStr}`, seed, TZ, 6);
  for (const dt of results) {
    const cmp = Temporal.PlainDate.compare(dt.toPlainDate(), untilDate);
    assert(cmp <= 0, `Result ${dt} is after UNTIL date ${untilDate}`);
  }
});

Deno.test("expandRRule: all returned datetimes have the same time-of-day as seed", () => {
  const seed = seedNow("14:30:00");
  const results = expandRRule("FREQ=WEEKLY", seed, TZ, 3);
  for (const dt of results) {
    assertEquals(dt.hour, 14, `Expected hour=14 for ${dt}`);
    assertEquals(dt.minute, 30, `Expected minute=30 for ${dt}`);
    assertEquals(dt.second, 0, `Expected second=0 for ${dt}`);
  }
});

Deno.test("expandRRule COUNT=2 with large lookahead: exactly ≤2 results returned", () => {
  // Even with a large lookaheadMonths, COUNT=2 must cap the output
  const seed = seedNow("10:00:00");
  const results = expandRRule("FREQ=WEEKLY;COUNT=2", seed, TZ, 24);
  assert(results.length <= 2, `Expected ≤2 results, got ${results.length}`);
});

Deno.test("expandRRule: returns empty array when seed is in past and COUNT already exhausted", () => {
  // Seed 10 years ago with COUNT=1 — the single result is in the past,
  // so nothing should be >= now
  const pastSeed = "2015-01-01T10:00:00";
  const results = expandRRule("FREQ=MONTHLY;COUNT=1", pastSeed, TZ, 3);
  assertEquals(
    results.length,
    0,
    "Expected no future results for exhausted past COUNT",
  );
});
