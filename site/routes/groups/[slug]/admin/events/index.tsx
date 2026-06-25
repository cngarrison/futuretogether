import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getGroupEventsForAdmin } from "@/utils/db/group-events.ts";
import type { GroupEventListItem } from "@/utils/db/group-events.ts";
import {
  getGroupPrograms,
  getNextEventsForPrograms,
  getRecentPastInstances,
} from "@/utils/db/group-programs.ts";
import type { GroupProgramDetail } from "@/utils/db/group-programs.ts";
import { naiveDatetimeToDate } from "@/utils/temporal.ts";
import { parseRRule } from "@/utils/recurrence.ts";

const PAST_INSTANCES_LIMIT = 5;

interface PageData {
  events: GroupEventListItem[];
  programs: GroupProgramDetail[];
  recentPastInstances: Array<GroupEventListItem & { program_id: string }>;
  nextEvents: Record<string, GroupEventListItem>;
  groupName: string;
  groupSlug: string;
}

export const handler = define.handlers<PageData>({
  async GET(ctx) {
    const group = ctx.state.group!;
    const [events, programs] = await Promise.all([
      getGroupEventsForAdmin(group.id, ctx.state),
      getGroupPrograms(group.id, ctx.state),
    ]);
    const allProgramIds = programs.map((p: { id: string }) => p.id);
    const [recentPastInstances, nextEvents] = await Promise.all([
      getRecentPastInstances(group.id, PAST_INSTANCES_LIMIT, ctx.state),
      getNextEventsForPrograms(allProgramIds, ctx.state),
    ]);
    return page({
      events,
      programs,
      recentPastInstances,
      nextEvents,
      groupName: group.name,
      groupSlug: group.slug,
    });
  },
});

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

