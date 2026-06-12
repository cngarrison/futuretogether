// One-off event page — combined editor for a one-off group_program + its linked group_event.
import { Head } from "fresh/runtime";
import GroupEventForm from "@/islands/GroupEventForm.tsx";
import type { GroupMember } from "@/utils/db/group-members.ts";
import {
  EventActionsPanel,
  FlashBanner,
  PosterPanel,
  RegistrantsPanel,
  StatusBadge,
  toDatetimeLocal,
} from "./shared.tsx";
import type { Flash, PageData } from "./shared.tsx";

type OneOffPageData = Extract<PageData, { mode: "one-off" }> & {
  groupName: string;
  groupSlug: string;
  members: GroupMember[];
  currentUserId: string;
  flash: Flash;
};

export default function OneOffEventPage(
  { data }: { data: OneOffPageData },
) {
  const {
    program,
    event,
    groupName,
    groupSlug,
    members,
    currentUserId,
    flash,
    registrants,
  } = data;
  // Form POSTs to the program URL; handler updates both program and event rows.
  const editAction = `/groups/${groupSlug}/admin/events/${program.id}`;
  const initialEventDate = toDatetimeLocal(event.event_date);

  return (
    <>
      <Head>
        <title>{program.title} — Edit — {groupName} — Future Together</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div class="mb-2">
          <a
            href={`/groups/${groupSlug}/admin/events`}
            class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Events
          </a>
        </div>
        <div class="flex flex-wrap items-center gap-3 mb-8">
          <h1 class="text-2xl font-bold text-near-black flex-1 min-w-0 truncate">
            {program.title || "(Untitled event)"}
          </h1>
          <StatusBadge status={program.status} />
        </div>

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
          initialEventDate={initialEventDate}
          initialTimezone={event.timezone}
          initialDurationMinutes={event.duration_minutes ??
            program.duration_minutes}
          initialLocationType={event.location_type ?? program.location_type ??
            "online"}
          initialLocationName={event.location_name ?? program.location_name ??
            ""}
          initialLocationAddress={event.location_address ??
            program.location_address ?? ""}
          initialMeetingLink={event.meeting_link ?? program.meeting_link ?? ""}
          initialCapacity={event.capacity ?? program.capacity}
          initialIsRegistrationRequired={event.is_registration_required}
          initialOrganiserId={event.organiser_id ?? program.organiser_id}
          initialVisibility={program.visibility}
          initialSlideshowUrl={program.slideshow_url ?? ""}
          initialResources={program.resources.map((r) => ({
            ...r,
            description: r.description ?? "",
          }))}
          initialEventType="one-off"
        />

        <EventActionsPanel
          groupSlug={groupSlug}
          eventId={event.id}
          status={event.status}
        />

        <RegistrantsPanel
          eventStatus={event.status}
          registrants={registrants}
        />

        <PosterPanel
          groupSlug={groupSlug}
          eventId={event.id}
          posterUrl={event.poster_url}
        />
      </div>
    </>
  );
}
