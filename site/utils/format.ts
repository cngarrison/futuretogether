/**
 * site/utils/format.ts
 *
 * Display formatting helpers. Pure functions — no side effects, no imports.
 * Safe to use in both server components and islands.
 */

/**
 * Converts a raw member count to a banded display string.
 * Exact counts are intentionally hidden for privacy and to avoid
 * discouraging people from joining smaller groups.
 *
 * Bands: <10 | 10+ | 25+ | 50+ | 100+ | 250+
 */
export function formatMemberCount(count: number): string {
  if (count < 10) return "Under 10 members";
  if (count < 25) return "10+ members";
  if (count < 50) return "25+ members";
  if (count < 100) return "50+ members";
  if (count < 250) return "100+ members";
  return "250+ members";
}
