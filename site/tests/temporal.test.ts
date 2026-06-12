/**
 * site/tests/temporal.test.ts
 *
 * Tests for the naive datetime → UTC helpers in site/utils/temporal.ts (ft-07i.15).
 *
 * Run:
 *   deno test site/tests/temporal.test.ts
 */

import { describe, it } from "@std/testing/bdd";
import { assertEquals, assertThrows } from "@std/assert";
import {
  formatNaiveDatetime,
  naiveDatetimeToDate,
  naiveDatetimeToDateStr,
  nowAsNaiveLocal,
} from "../utils/temporal.ts";

describe("naiveDatetimeToDate", () => {
  it("converts AEST (UTC+10) summer time correctly", () => {
    // 19:00 AEST (Apr–Oct) = 09:00 UTC same day
    const d = naiveDatetimeToDate("2026-06-22T19:00:00", "Australia/Sydney");
    assertEquals(d.toISOString(), "2026-06-22T09:00:00.000Z");
  });

  it("converts AEDT (UTC+11) daylight saving time correctly", () => {
    // 19:00 AEDT (Oct–Apr) = 08:00 UTC same day
    const d = naiveDatetimeToDate("2026-01-15T19:00:00", "Australia/Sydney");
    assertEquals(d.toISOString(), "2026-01-15T08:00:00.000Z");
  });

  it("handles midnight crossing correctly", () => {
    // 10:00 AEST = 00:00 UTC same day
    const d = naiveDatetimeToDate("2026-06-22T10:00:00", "Australia/Sydney");
    assertEquals(d.toISOString(), "2026-06-22T00:00:00.000Z");
  });

  it("handles truncated HH:mm input (no seconds)", () => {
    const d = naiveDatetimeToDate("2026-06-22T19:00", "Australia/Sydney");
    assertEquals(d.toISOString(), "2026-06-22T09:00:00.000Z");
  });

  it("handles UTC timezone", () => {
    const d = naiveDatetimeToDate("2026-06-22T09:00:00", "UTC");
    assertEquals(d.toISOString(), "2026-06-22T09:00:00.000Z");
  });

  it("handles New York timezone (UTC-4 in summer)", () => {
    const d = naiveDatetimeToDate("2026-06-22T09:00:00", "America/New_York");
    assertEquals(d.toISOString(), "2026-06-22T13:00:00.000Z");
  });

  it("throws on invalid datetime string", () => {
    assertThrows(() => naiveDatetimeToDate("not-a-date", "Australia/Sydney"));
  });

  it("throws on invalid timezone", () => {
    assertThrows(() =>
      naiveDatetimeToDate("2026-06-22T19:00:00", "Mars/Olympus")
    );
  });
});

describe("naiveDatetimeToDateStr", () => {
  it("extracts date from datetime string without timezone conversion", () => {
    assertEquals(
      naiveDatetimeToDateStr("2026-06-22T19:00:00"),
      "2026-06-22",
    );
  });

  it("handles midnight", () => {
    assertEquals(
      naiveDatetimeToDateStr("2026-06-22T00:00:00"),
      "2026-06-22",
    );
  });

  it("handles truncated HH:mm input", () => {
    assertEquals(
      naiveDatetimeToDateStr("2026-06-22T19:00"),
      "2026-06-22",
    );
  });
});

describe("nowAsNaiveLocal", () => {
  it("returns a naive datetime string (no Z or offset)", () => {
    const result = nowAsNaiveLocal("Australia/Sydney");
    // Should match "YYYY-MM-DDTHH:MM:SS" with no timezone suffix
    const pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
    assertEquals(pattern.test(result), true);
  });

  it("returns a plausible current time (within 24h of UTC now)", () => {
    const result = nowAsNaiveLocal("Australia/Sydney");
    const naive = new Date(result + "Z"); // parse as UTC for rough check
    const delta = Math.abs(naive.getTime() - Date.now());
    // Within 24 hours (timezone offset)
    assertEquals(delta < 24 * 60 * 60 * 1000, true);
  });

  it("defaults to Australia/Sydney", () => {
    const withTz = nowAsNaiveLocal("Australia/Sydney");
    const withDefault = nowAsNaiveLocal();
    // Both should return the same value (within a second of each other)
    assertEquals(withTz.slice(0, 16), withDefault.slice(0, 16));
  });
});

describe("formatNaiveDatetime", () => {
  it("formats a Sydney AEST event date correctly", () => {
    const result = formatNaiveDatetime(
      "2026-06-22T19:00:00",
      "Australia/Sydney",
      { weekday: "long", hour: "numeric", hour12: true },
    );
    // Should contain 'Monday' and '7' (for 7pm)
    assertEquals(result.includes("Monday"), true);
    assertEquals(result.toLowerCase().includes("7"), true);
  });

  it("returns the original string on invalid input", () => {
    const result = formatNaiveDatetime(
      "bad-date",
      "Australia/Sydney",
      { hour: "numeric" },
    );
    assertEquals(result, "bad-date");
  });
});
