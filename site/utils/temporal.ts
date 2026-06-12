/**
 * site/utils/temporal.ts
 *
 * Helpers for working with naive local datetime strings (no timezone offset)
 * paired with an IANA timezone. These are the canonical helpers for all event
 * date handling now that group_events.event_date stores wall-clock local time
 * (timestamp, no tz) rather than UTC timestamptz.
 *
 * Background (ft-07i.15):
 *   Previously event_date was stored as UTC, requiring manual correction after
 *   DST transitions. Now the wall-clock time (e.g. "19:00 Sydney") is stored
 *   directly, paired with the timezone column. UTC conversion happens at point
 *   of use via these helpers (app-side) or AT TIME ZONE (DB-side).
 */

/**
 * Convert a naive local datetime string + IANA timezone → a proper Date (UTC epoch).
 *
 * @param localDt  Naive local datetime, e.g. "2026-06-22T19:00:00" or "2026-06-22T19:00"
 * @param tz       IANA timezone, e.g. "Australia/Sydney"
 * @returns        A Date whose .getTime() is the correct UTC epoch milliseconds
 *
 * @example
 *   naiveDatetimeToDate("2026-06-22T19:00:00", "Australia/Sydney")
 *   // → same as new Date("2026-06-22T09:00:00Z") (AEST is UTC+10)
 */
export function naiveDatetimeToDate(localDt: string, tz: string): Date {
  const zdt = Temporal.PlainDateTime.from(localDt).toZonedDateTime(tz);
  return new Date(zdt.epochMilliseconds);
}

/**
 * Get the current wall-clock time in the given IANA timezone as a naive
 * datetime string (no offset). Used for PostgREST filter comparisons against
 * the naive timestamp event_date column.
 *
 * ⚠️  Limitation: Only gives correct filter results when all events use the
 * same timezone as `tz`. For the FT system all events currently use
 * Australia/Sydney so this is correct. Document if multi-tz events are added.
 *
 * @param tz  IANA timezone identifier (default: "Australia/Sydney")
 * @returns   e.g. "2026-06-19T12:41:00"
 */
export function nowAsNaiveLocal(tz = "Australia/Sydney"): string {
  return Temporal.Now.plainDateTimeISO(tz).toString({ smallestUnit: "second" });
}

/**
 * Format a naive local datetime + timezone for display using Intl.DateTimeFormat.
 *
 * @param localDt  Naive local datetime string, e.g. "2026-06-22T19:00:00"
 * @param tz       IANA timezone, e.g. "Australia/Sydney"
 * @param options  Intl.DateTimeFormatOptions (timeZone will be overridden with `tz`)
 * @param locale   BCP 47 locale string (default: "en-AU")
 */
export function formatNaiveDatetime(
  localDt: string,
  tz: string,
  options: Intl.DateTimeFormatOptions,
  locale = "en-AU",
): string {
  try {
    const date = naiveDatetimeToDate(localDt, tz);
    return date.toLocaleString(locale, { ...options, timeZone: tz });
  } catch {
    return localDt;
  }
}

/**
 * Extract just the local date (YYYY-MM-DD) from a naive local datetime string
 * without any timezone conversion — pure string/Temporal parsing.
 *
 * @example
 *   naiveDatetimeToDateStr("2026-06-22T19:00:00") // → "2026-06-22"
 */
export function naiveDatetimeToDateStr(localDt: string): string {
  return Temporal.PlainDateTime.from(localDt).toPlainDate().toString();
}
