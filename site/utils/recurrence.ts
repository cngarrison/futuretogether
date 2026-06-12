/**
 * site/utils/recurrence.ts
 *
 * Pure-Temporal RRULE expander for recurring event programs.
 * Supports: FREQ=WEEKLY|MONTHLY, INTERVAL, BYDAY (e.g. 3TU, -1MO), COUNT, UNTIL
 *
 * No npm dependencies — uses the Temporal API (available in Deno 1.40+ / Fresh v2).
 *
 * Used by: site/utils/groups.ts (publishGroupProgram)
 *          site/utils/cron.ts (generateRecurringInstances)
 */

const DAY_CODES: Record<string, number> = {
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
  SU: 7,
};

/**
 * Parse a semicolon-separated RRULE string into a key→value map.
 * Keys are uppercased. E.g. "FREQ=MONTHLY;BYDAY=3TU" → { FREQ: "MONTHLY", BYDAY: "3TU" }
 */
export function parseRRule(rrule: string): Record<string, string> {
  return Object.fromEntries(
    rrule.split(";").map((part) => {
      const eq = part.indexOf("=");
      return eq === -1 ? [part.trim().toUpperCase(), ""] : [
        part.slice(0, eq).trim().toUpperCase(),
        part.slice(eq + 1).trim(),
      ];
    }),
  );
}

/**
 * Return the nth occurrence of a given weekday within a calendar month.
 * dayOfWeek follows Temporal convention: 1=Monday … 7=Sunday.
 * ordinal: 1–4 for 1st–4th; -1 for last.
 * Returns null if the computed day falls outside the month.
 */
export function getNthWeekdayOfMonth(
  year: number,
  month: number,
  dayOfWeek: number,
  ordinal: number,
  time: Temporal.PlainTime,
): Temporal.PlainDateTime | null {
  const firstDay = Temporal.PlainDate.from({ year, month, day: 1 });
  const daysInMonth = firstDay.daysInMonth;
  if (ordinal > 0) {
    const firstDow = firstDay.dayOfWeek;
    const offset = ((dayOfWeek - firstDow) + 7) % 7;
    const day = 1 + offset + (ordinal - 1) * 7;
    if (day > daysInMonth) return null;
    return Temporal.PlainDate.from({ year, month, day }).toPlainDateTime(time);
  } else {
    // ordinal = -1: last occurrence of that weekday in the month
    const lastDay = Temporal.PlainDate.from({ year, month, day: daysInMonth });
    const lastDow = lastDay.dayOfWeek;
    const offset = ((lastDow - dayOfWeek) + 7) % 7;
    const day = daysInMonth - offset;
    if (day < 1) return null;
    return Temporal.PlainDate.from({ year, month, day }).toPlainDateTime(time);
  }
}

/**
 * Expand an iCal RRULE from a seed naive-local datetime string.
 *
 * Returns an array of Temporal.PlainDateTime values representing future
 * occurrences from "now" (in seedTimezone) up to lookaheadMonths from today.
 *
 * @param rrule          iCal RRULE string, e.g. "FREQ=MONTHLY;BYDAY=3TU"
 * @param seedDatetime   Naive local datetime string, e.g. "2026-07-15T10:00:00"
 * @param seedTimezone   IANA timezone, e.g. "Australia/Sydney" (used to determine "now")
 * @param lookaheadMonths  How many months ahead to generate (default: 3)
 */
export function expandRRule(
  rrule: string,
  seedDatetime: string,
  seedTimezone: string,
  lookaheadMonths = 3,
): Temporal.PlainDateTime[] {
  const params = parseRRule(rrule);
  const freq = params["FREQ"] ?? "MONTHLY";
  const interval = Math.max(1, parseInt(params["INTERVAL"] ?? "1", 10) || 1);
  const byday = params["BYDAY"] ?? null;
  const count = params["COUNT"] ? parseInt(params["COUNT"], 10) : null;
  const untilRaw = params["UNTIL"] ?? null;
  const until: Temporal.PlainDate | null = untilRaw
    ? (() => {
      try {
        // UNTIL can be YYYYMMDD or YYYYMMDDTHHmmssZ — normalise to ISO date
        const ds = untilRaw.length >= 8
          ? `${untilRaw.slice(0, 4)}-${untilRaw.slice(4, 6)}-${
            untilRaw.slice(6, 8)
          }`
          : untilRaw;
        return Temporal.PlainDate.from(ds);
      } catch {
        return null;
      }
    })()
    : null;

  const seed = Temporal.PlainDateTime.from(seedDatetime);
  const seedTime = seed.toPlainTime();
  const nowLocal = Temporal.Now.plainDateTimeISO(seedTimezone);
  const endDate = nowLocal.toPlainDate().add({ months: lookaheadMonths });

  const dates: Temporal.PlainDateTime[] = [];
  let current = seed;
  let iterations = 0;
  const maxIterations = 200;
  let totalOccurrences = 0; // tracks all occurrences (past + future) for COUNT

  while (iterations < maxIterations) {
    iterations++;

    // COUNT is total occurrences from DTSTART (RFC 5545), including past ones.
    if (count !== null && totalOccurrences >= count) break;
    if (until && Temporal.PlainDate.compare(current.toPlainDate(), until) > 0) {
      break;
    }
    if (Temporal.PlainDate.compare(current.toPlainDate(), endDate) > 0) break;

    // Only collect occurrences from now onward; COUNT tracks all (RFC 5545)
    totalOccurrences++;
    if (Temporal.PlainDateTime.compare(current, nowLocal) >= 0) {
      dates.push(current);
    }

    // Advance to next occurrence
    if (freq === "WEEKLY") {
      current = current.add({ weeks: interval });
    } else if (freq === "MONTHLY") {
      if (byday && /^-?\d+[A-Z]{2}$/.test(byday)) {
        // Nth weekday: e.g. "3TU" = 3rd Tuesday, "-1MO" = last Monday
        const match = byday.match(/^(-?\d+)([A-Z]{2})$/);
        if (!match) break;
        const ordinal = parseInt(match[1], 10);
        const dayOfWeek = DAY_CODES[match[2]];
        if (!dayOfWeek) break;
        const nextYM = current.toPlainDate().toPlainYearMonth().add({
          months: interval,
        });
        const next = getNthWeekdayOfMonth(
          nextYM.year,
          nextYM.month,
          dayOfWeek,
          ordinal,
          seedTime,
        );
        if (!next) break;
        current = next;
      } else {
        // Simple day-of-month recurrence
        current = current.add({ months: interval });
      }
    } else {
      break; // Unknown FREQ — stop gracefully
    }
  }

  return dates;
}
