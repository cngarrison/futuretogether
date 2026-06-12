// Recurring-instance override form (program_id is NOT NULL — ft-07i.27).
import { Head } from "fresh/runtime";
import ResourcesEditor from "@/islands/ResourcesEditor.tsx";
import type { GroupMember } from "@/utils/db/group-members.ts";
import {
  EventActionsPanel,
  FlashBanner,
  StatusBadge,
  toDatetimeLocal,
} from "./shared.tsx";
import type { Flash, PageData } from "./shared.tsx";

type EventPageData = Extract<PageData, { mode: "event" }> & {
  groupName: string;
  groupSlug: string;
  members: GroupMember[];
  currentUserId: string;
  flash: Flash;
};

export default function EventInstancePage(
  { data }: { data: EventPageData },
) {
  const {
    event,
    eventWithDefaults,
    groupName,
    groupSlug,
    members,
    flash,
  } = data;
  const editAction = `/groups/${groupSlug}/admin/events/${event.id}`;
  const labelClass = "block text-sm font-semibold text-near-black mb-1.5";
  const inputClass =
    "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5f6e]/20 focus:border-[#1a5f6e] transition-colors bg-white";

  return (
    <>
      <Head>
        <title>
          {event.title} — Edit Instance — {groupName} — Future Together
        </title>
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
        <div class="flex flex-wrap items-center gap-3 mb-2">
          <h1 class="text-2xl font-bold text-near-black flex-1 min-w-0 truncate">
            {event.title || "(Untitled instance)"}
          </h1>
          <StatusBadge status={event.status} />
        </div>
        <p class="text-sm text-gray-500 mb-8">
          {event.event_date ? event.event_date.slice(0, 10) : "Date TBC"}
        </p>

        <FlashBanner flash={flash} />

        {/* Banner: link to program */}
        <div
          class="mb-6 px-4 py-3 rounded-xl text-sm"
          style="background:#eef5f7;color:#1a5f6e;border:1px solid #c8dde2;"
        >
          ↳ This event is an instance of the{" "}
          <a
            href={`/groups/${groupSlug}/admin/events/${
              eventWithDefaults?.program.id ?? event.program_id
            }/`}
            class="font-semibold underline hover:no-underline"
          >
            {eventWithDefaults?.program.title ?? "recurring program"}
          </a>
          . Fields left blank below inherit from the program.
        </div>

        {/* Override fields form */}
        <form method="POST" action={editAction} f-client-nav="false">
          <div
            class="rounded-2xl p-6 mb-6"
            style="background:white;border:1px solid #e5e7eb;"
          >
            <h2 class="text-base font-semibold text-near-black mb-5">
              Override Fields
            </h2>
            <p class="text-sm text-gray-500 mb-5">
              Leave a field empty to inherit the value from the program. Saving
              a blank field clears any existing override.
            </p>
            <div class="space-y-5">
              <div>
                <label class={labelClass} for="inst_loc_type">
                  Location type
                </label>
                <select
                  id="inst_loc_type"
                  name="location_type"
                  class={inputClass}
                >
                  <option value="">
                    Inherit from program
                    ({eventWithDefaults?.program.location_type ?? "none"})
                  </option>
                  <option
                    value="online"
                    selected={eventWithDefaults?.location_type === "online"}
                  >
                    Online
                  </option>
                  <option
                    value="physical"
                    selected={eventWithDefaults?.location_type === "physical"}
                  >
                    In person
                  </option>
                  <option
                    value="hybrid"
                    selected={eventWithDefaults?.location_type === "hybrid"}
                  >
                    Hybrid
                  </option>
                </select>
              </div>
              <div>
                <label class={labelClass} for="inst_loc_name">
                  Location name
                </label>
                <input
                  id="inst_loc_name"
                  name="location_name"
                  type="text"
                  class={inputClass}
                  value={eventWithDefaults?.location_name ?? ""}
                  placeholder={eventWithDefaults?.program.location_name
                    ? `Inherits: ${eventWithDefaults.program.location_name}`
                    : ""}
                />
              </div>
              <div>
                <label class={labelClass} for="inst_loc_addr">
                  Location address
                </label>
                <input
                  id="inst_loc_addr"
                  name="location_address"
                  type="text"
                  class={inputClass}
                  value={eventWithDefaults?.location_address ?? ""}
                  placeholder={eventWithDefaults?.program.location_address
                    ? `Inherits: ${eventWithDefaults.program.location_address}`
                    : ""}
                />
              </div>
              <div>
                <label class={labelClass} for="inst_mtg_link">
                  Meeting link
                </label>
                <input
                  id="inst_mtg_link"
                  name="meeting_link"
                  type="url"
                  class={inputClass}
                  value={eventWithDefaults?.meeting_link ?? ""}
                  placeholder={eventWithDefaults?.program.meeting_link
                    ? `Inherits: ${eventWithDefaults.program.meeting_link}`
                    : ""}
                />
              </div>
              <div>
                <label class={labelClass} for="inst_dur">
                  Duration (minutes)
                </label>
                <input
                  id="inst_dur"
                  name="duration_minutes"
                  type="number"
                  min="1"
                  class={inputClass}
                  value={eventWithDefaults?.duration_minutes?.toString() ?? ""}
                  placeholder={eventWithDefaults?.program.duration_minutes
                    ? `Inherits: ${eventWithDefaults.program.duration_minutes}`
                    : ""}
                />
              </div>
              <div>
                <label class={labelClass} for="inst_capacity">Capacity</label>
                <input
                  id="inst_capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  class={inputClass}
                  value={eventWithDefaults?.capacity?.toString() ?? ""}
                  placeholder={eventWithDefaults?.program.capacity
                    ? `Inherits: ${eventWithDefaults.program.capacity}`
                    : "Unlimited"}
                />
              </div>
              <div>
                <label class={labelClass} for="inst_organiser">
                  Organiser
                </label>
                <select
                  id="inst_organiser"
                  name="organiser_id"
                  class={inputClass}
                >
                  <option value="">Inherit from program</option>
                  {members.map((m: GroupMember) => (
                    <option
                      key={m.profile_id}
                      value={m.profile_id}
                      selected={eventWithDefaults?.organiser_id ===
                        m.profile_id}
                    >
                      {m.name_first} {m.name_last}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div
            class="rounded-2xl p-6 mb-6"
            style="background:white;border:1px solid #e5e7eb;"
          >
            <h2 class="text-base font-semibold text-near-black mb-5">
              Resources
            </h2>
            <p class="text-sm text-gray-500 mb-5">
              Add resources for this specific instance. Leave empty to use the
              program's resources.
            </p>
            <ResourcesEditor
              initialResources={eventWithDefaults?.resources ?? event.resources}
            />
          </div>

          {/* Event date / timezone / visibility */}
          <div
            class="rounded-2xl p-6 mb-6"
            style="background:white;border:1px solid #e5e7eb;"
          >
            <h2 class="text-base font-semibold text-near-black mb-5">
              Date &amp; Visibility
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label class={labelClass} for="inst_event_date">
                  Event date &amp; time
                </label>
                <input
                  id="inst_event_date"
                  name="event_date"
                  type="datetime-local"
                  class={inputClass}
                  value={toDatetimeLocal(
                    eventWithDefaults?.event_date ?? event.event_date,
                  )}
                />
              </div>
              <div>
                <label class={labelClass} for="inst_tz">Timezone</label>
                <input
                  id="inst_tz"
                  name="timezone"
                  type="text"
                  class={inputClass}
                  value={eventWithDefaults?.timezone ?? event.timezone ?? ""}
                />
              </div>
              <div>
                <label class={labelClass} for="inst_vis">Visibility</label>
                <select id="inst_vis" name="visibility" class={inputClass}>
                  <option
                    value="private"
                    selected={(eventWithDefaults?.visibility ??
                      event.visibility) === "private"}
                  >
                    Private
                  </option>
                  <option
                    value="members"
                    selected={(eventWithDefaults?.visibility ??
                      event.visibility) === "members"}
                  >
                    Members
                  </option>
                  <option
                    value="public"
                    selected={(eventWithDefaults?.visibility ??
                      event.visibility) === "public"}
                  >
                    Public
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <button
              type="submit"
              class="px-6 py-2.5 text-white text-sm font-semibold rounded-xl transition-opacity hover:opacity-90"
              style="background:#1a5f6e;"
            >
              Save Overrides
            </button>
          </div>
        </form>

        <EventActionsPanel
          groupSlug={groupSlug}
          eventId={event.id}
          status={event.status}
          label="Instance"
          showNotes={false}
        />
      </div>
    </>
  );
}
