import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getGroupEventById } from "@/utils/db/group-events.ts";
import type { GroupEventListItem } from "@/utils/db/group-events.ts";
import {
  getGroupEventsForProgram,
  getGroupProgramById,
  getLinkedEventForProgram,
} from "@/utils/db/group-programs.ts";
import type { GroupProgramDetail } from "@/utils/db/group-programs.ts";
import { getGroupEventRegistrants } from "@/utils/db/group-registrations.ts";
import type { GroupEventRegistrant } from "@/utils/db/group-registrations.ts";
import { naiveDatetimeToDate } from "@/utils/temporal.ts";

// ── Types ──────────────────────────────────────────────────────────────────

type RegistrationsMode =
  | {
    mode: "event";
    title: string;
    registrants: GroupEventRegistrant[];
  }
  | {
    mode: "program";
    title: string;
    program: GroupProgramDetail;
    instances: GroupEventListItem[];
  };

interface PageData {
  groupSlug: string;
  groupName: string;
  pageTitle: string;
  idParam: string;
  backId: string; // ID to use for the ← Back link (may differ from idParam for one-off events)
  inner: RegistrationsMode;
}

// ── Handler ────────────────────────────────────────────────────────────────

export const handler = define.handlers<PageData>({
  async GET(ctx) {
    const group = ctx.state.group!;
    const id = ctx.params.id;
    const base = { groupSlug: group.slug, groupName: group.name, idParam: id, backId: id };

    // Try as a group_event first (handles recurring instances + one-off event IDs directly)
    const event = await getGroupEventById(id, ctx.state);
    if (event) {
      if (event.group_id !== group.id) {
        return new Response("Not found", { status: 404 });
      }
      const registrants = await getGroupEventRegistrants(event.id, ctx.state);
      registrants.sort((a, b) => a.registeredAt.localeCompare(b.registeredAt));
      const title = `${event.title} — Registrations`;
      // For one-off events, [id]/index.tsx redirects event.id → program.id.
      // Fresh client-nav doesn't follow 302s, so the Back link must point to
      // program.id directly to avoid a silent no-op navigation.
      const backId = event.program_id ?? id;
      return page({
        ...base,
        backId,
        pageTitle: title,
        inner: { mode: "event", title, registrants },
      });
    }

    // Try as a group_program
    const program = await getGroupProgramById(id, ctx.state);
    if (program) {
      if (program.group_id !== group.id) {
        return new Response("Not found", { status: 404 });
      }

      // One-off program: show registrants for its linked event
      if (program.program_type === "one-off") {
        const linkedEventId = await getLinkedEventForProgram(id, ctx.state);
        const linkedEvent = linkedEventId
          ? await getGroupEventById(linkedEventId, ctx.state)
          : null;
        const registrants = linkedEvent
          ? await getGroupEventRegistrants(linkedEvent.id, ctx.state)
          : [];
        registrants.sort((a, b) => a.registeredAt.localeCompare(b.registeredAt));
        const title = `${program.title} — Registrations`;
        return page({
          ...base,
          pageTitle: title,
          inner: { mode: "event", title, registrants },
        });
      }

      // Recurring program: show instances table with registration counts (sorted asc)
      const allInstances = await getGroupEventsForProgram(id, ctx.state);
      const instances = [...allInstances].sort((a, b) =>
        (a.event_date ?? "").localeCompare(b.event_date ?? "")
      );
      const title = `${program.title} — Registrations`;
      return page({
        ...base,
        pageTitle: title,
        inner: { mode: "program", title, program, instances },
      });
    }

    return new Response("Not found", { status: 404 });
  },
});

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null, timezone: string): string {
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

function formatRegisteredAt(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ReminderTick({ sent }: { sent: string | null }) {
  if (sent) {
    return (
      <span class="text-green-600" title={sent}>
        ✓
      </span>
    );
  }
  return <span class="text-gray-300">–</span>;
}

function EventRegistrantsView({
  registrants,
}: {
  registrants: GroupEventRegistrant[];
}) {
  const active = registrants.filter((r) => r.status === "registered").length;
  const cancelled = registrants.filter((r) => r.status === "cancelled").length;

  return (
    <div
      class="rounded-2xl overflow-hidden bg-white border border-gray-200"
    >
      {/* Summary header */}
      <div
        class="px-5 py-4 flex flex-wrap items-center gap-3 border-b border-gray-100"
      >
        <span class="text-sm font-semibold text-near-black">
          {active} registration{active !== 1 ? "s" : ""}
        </span>
        {cancelled > 0 && (
          <span class="text-sm text-gray-400">
            · {cancelled} cancelled
          </span>
        )}
      </div>

      {registrants.length === 0
        ? (
          <div class="px-5 py-10 text-center text-sm text-gray-500">
            No registrations yet.
          </div>
        )
        : (
          <div class="overflow-x-auto">
            <table class="w-full text-sm min-w-[640px]">
              <thead>
                <tr class="border-b border-gray-100">
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Name
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Email
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Registered
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    1-day
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    1-hour
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                {registrants.map((r) => (
                  <tr
                    key={r.id}
                    class={r.status === "cancelled" ? "opacity-50" : ""}
                  >
                    <td
                      class={`px-4 py-3 font-medium whitespace-nowrap ${
                        r.status === "cancelled"
                          ? "line-through text-gray-400"
                          : "text-near-black"
                      }`}
                    >
                      {r.nameFirst} {r.nameLast}
                    </td>
                    <td class="px-4 py-3 text-gray-500 text-xs break-all">
                      {r.email}
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          r.status === "registered"
                            ? "bg-green-100 text-green-700"
                            : r.status === "cancelled"
                            ? "bg-red-100 text-red-600"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatRegisteredAt(r.registeredAt)}
                    </td>
                    <td class="px-4 py-3 text-center">
                      <ReminderTick sent={r.reminders.dayBefore} />
                    </td>
                    <td class="px-4 py-3 text-center">
                      <ReminderTick sent={r.reminders.hourBefore} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

function ProgramInstancesView({
  instances,
  groupSlug,
}: {
  instances: GroupEventListItem[];
  groupSlug: string;
}) {
  const totalRegistrations = instances.reduce(
    (sum, i) => sum + i.registration_count,
    0,
  );

  return (
    <div
      class="rounded-2xl overflow-hidden bg-white border border-gray-200"
    >
      <div
        class="px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100"
      >
        <span class="text-sm font-semibold text-near-black">
          {instances.length} instance{instances.length !== 1 ? "s" : ""}
        </span>
        <span class="text-sm text-gray-400">
          {totalRegistrations} total registration
          {totalRegistrations !== 1 ? "s" : ""}
        </span>
      </div>

      {instances.length === 0
        ? (
          <div class="px-5 py-10 text-center text-sm text-gray-500">
            No instances yet.
          </div>
        )
        : (
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Date
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                  Status
                </th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Registrations
                </th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              {instances.map((inst) => (
                <tr key={inst.id} class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-medium text-near-black whitespace-nowrap">
                    {inst.event_date
                      ? formatDate(inst.event_date, inst.timezone)
                      : "Date TBD"}
                  </td>
                  <td class="px-4 py-3 hidden sm:table-cell">
                    <span
                      class={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        inst.status === "published"
                          ? "bg-green-100 text-green-700"
                          : inst.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {inst.status.charAt(0).toUpperCase() +
                        inst.status.slice(1)}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right text-gray-700 font-medium">
                    {inst.registration_count}
                  </td>
                  <td class="px-4 py-3 text-right">
                    <a
                      href={`/groups/${groupSlug}/admin/events/${inst.id}/registrations`}
                      class="text-xs text-primary font-medium hover:underline whitespace-nowrap"
                    >
                      View →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
  );
}

// ── Page component ─────────────────────────────────────────────────────────

export default define.page<typeof handler>(function RegistrationsPage({ data }) {
  const { groupSlug, groupName, pageTitle, backId, inner } = data;

  return (
    <>
      <Head>
        <title>{pageTitle} — {groupName} — Future Together</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Back link */}
        <div class="mb-2">
          <a
            href={`/groups/${groupSlug}/admin/events/${backId}`}
            class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back
          </a>
        </div>

        {/* Page heading */}
        <h1 class="text-2xl sm:text-3xl font-bold text-near-black mb-8">
          {inner.title}
        </h1>

        {inner.mode === "event"
          ? <EventRegistrantsView registrants={inner.registrants} />
          : (
            <ProgramInstancesView
              instances={inner.instances}
              groupSlug={groupSlug}
            />
          )}
      </div>
    </>
  );
});
