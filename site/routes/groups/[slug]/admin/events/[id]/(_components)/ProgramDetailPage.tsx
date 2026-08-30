// Recurring program detail page — edit program settings + view/manage instances.
import { Head } from "fresh/runtime";
import GroupEventForm from "@/islands/GroupEventForm.tsx";
import type { GroupMember } from "@/utils/db/group-members.ts";
import { FlashBanner, StatusBadge, toDatetimeLocal } from "./shared.tsx";
import type { Flash, PageData } from "./shared.tsx";

type ProgramPageData = Extract<PageData, { mode: "program" }> & {
  groupName: string;
  groupSlug: string;
  members: GroupMember[];
  currentUserId: string;
  flash: Flash;
};

export default function ProgramDetailPage(
  { data }: { data: ProgramPageData },
) {
  const {
    program,
    groupName,
    groupSlug,
    members,
    currentUserId,
    flash,
    instances,
  } = data;
  const editAction = `/groups/${groupSlug}/admin/events/${program.id}`;
  const initialSeedDatetime = toDatetimeLocal(program.seed_datetime);

  return (
    <>
      <Head>
        <title>
          {program.title} — Recurring Series — {groupName} — Future Together
        </title>
        <meta name="robots" content="noindex" />
      </Head>
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div class="mb-2">
          <a
            f-client-nav={false}
            href={`/groups/${groupSlug}/admin/events`}
            class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Events
          </a>
        </div>
        <div class="flex flex-wrap items-center gap-3 mb-1">
          <h1 class="text-2xl font-bold text-near-black flex-1 min-w-0 truncate">
            {program.title || "(Untitled program)"}
          </h1>
          <StatusBadge status={program.status} />
        </div>
        <p class="text-sm text-gray-500 mb-8">
          Recurring series · {program.instance_count} instance
          {program.instance_count !== 1 ? "s" : ""} generated
        </p>

        <FlashBanner flash={flash} />

        <GroupEventForm
          mode="edit"
          action={editAction}
          groupId={program.group_id}
          groupSlug={groupSlug}
          currentUserId={currentUserId}
          members={members}
          initialTitle={program.title}
          initialDescription={program.description ?? ""}
          initialTimezone={program.seed_timezone ?? "Australia/Sydney"}
          initialDurationMinutes={program.duration_minutes}
          initialLocationType={program.location_type ?? "online"}
          initialLocationName={program.location_name ?? ""}
          initialLocationAddress={program.location_address ?? ""}
          initialMeetingLink={program.meeting_link ?? ""}
          initialCapacity={program.capacity}
          initialOrganiserId={program.organiser_id}
          initialVisibility={program.visibility}
          initialSlideshowUrl={program.slideshow_url ?? ""}
          initialResources={program.resources.map((r) => ({
            ...r,
            description: r.description ?? "",
          }))}
          initialEventType="recurring"
          initialRecurrenceRule={program.recurrence_rule}
          initialSeedDatetime={initialSeedDatetime}
          initialSlugSuffix={program.slug_suffix ?? ""}
        />

        {/* Actions panel */}
        <div
          class="mt-8 rounded-2xl p-6"
          style="background:white;border:1px solid #e5e7eb;"
        >
          <h2 class="text-base font-semibold text-near-black mb-4">Actions</h2>
          {program.status === "draft" && (
            <div>
              <form
                method="POST"
                action={`/groups/${groupSlug}/admin/events/${program.id}/publish`}
              >
                <button
                  type="submit"
                  class="px-5 py-2.5 text-white text-sm font-semibold bg-primary rounded-xl transition-opacity hover:opacity-90"
                >
                  Publish Program
                </button>
              </form>
              <p class="text-xs text-gray-400 mt-2">
                Publishing will generate the first batch of event instances
                (3-month lookahead) and notify opted-in group members.
              </p>
            </div>
          )}
          {program.status === "published" && (
            <p class="text-sm text-gray-500">
              This program is published. New instances are generated
              automatically on a weekly schedule. To stop new instances, archive
              the program from the main events list.
            </p>
          )}
          <div class="mt-4 pt-4 border-t border-gray-100">
            <form
              method="POST"
              action={`/groups/${groupSlug}/admin/events/${program.id}/generate-instances`}
              f-client-nav={false}
            >
              <button
                type="submit"
                class="inline-flex items-center gap-2 px-5 py-2.5 text-sm text-primary font-semibold rounded-xl border-2 border-primary transition-colors hover:bg-primary/5"
              >
                <span>↻</span> Generate instances now
              </button>
            </form>
            <p class="text-xs text-gray-400 mt-2">
              Generates any missing instances within the 3-month lookahead
              window.
            </p>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-100">
            <a
              f-client-nav={false}
              href={`/groups/${groupSlug}/admin/events/${program.id}/registrations`}
              class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-primary rounded-xl border-2 border-primary transition-colors hover:bg-primary/5"
            >
              View Registrations
            </a>
          </div>
        </div>

        {/* Generated instances */}
        <div
          class="mt-6 rounded-2xl p-6"
          style="background:white;border:1px solid #e5e7eb;"
        >
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold text-near-black">
              Scheduled Events
            </h2>
            <span class="text-sm text-gray-500">{instances.length} total</span>
          </div>
          {instances.length === 0
            ? (
              <p class="text-sm text-gray-500">
                No instances yet. Publish the program to generate the first
                batch.
              </p>
            )
            : (
              <div class="overflow-x-auto -mx-2">
                <table class="w-full text-sm min-w-[400px]">
                  <thead>
                    <tr class="text-left border-b border-gray-100">
                      <th class="px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Date
                      </th>
                      <th class="px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Slug
                      </th>
                      <th class="px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Status
                      </th>
                      <th class="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-50">
                    {instances.map((inst) => (
                      <tr key={inst.id}>
                        <td class="px-2 py-2.5 font-medium text-near-black">
                          {inst.event_date ? inst.event_date.slice(0, 10) : "—"}
                        </td>
                        <td class="px-2 py-2.5 text-gray-500 text-xs font-mono">
                          {inst.slug}
                        </td>
                        <td class="px-2 py-2.5">
                          <StatusBadge status={inst.status} />
                        </td>
                        <td class="px-2 py-2.5 text-right">
                          <a
                            f-client-nav={false}
                            href={`/groups/${groupSlug}/admin/events/${inst.id}/`}
                            class="text-xs text-primary font-medium hover:underline"
                          >
                            Edit →
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </div>
    </>
  );
}