// dateStr is a naive local datetime (ft-07i.15) — use naiveDatetimeToDate.
function formatEventDateShort(
  dateStr: string | null,
  timezone: string,
): string {
  if (!dateStr) return "Date TBD";
  try {
    return naiveDatetimeToDate(dateStr, timezone).toLocaleString("en-AU", {
      timeZone: timezone,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

/** Human-readable RRULE summary, e.g. "Weekly on Tuesday" */
function formatRRule(rrule: string | null): string {
  if (!rrule) return "";
  const days: Record<string, string> = {
    MO: "Monday",
    TU: "Tuesday",
    WE: "Wednesday",
    TH: "Thursday",
    FR: "Friday",
    SA: "Saturday",
    SU: "Sunday",
  };
  const ordLabels: Record<string, string> = {
    "1": "1st",
    "2": "2nd",
    "3": "3rd",
    "4": "4th",
    "-1": "Last",
  };
  const params = parseRRule(rrule);
  const freq = params["FREQ"] ?? "";
  const interval = params["INTERVAL"] ? parseInt(params["INTERVAL"], 10) : 1;
  const byday = params["BYDAY"] ?? "";
  if (freq === "WEEKLY") {
    const prefix = interval === 2
      ? "Fortnightly"
      : interval > 1
      ? `Every ${interval} weeks`
      : "Weekly";
    if (byday && !/^-?\d/.test(byday)) {
      const dayNames = byday.split(",").map((d) => days[d.trim()] ?? d).join(
        ", ",
      );
      return `${prefix} on ${dayNames}`;
    }
    return prefix;
  }
  if (freq === "MONTHLY") {
    const prefix = interval > 1 ? `Every ${interval} months` : "Monthly";
    const m = byday.match(/^(-?\d+)([A-Z]{2})$/);
    if (m) {
      const ord = ordLabels[m[1]] ?? m[1];
      const day = days[m[2]] ?? m[2];
      return `${prefix} · ${ord} ${day}`;
    }
    return prefix;
  }
  return rrule;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    published: "bg-green-100 text-green-700",
    active: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-[#eef5f7] text-primary",
    archived: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      class={`text-xs font-semibold px-2.5 py-1 rounded-full ${
        styles[status] ?? styles.draft
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Series card (single program or multi-sequence combined)
// ─────────────────────────────────────────────────────────────

function SeriesCard({
  programs,
  groupSlug,
  nextEvents,
  programPastCounts,
}: {
  programs: GroupProgramDetail[];
  groupSlug: string;
  nextEvents: Record<string, GroupEventListItem>;
  programPastCounts: Record<string, number>;
}) {
  const first = programs[0];

  if (programs.length === 1) {
    const prog = first;
    const nextEvent = nextEvents[prog.id];
    const pastCount = programPastCounts[prog.id] ?? 0;
    return (
      <div
        class="rounded-2xl overflow-hidden"
        style="background:white;border-left:4px solid #1a5f6e;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;"
      >
        <div class="px-5 py-4 flex flex-wrap items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-1.5">
              <StatusBadge status={prog.status} />
              <span class="text-xs font-mono text-gray-400">{prog.slug}</span>
              {prog.slug_suffix && (
                <span class="text-xs px-2 py-0.5 rounded-full bg-[#eef5f7] text-primary font-medium">
                  {prog.slug_suffix}
                </span>
              )}
            </div>
            <h3 class="font-semibold text-near-black truncate">{prog.title}</h3>
            {prog.recurrence_rule && (
              <p class="text-sm text-gray-500 mt-0.5">
                {formatRRule(prog.recurrence_rule)}
              </p>
            )}
            <p class="text-sm mt-1">
              <span class="text-gray-400">Next:</span>
              {nextEvent
                ? (
                  <span class="text-near-black">
                    {formatEventDateShort(
                      nextEvent.event_date,
                      nextEvent.timezone,
                    )}
                  </span>
                )
                : <span class="text-gray-400 italic">No upcoming</span>}
            </p>
            <p class="text-xs text-gray-400 mt-1">
              {pastCount} past instance{pastCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <a
              href={`/groups/${groupSlug}/admin/events/${prog.id}/registrations`}
              class="text-sm text-primary px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Registrations
            </a>
            <a
              href={`/groups/${groupSlug}/admin/events/${prog.id}/`}
              class="text-sm text-primary px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Edit
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Combined card — multiple sequences sharing the same slug
  const totalPast = programs.reduce(
    (sum, p) => sum + (programPastCounts[p.id] ?? 0),
    0,
  );

  return (
    <div
      class="rounded-2xl overflow-hidden"
      style="background:white;border-left:4px solid #1a5f6e;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;"
    >
      {/* Combined header */}
      <div class="px-5 pt-4 pb-3">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-mono text-gray-400">{first.slug}</span>
          <StatusBadge status={first.status} />
        </div>
        <h3 class="font-semibold text-near-black">{first.title}</h3>
      </div>
      {/* Sequence rows */}
      <div style="border-top:1px solid #f3f4f6;">
        {programs.map((prog, i) => {
          const nextEvent = nextEvents[prog.id];
          return (
            <div
              key={prog.id}
              class="px-5 py-3 flex flex-wrap items-center gap-3"
              style={i > 0 ? "border-top:1px solid #f9fafb;" : ""}
            >
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex-shrink-0">
                Seq {prog.sequence}
              </span>
              {prog.slug_suffix && (
                <span class="text-xs px-2 py-0.5 rounded-full bg-[#eef5f7] text-primary font-medium flex-shrink-0">
                  {prog.slug_suffix}
                </span>
              )}
              {prog.recurrence_rule && (
                <span class="text-xs text-gray-500 flex-1 min-w-0 truncate">
                  {formatRRule(prog.recurrence_rule)}
                </span>
              )}
              <span class="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                Next: {nextEvent
                  ? formatEventDateShort(
                    nextEvent.event_date,
                    nextEvent.timezone,
                  )
                  : <em class="text-gray-400">No upcoming</em>}
              </span>
              <div class="flex gap-1.5 flex-shrink-0">
                <a
                  href={`/groups/${groupSlug}/admin/events/${prog.id}/registrations`}
                  class="text-xs text-primary px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Registrations
                </a>
                <a
                  href={`/groups/${groupSlug}/admin/events/${prog.id}/`}
                  class="text-xs text-primary px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Edit
                </a>
              </div>
            </div>
          );
        })}
      </div>
      {/* Footer: total past count */}
      <div
        class="px-5 py-3 text-xs text-gray-500"
        style="border-top:1px solid #f3f4f6;background:#fafafa;"
      >
        {totalPast} past instance{totalPast !== 1 ? "s" : ""}{" "}
        across all sequences
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────

export default define.page<typeof handler>(function EventsAdminPage({ data }) {
  const {
    events,
    programs,
    recentPastInstances,
    nextEvents,
    groupName,
    groupSlug,
  } = data;

  const now = new Date();

  // Set of one-off program IDs (for categorising events)
  const oneOffProgramIds = new Set(
    programs.filter((p) => p.program_type === "one-off").map((p) => p.id),
  );

  // ── Section 1: Active recurring programs ─────────────────
  const activeRecurring = programs.filter(
    (p) =>
      p.program_type === "recurring" &&
      (p.status === "published" || p.status === "active"),
  );

  // ── Section 1: Upcoming one-off events ───────────────────
  // Events linked to one-off programs (or standalone with no program) that are
  // future and not cancelled / completed.
  const upcomingOneOff = events.filter((e) => {
    const isOneOff = e.program_id ? oneOffProgramIds.has(e.program_id) : true; // standalone (program_id null) → treat as one-off
    if (!isOneOff) return false;
    const isFuture = e.event_date === null || new Date(e.event_date) >= now;
    return isFuture && e.status !== "cancelled" && e.status !== "completed";
  }).sort((a, b) => (a.event_date ?? "").localeCompare(b.event_date ?? ""));

  // ── Section 2: Past standalone events (program_id null) ──
  const pastStandalone = events.filter(
    (e) =>
      !e.program_id &&
      e.event_date !== null &&
      new Date(e.event_date) < now,
  );

  // Merged past rows: recent recurring instances + past standalone, reverse-chron
  const allPastRows: GroupEventListItem[] = [
    ...recentPastInstances,
    ...pastStandalone,
  ].sort((a, b) => (b.event_date ?? "").localeCompare(a.event_date ?? ""));

  // ── Section 3: Inactive programs (any type, non-active status) ──
  const inactivePrograms = programs.filter(
    (p) => p.status !== "published" && p.status !== "active",
  );

  // Group active recurring programs by slug for combined series cards
  const recurringBySlug = new Map<string, GroupProgramDetail[]>();
  for (const prog of activeRecurring) {
    const existing = recurringBySlug.get(prog.slug) ?? [];
    existing.push(prog);
    recurringBySlug.set(prog.slug, existing);
  }
  for (const [slug, progs] of recurringBySlug) {
    recurringBySlug.set(
      slug,
      [...progs].sort((a, b) => a.sequence - b.sequence),
    );
  }
  const sortedSlugs = [...recurringBySlug.keys()].sort();

  // Past counts per program: use instance_count from program record
  // (reflects true total, not the page-limit slice)
  const programPastCounts: Record<string, number> = {};
  for (const prog of programs) {
    programPastCounts[prog.id] = prog.instance_count;
  }

  // Stats
  const totalPrograms = programs.length;
  const upcomingCount = upcomingOneOff.length +
    activeRecurring.filter((p) => nextEvents[p.id]).length;
  const draftCount = programs.filter((p) => p.status === "draft").length;
  const hasContent = programs.length > 0 || events.length > 0;

  return (
    <>
      <Head>
        <title>{groupName} — Events — Future Together</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Header */}
        <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 class="text-2xl sm:text-3xl font-bold text-near-black">Events</h1>
          <a
            href={`/groups/${groupSlug}/admin/events/new`}
            class="inline-block px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-opacity hover:opacity-90"
            style="background:#c4853a;"
          >
            + New Event
          </a>
        </div>

        {/* Stats */}
        <div class="grid grid-cols-3 gap-4 mb-10">
          {([
            { label: "Programs", value: totalPrograms },
            { label: "Upcoming", value: upcomingCount },
            { label: "Drafts", value: draftCount },
          ] as Array<{ label: string; value: number }>).map((stat) => (
            <div
              key={stat.label}
              class="rounded-xl px-4 py-4 text-center"
              style="background:white;border:1px solid #e5e7eb;"
            >
              <p class="text-2xl font-bold text-near-black">{stat.value}</p>
              <p class="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {!hasContent && (
          <div
            class="rounded-2xl px-8 py-14 text-center"
            style="background:white;border:1px solid #e5e7eb;"
          >
            <p class="text-gray-500 mb-4">No events yet.</p>
            <a
              href={`/groups/${groupSlug}/admin/events/new`}
              class="inline-block px-5 py-2.5 text-white text-sm font-semibold rounded-xl"
              style="background:#c4853a;"
            >
              Create your first event
            </a>
          </div>
        )}

        {/* ─────────── SECTION 1: Active Programs & Upcoming Events ─────────── */}
        {(activeRecurring.length > 0 || upcomingOneOff.length > 0) && (
          <section class="mb-10">
            <h2 class="text-lg font-semibold text-near-black mb-4">
              Active Programs &amp; Upcoming Events
            </h2>

            {/* Combined series cards (grouped by slug, sorted) */}
            {sortedSlugs.length > 0 && (
              <div class="space-y-3 mb-6">
                {sortedSlugs.map((slug) => (
                  <SeriesCard
                    key={slug}
                    programs={recurringBySlug.get(slug)!}
                    groupSlug={groupSlug}
                    nextEvents={nextEvents}
                    programPastCounts={programPastCounts}
                  />
                ))}
              </div>
            )}

            {/* Upcoming one-off events */}
            {upcomingOneOff.length > 0 && (
              <div>
                {sortedSlugs.length > 0 && (
                  <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    One-off Events
                  </h3>
                )}
                <div class="space-y-3">
                  {upcomingOneOff.map((event) => (
                    <div
                      key={event.id}
                      class="rounded-2xl overflow-hidden"
                      style="background:white;border:1px solid #e5e7eb;"
                    >
                      <div class="px-5 py-4 flex flex-wrap items-start justify-between gap-4">
                        <div class="flex-1 min-w-0">
                          <div class="flex flex-wrap items-center gap-2 mb-1.5">
                            <StatusBadge status={event.status} />
                            <span class="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                              Once-off
                            </span>
                            {event.location_type && (
                              <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
                                {event.location_type}
                              </span>
                            )}
                          </div>
                          <h3 class="font-semibold text-near-black truncate">
                            {event.title}
                          </h3>
                          <p class="text-sm text-gray-500 mt-0.5">
                            {formatEventDateShort(
                              event.event_date,
                              event.timezone,
                            )}
                          </p>
                          <p class="text-xs text-gray-400 mt-1">
                            {event.registration_count} registration
                            {event.registration_count !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div class="flex gap-2 flex-shrink-0">
                          <a
                            href={`/groups/${groupSlug}/admin/events/${event.id}/registrations`}
                            class="text-sm text-primary px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            Registrations
                          </a>
                          <a
                            href={`/groups/${groupSlug}/admin/events/${
                              event.program_id ?? event.id
                            }/`}
                            class="text-sm text-primary px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            Edit
                          </a>
                          {event.status === "published" && (
                            <a
                              href={`/groups/${groupSlug}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
                            >
                              View ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ─────────── SECTION 2: Past Events ─────────── */}
        {allPastRows.length > 0 && (
          <section class="mb-10">
            <h2 class="text-lg font-semibold text-near-black mb-4">
              Past Events
            </h2>
            <div
              class="rounded-2xl overflow-hidden"
              style="background:white;border:1px solid #e5e7eb;"
            >
              <table class="w-full">
                <thead>
                  <tr style="border-bottom:1px solid #f3f4f6;">
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Title
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                      Date
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                      Regs
                    </th>
                    <th class="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  {allPastRows.map((event) => (
                    <tr key={event.id} class="hover:bg-gray-50">
                      <td class="px-4 py-3 text-sm font-medium text-near-black">
                        {event.title}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell whitespace-nowrap">
                        {formatEventDateShort(event.event_date, event.timezone)}
                      </td>
                      <td class="px-4 py-3">
                        <StatusBadge status={event.status} />
                      </td>
                      <td class="px-4 py-3 text-right text-sm text-gray-500 hidden sm:table-cell">
                        {event.registration_count}
                      </td>
                      <td class="px-4 py-3 text-right">
                        <div class="flex gap-2 justify-end">
                          <a
                            href={`/groups/${groupSlug}/admin/events/${event.id}/registrations`}
                            class="text-sm text-primary px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            Registrations
                          </a>
                          <a
                            href={`/groups/${groupSlug}/admin/events/${
                              event.program_type === "one-off" && event.program_id
                                ? event.program_id
                                : event.id
                            }/`}
                            class="text-sm text-primary px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            Edit
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {recentPastInstances.length > 0 && (
              <p class="text-xs text-gray-400 mt-2 pl-1">
                Showing the {PAST_INSTANCES_LIMIT}{" "}
                most recent instances per recurring program.
              </p>
            )}
          </section>
        )}

        {/* ─────────── SECTION 3: Inactive Programs ─────────── */}
        {inactivePrograms.length > 0 && (
          <section>
            <details class="group">
              <summary class="cursor-pointer list-none flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-near-black transition-colors select-none py-2">
                <span class="text-xs transition-transform group-open:rotate-90 inline-block">
                  ▶
                </span>
                Show {inactivePrograms.length} inactive program
                {inactivePrograms.length !== 1 ? "s" : ""}
              </summary>
              <div class="mt-3 space-y-2">
                {inactivePrograms.map((prog) => (
                  <div
                    key={prog.id}
                    class="rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                    style="background:white;border:1px solid #e5e7eb;"
                  >
                    <div class="flex flex-wrap items-center gap-3 min-w-0 flex-1">
                      <StatusBadge status={prog.status} />
                      <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {prog.program_type === "recurring"
                          ? "Recurring"
                          : "One-off"}
                      </span>
                      <span class="text-sm text-near-black truncate">
                        {prog.title}
                      </span>
                    </div>
                    <a
                      href={`/groups/${groupSlug}/admin/events/${prog.id}/`}
                      class="text-sm text-primary px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex-shrink-0"
                    >
                      Edit
                    </a>
                  </div>
                ))}
              </div>
            </details>
          </section>
        )}
      </div>
    </>
  );
});
