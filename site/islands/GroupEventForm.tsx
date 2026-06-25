import { useSignal } from "@preact/signals";
import type { GroupMember } from "@/utils/db/group-members.ts";
import { parseRRule } from "@/utils/recurrence.ts";

interface ResourceItem {
  label: string;
  url: string;
  type: "download" | "link";
  description: string;
}

interface GroupEventFormProps {
  mode: "create" | "edit";
  action: string;
  groupId: string;
  groupSlug: string;
  currentUserId: string;
  members: Array<
    Pick<
      GroupMember,
      "id" | "name_first" | "name_last" | "email" | "role" | "profile_id"
    >
  >;
  // Initial values (for edit mode)
  initialTitle?: string;
  initialDescription?: string;
  initialEventDate?: string;
  initialTimezone?: string;
  initialDurationMinutes?: number | null;
  initialLocationType?: string;
  initialLocationName?: string;
  initialLocationAddress?: string;
  initialMeetingLink?: string;
  initialCapacity?: number | null;
  initialIsRegistrationRequired?: boolean;
  initialOrganiserId?: string | null;
  initialVisibility?: string;
  initialSlideshowUrl?: string;
  initialResources?: ResourceItem[];
  // Recurring program props
  initialEventType?: "one-off" | "recurring" | "instance-of-program";
  initialRecurrenceRule?: string | null;
  initialSeedDatetime?: string | null;
  initialSlugSuffix?: string | null;
  // For instance-of-program: list of existing recurring programs
  programs?: Array<{ id: string; title: string }>;
}

const TIMEZONES = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Adelaide",
  "Pacific/Auckland",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Singapore",
  "Asia/Tokyo",
];

const WEEKDAYS = [
  { code: "MO", label: "Mon" },
  { code: "TU", label: "Tue" },
  { code: "WE", label: "Wed" },
  { code: "TH", label: "Thu" },
  { code: "FR", label: "Fri" },
  { code: "SA", label: "Sat" },
  { code: "SU", label: "Sun" },
] as const;

const ORDINALS = [
  { value: "1", label: "1st" },
  { value: "2", label: "2nd" },
  { value: "3", label: "3rd" },
  { value: "4", label: "4th" },
  { value: "-1", label: "Last" },
] as const;

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5f6e]/30 focus:border-primary";
const labelClass = "block text-sm font-medium text-near-black mb-1.5";
const sectionHeadingClass =
  "text-base font-semibold text-near-black mb-4 pb-2 border-b border-gray-100";

export default function GroupEventForm(props: GroupEventFormProps) {
  // ── Existing signals ──────────────────────────────────────────────────
  const locationType = useSignal<string>(
    props.initialLocationType ?? "online",
  );
  const isRegistrationRequired = useSignal<boolean>(
    props.initialIsRegistrationRequired !== false,
  );
  const timezone = useSignal<string>(
    props.initialTimezone ?? "Australia/Sydney",
  );
  const visibility = useSignal<string>(props.initialVisibility ?? "private");
  const resources = useSignal<ResourceItem[]>(
    props.initialResources?.map((r) => ({
      label: r.label ?? "",
      url: r.url ?? "",
      type: r.type ?? "link",
      description: r.description ?? "",
    })) ?? [],
  );

  // ── Parse initialRecurrenceRule to populate RRULE builder signals ────────
  const _parsedRRule: Record<string, string> | null =
    props.initialRecurrenceRule
      ? parseRRule(props.initialRecurrenceRule)
      : null;

  function _detectInitialPreset():
    | "weekly"
    | "fortnightly"
    | "monthly-weekday"
    | "custom" {
    if (!_parsedRRule) return "monthly-weekday";
    const freq = _parsedRRule["FREQ"] ?? "";
    const interval = _parsedRRule["INTERVAL"] ?? "1";
    const byday = _parsedRRule["BYDAY"] ?? "";
    if (
      freq === "WEEKLY" && interval === "1" && byday && !/^-?\d/.test(byday)
    ) return "weekly";
    if (freq === "WEEKLY" && interval === "2") return "fortnightly";
    if (freq === "MONTHLY" && /^-?\d+[A-Z]{2}$/.test(byday)) {
      return "monthly-weekday";
    }
    return "custom";
  }

  function _initRruleWeekdays(): string[] {
    if (!_parsedRRule) return ["TU"];
    const byday = _parsedRRule["BYDAY"] ?? "";
    if (!byday || /^-?\d/.test(byday)) return ["TU"];
    return byday.split(",").map((d) => d.trim()).filter(Boolean);
  }

  function _initRruleOrdinal(): string {
    if (!_parsedRRule) return "3";
    const m = (_parsedRRule["BYDAY"] ?? "").match(/^(-?\d+)[A-Z]{2}$/);
    return m ? m[1] : "3";
  }

  function _initRruleMonthlyWeekday(): string {
    if (!_parsedRRule) return "TU";
    const m = (_parsedRRule["BYDAY"] ?? "").match(/^-?\d+([A-Z]{2})$/);
    return m ? m[1] : "TU";
  }

  function _initRruleEndType(): "ongoing" | "count" | "until" {
    if (!_parsedRRule) return "ongoing";
    if (_parsedRRule["COUNT"]) return "count";
    if (_parsedRRule["UNTIL"]) return "until";
    return "ongoing";
  }

  function _initRruleUntil(): string {
    const u = _parsedRRule?.["UNTIL"] ?? "";
    if (!u || u.length < 8) return "";
    return `${u.slice(0, 4)}-${u.slice(4, 6)}-${u.slice(6, 8)}`;
  }

  // ── Recurring program signals ─────────────────────────────────────────
  const eventType = useSignal<"one-off" | "recurring" | "instance-of-program">(
    props.initialEventType ?? "one-off",
  );
  const rrulePreset = useSignal<
    "weekly" | "fortnightly" | "monthly-weekday" | "custom"
  >(_detectInitialPreset());
  const rruleWeekdays = useSignal<string[]>(_initRruleWeekdays());
  const rruleOrdinal = useSignal<string>(_initRruleOrdinal());
  const rruleInterval = useSignal<string>(_parsedRRule?.["INTERVAL"] ?? "");
  const rruleMonthlyWeekday = useSignal<string>(_initRruleMonthlyWeekday());
  const rruleEndType = useSignal<"ongoing" | "count" | "until">(
    _initRruleEndType(),
  );
  const rruleCount = useSignal<string>(_parsedRRule?.["COUNT"] ?? "");
  const rruleUntil = useSignal<string>(_initRruleUntil());
  const rruleCustom = useSignal<string>(props.initialRecurrenceRule ?? "");

  // ── Helpers ───────────────────────────────────────────────────────────
  function addResource() {
    resources.value = [
      ...resources.value,
      { label: "", url: "", type: "link", description: "" },
    ];
  }

  function removeResource(idx: number) {
    resources.value = resources.value.filter((_, i) => i !== idx);
  }

  function updateResource(
    idx: number,
    field: keyof ResourceItem,
    value: string,
  ) {
    resources.value = resources.value.map((r, i) =>
      i === idx ? { ...r, [field]: value } : r
    );
  }

  function toggleWeekday(code: string) {
    const current = rruleWeekdays.value;
    if (current.includes(code)) {
      rruleWeekdays.value = current.filter((d) => d !== code);
    } else {
      rruleWeekdays.value = [...current, code];
    }
  }

  /** Build iCal RRULE string from the current builder state. */
  function computeRRule(): string {
    if (rrulePreset.value === "custom") return rruleCustom.value.trim();
    const parts: string[] = [];
    if (rrulePreset.value === "weekly") {
      parts.push("FREQ=WEEKLY", "INTERVAL=1");
      if (rruleWeekdays.value.length > 0) {
        parts.push(`BYDAY=${rruleWeekdays.value.join(",")}`);
      }
    } else if (rrulePreset.value === "fortnightly") {
      parts.push("FREQ=WEEKLY", "INTERVAL=2");
      if (rruleWeekdays.value.length > 0) {
        parts.push(`BYDAY=${rruleWeekdays.value.join(",")}`);
      }
    } else if (rrulePreset.value === "monthly-weekday") {
      parts.push("FREQ=MONTHLY");
      if (rruleOrdinal.value && rruleMonthlyWeekday.value) {
        parts.push(`BYDAY=${rruleOrdinal.value}${rruleMonthlyWeekday.value}`);
      }
      if (rruleInterval.value) {
        parts.push(`INTERVAL=${rruleInterval.value}`);
      }
    }
    if (rruleEndType.value === "count" && rruleCount.value) {
      parts.push(`COUNT=${rruleCount.value}`);
    } else if (rruleEndType.value === "until" && rruleUntil.value) {
      parts.push(`UNTIL=${rruleUntil.value.replace(/-/g, "")}`);
    }
    return parts.join(";");
  }

  // ── Derived ───────────────────────────────────────────────────────────
  const showMeetingLink = locationType.value === "online" ||
    locationType.value === "hybrid";
  const showVenueFields = locationType.value === "physical" ||
    locationType.value === "hybrid";
  const currentRRule = eventType.value === "recurring" ? computeRRule() : "";
  const selectedProgramId = useSignal<string>(
    props.programs && props.programs.length > 0 ? props.programs[0].id : "",
  );

  return (
    <form
      method="POST"
      action={props.action}
      class="space-y-6"
      f-client-nav={false}
    >
      {/* Hidden: event type — always submitted */}
      <input type="hidden" name="event_type" value={eventType.value} />
      {/* Hidden: recurrence_rule — only meaningful for recurring */}
      {eventType.value === "recurring" && (
        <input type="hidden" name="recurrence_rule" value={currentRRule} />
      )}
      {/* Hidden: program_id — only meaningful for instance-of-program */}
      {eventType.value === "instance-of-program" && (
        <input
          type="hidden"
          name="program_id"
          value={selectedProgramId.value}
        />
      )}

      {/* ── Event Type Toggle ───────────────────────────────────────── */}
      <div
        class="rounded-2xl p-6"
        style="background:white;border:1px solid #e5e7eb;"
      >
        <h2 class={sectionHeadingClass}>Event Type</h2>
        <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
          {([
            {
              value: "one-off" as const,
              label: "One-off event",
              desc: "A single event on a specific date",
            },
            {
              value: "recurring" as const,
              label: "Recurring series",
              desc: "Repeating schedule — instances generated automatically",
            },
            ...(props.programs && props.programs.length > 0
              ? [{
                value: "instance-of-program" as const,
                label: "Instance of existing program",
                desc: "Add a specific date to a recurring program",
              }]
              : []),
          ] as Array<
            {
              value: "one-off" | "recurring" | "instance-of-program";
              label: string;
              desc: string;
            }
          >).map((et) => (
            <label
              key={et.value}
              class={`flex-1 flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-colors ${
                eventType.value === et.value
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="event_type_toggle"
                value={et.value}
                checked={eventType.value === et.value}
                onChange={() => {
                  eventType.value = et.value;
                }}
                class="mt-0.5 text-primary"
              />
              <div>
                <p class="text-sm font-semibold text-near-black">
                  {et.label}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">{et.desc}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Program selector — shown when instance-of-program selected */}
        {eventType.value === "instance-of-program" && props.programs &&
          props.programs.length > 0 && (
          <div class="mt-4">
            <label class={labelClass} for="program_select">
              Select program
            </label>
            <select
              id="program_select"
              class={inputClass}
              value={selectedProgramId.value}
              onChange={(e) => {
                selectedProgramId.value = (e.target as HTMLSelectElement).value;
              }}
            >
              {props.programs.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Section 1: Event / Program Details ──────────────────────── */}
      <div
        class="rounded-2xl p-6"
        style="background:white;border:1px solid #e5e7eb;"
      >
        <h2 class={sectionHeadingClass}>
          {eventType.value === "recurring"
            ? "Program Details"
            : "Event Details"}
        </h2>
        <div class="space-y-4">
          <div>
            <label class={labelClass} for="title">
              Title <span class="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={props.initialTitle ?? ""}
              class={inputClass}
              placeholder="e.g. AI and the Future of Work — a local conversation"
            />
          </div>
          <div>
            <label class={labelClass} for="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={8}
              class={inputClass + " resize-y"}
              placeholder="Describe what this event is about..."
              defaultValue={props.initialDescription ?? ""}
            />
            <p class="text-xs text-gray-400 mt-1">Markdown supported</p>
          </div>
          {/* Slug suffix — only relevant for recurring programs */}
          {eventType.value === "recurring" && (
            <div>
              <label class={labelClass} for="slug_suffix">
                Slug suffix{" "}
                <span class="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="slug_suffix"
                name="slug_suffix"
                type="text"
                defaultValue={props.initialSlugSuffix ?? ""}
                class={inputClass}
                placeholder="e.g. morning, pm — appended to generated event slugs"
              />
              <p class="text-xs text-gray-400 mt-1">
                Use when running multiple sequences with the same program name
                (e.g. <code>discuss-our-future-morning-2026-07-15</code>).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 2: Date, Time & Duration — one-off + instance-of-program ── */}
      {(eventType.value === "one-off" ||
        eventType.value === "instance-of-program") && (
        <div
          class="rounded-2xl p-6"
          style="background:white;border:1px solid #e5e7eb;"
        >
          <h2 class={sectionHeadingClass}>Date, Time &amp; Duration</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class={labelClass} for="event_date">
                Date &amp; Time <span class="text-red-500">*</span>
              </label>
              <input
                id="event_date"
                name="event_date"
                type="datetime-local"
                required
                defaultValue={props.initialEventDate ?? ""}
                class={inputClass}
              />
            </div>
            <div>
              <label class={labelClass} for="timezone">Timezone</label>
              <select
                id="timezone"
                name="timezone"
                value={timezone.value}
                onChange={(e) => {
                  timezone.value = (e.target as HTMLSelectElement).value;
                }}
                class={inputClass}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label class={labelClass} for="duration_minutes">
                Duration (minutes)
              </label>
              <input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                defaultValue={props.initialDurationMinutes ?? ""}
                class={inputClass}
                placeholder="60"
                min="1"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Recurrence Pattern — recurring only ─────────────────────── */}
      {eventType.value === "recurring" && (
        <div
          class="rounded-2xl p-6"
          style="background:white;border:1px solid #e5e7eb;"
        >
          <h2 class={sectionHeadingClass}>Recurrence Pattern</h2>
          <div class="space-y-5">
            {/* Seed date/time + timezone + duration */}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class={labelClass} for="seed_datetime">
                  First occurrence <span class="text-red-500">*</span>
                </label>
                <input
                  id="seed_datetime"
                  name="seed_datetime"
                  type="datetime-local"
                  required
                  defaultValue={props.initialSeedDatetime ?? ""}
                  class={inputClass}
                />
                <p class="text-xs text-gray-400 mt-1">
                  Anchor date/time for the RRULE. Subsequent occurrences are
                  calculated from this.
                </p>
              </div>
              <div>
                <label class={labelClass} for="timezone_recurring">
                  Timezone
                </label>
                <select
                  id="timezone_recurring"
                  name="timezone"
                  value={timezone.value}
                  onChange={(e) => {
                    timezone.value = (e.target as HTMLSelectElement).value;
                  }}
                  class={inputClass}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label class={labelClass} for="duration_minutes_r">
                  Duration (minutes)
                </label>
                <input
                  id="duration_minutes_r"
                  name="duration_minutes"
                  type="number"
                  defaultValue={props.initialDurationMinutes ?? ""}
                  class={inputClass}
                  placeholder="60"
                  min="1"
                />
              </div>
            </div>

            {/* Frequency preset */}
            <div>
              <label class={labelClass}>Frequency</label>
              <div class="flex flex-wrap gap-2">
                {[
                  { value: "weekly" as const, label: "Weekly" },
                  { value: "fortnightly" as const, label: "Fortnightly" },
                  {
                    value: "monthly-weekday" as const,
                    label: "Monthly (weekday)",
                  },
                  { value: "custom" as const, label: "Custom RRULE" },
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => {
                      rrulePreset.value = p.value;
                    }}
                    class={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      rrulePreset.value === p.value
                        ? "border-primary bg-primary text-white"
                        : "border-gray-300 text-gray-700 hover:border-primary"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly / Fortnightly — day picker */}
            {(rrulePreset.value === "weekly" ||
              rrulePreset.value === "fortnightly") && (
              <div>
                <label class={labelClass}>Day(s) of week</label>
                <div class="flex flex-wrap gap-2">
                  {WEEKDAYS.map((wd) => (
                    <button
                      key={wd.code}
                      type="button"
                      onClick={() => toggleWeekday(wd.code)}
                      class={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        rruleWeekdays.value.includes(wd.code)
                          ? "border-primary bg-primary text-white"
                          : "border-gray-300 text-gray-700 hover:border-primary"
                      }`}
                    >
                      {wd.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly weekday — ordinal + day */}
            {rrulePreset.value === "monthly-weekday" && (
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class={labelClass} for="rrule_ordinal">Week</label>
                  <select
                    id="rrule_ordinal"
                    value={rruleOrdinal.value}
                    onChange={(e) => {
                      rruleOrdinal.value =
                        (e.target as HTMLSelectElement).value;
                    }}
                    class={inputClass}
                  >
                    {ORDINALS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label class={labelClass} for="rrule_weekday">Weekday</label>
                  <select
                    id="rrule_weekday"
                    value={rruleMonthlyWeekday.value}
                    onChange={(e) => {
                      rruleMonthlyWeekday.value =
                        (e.target as HTMLSelectElement).value;
                    }}
                    class={inputClass}
                  >
                    {WEEKDAYS.map((wd) => (
                      <option key={wd.code} value={wd.code}>
                        {wd.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label class={labelClass} for="rrule_ordinal">
                    Every (interval)
                  </label>
                  <input
                    id="rrule_interval"
                    type="number"
                    value={rruleInterval.value}
                    onChange={(e) => {
                      rruleInterval.value =
                        (e.target as HTMLSelectElement).value;
                    }}
                    class={inputClass}
                    placeholder="1"
                    min="1"
                  />
                </div>
              </div>
            )}

            {/* Custom RRULE text input */}
            {rrulePreset.value === "custom" && (
              <div>
                <label class={labelClass} for="rrule_custom">
                  iCal RRULE string
                </label>
                <input
                  id="rrule_custom"
                  type="text"
                  value={rruleCustom.value}
                  onInput={(e) => {
                    rruleCustom.value = (e.target as HTMLInputElement).value;
                  }}
                  class={inputClass + " font-mono text-xs"}
                  placeholder="FREQ=MONTHLY;BYDAY=3TU"
                />
                <p class="text-xs text-gray-400 mt-1">
                  Supported: <code>FREQ=WEEKLY|MONTHLY</code>,{" "}
                  <code>INTERVAL</code>, <code>BYDAY</code> (e.g.{" "}
                  <code>3TU</code>, <code>-1MO</code>), <code>COUNT</code>,{" "}
                  <code>UNTIL</code>.
                </p>
              </div>
            )}

            {/* End condition */}
            {rrulePreset.value !== "custom" && (
              <div>
                <label class={labelClass}>End condition</label>
                <div class="flex flex-wrap gap-4 mb-3">
                  {[
                    { value: "ongoing" as const, label: "Ongoing" },
                    {
                      value: "count" as const,
                      label: "After N occurrences",
                    },
                    { value: "until" as const, label: "Until date" },
                  ].map((et) => (
                    <label
                      key={et.value}
                      class="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="rrule_end_type"
                        value={et.value}
                        checked={rruleEndType.value === et.value}
                        onChange={() => {
                          rruleEndType.value = et.value;
                        }}
                        class="text-primary"
                      />
                      <span class="text-sm">{et.label}</span>
                    </label>
                  ))}
                </div>
                {rruleEndType.value === "count" && (
                  <input
                    type="number"
                    value={rruleCount.value}
                    onInput={(e) => {
                      rruleCount.value = (e.target as HTMLInputElement).value;
                    }}
                    class={inputClass + " w-32"}
                    placeholder="12"
                    min="1"
                  />
                )}
                {rruleEndType.value === "until" && (
                  <input
                    type="date"
                    value={rruleUntil.value}
                    onInput={(e) => {
                      rruleUntil.value = (e.target as HTMLInputElement).value;
                    }}
                    class={inputClass + " w-48"}
                  />
                )}
              </div>
            )}

            {/* RRULE preview */}
            {currentRRule && (
              <div class="bg-gray-50 rounded-lg px-4 py-3">
                <p class="text-xs font-medium text-gray-500 mb-1">RRULE</p>
                <code class="text-xs text-primary break-all">
                  {currentRRule}
                </code>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Section 3: Location ─────────────────────────────────────── */}
      <div
        class="rounded-2xl p-6"
        style="background:white;border:1px solid #e5e7eb;"
      >
        <h2 class={sectionHeadingClass}>Location</h2>
        <div class="space-y-4">
          <div>
            <label class={labelClass}>Location Type</label>
            <div class="flex flex-wrap gap-4">
              {([
                { value: "online", label: "Online" },
                { value: "physical", label: "In Person" },
                { value: "hybrid", label: "Hybrid" },
              ] as const).map((lt) => (
                <label
                  key={lt.value}
                  class="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="location_type"
                    value={lt.value}
                    checked={locationType.value === lt.value}
                    onChange={() => {
                      locationType.value = lt.value;
                    }}
                    class="text-primary"
                  />
                  <span class="text-sm">{lt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {showMeetingLink && (
            <div>
              <label class={labelClass} for="meeting_link">
                Meeting Link
              </label>
              <input
                id="meeting_link"
                name="meeting_link"
                type="url"
                defaultValue={props.initialMeetingLink ?? ""}
                class={inputClass}
                placeholder="https://meet.jit.si/..."
              />
            </div>
          )}

          {showVenueFields && (
            <>
              <div>
                <label class={labelClass} for="location_name">
                  Venue Name
                </label>
                <input
                  id="location_name"
                  name="location_name"
                  type="text"
                  defaultValue={props.initialLocationName ?? ""}
                  class={inputClass}
                  placeholder="e.g. Tumbarumba Library"
                />
              </div>
              <div>
                <label class={labelClass} for="location_address">
                  Address
                </label>
                <input
                  id="location_address"
                  name="location_address"
                  type="text"
                  defaultValue={props.initialLocationAddress ?? ""}
                  class={inputClass}
                  placeholder="123 Main St, Tumbarumba NSW 2653"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Section 4: Registration ─────────────────────────────────── */}
      <div
        class="rounded-2xl p-6"
        style="background:white;border:1px solid #e5e7eb;"
      >
        <h2 class={sectionHeadingClass}>Registration</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class={labelClass} for="capacity">Capacity</label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              defaultValue={props.initialCapacity ?? ""}
              class={inputClass}
              placeholder="30"
              min="1"
            />
          </div>
          <div class="flex items-center gap-3 pt-6">
            <input
              id="is_registration_required"
              name="is_registration_required"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300"
              checked={isRegistrationRequired.value}
              onChange={() => {
                isRegistrationRequired.value = !isRegistrationRequired.value;
              }}
            />
            <label
              for="is_registration_required"
              class="text-sm text-near-black cursor-pointer"
            >
              Registration required
            </label>
          </div>
        </div>
      </div>

      {/* ── Section 5: Organiser ────────────────────────────────────── */}
      <div
        class="rounded-2xl p-6"
        style="background:white;border:1px solid #e5e7eb;"
      >
        <h2 class={sectionHeadingClass}>Organiser</h2>
        <div>
          <label class={labelClass} for="organiser_id">Organiser</label>
          <select id="organiser_id" name="organiser_id" class={inputClass}>
            <option value="">— No specific organiser —</option>
            {props.members.map((m) => {
              const name = [m.name_first, m.name_last]
                .filter(Boolean)
                .join(" ");
              const label = name ? `${name} (${m.email})` : m.email;
              const selectedId = props.initialOrganiserId ??
                props.currentUserId;
              const isSelected = m.profile_id === selectedId;
              return (
                <option key={m.id} value={m.profile_id} selected={isSelected}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* ── Section 6: Visibility ────────────────────────────────────── */}
      <div
        class="rounded-2xl p-6"
        style="background:white;border:1px solid #e5e7eb;"
      >
        <h2 class={sectionHeadingClass}>Visibility</h2>
        <div class="space-y-2">
          {([
            {
              value: "private",
              label: "Group members only",
              desc: "Only visible to members",
            },
            {
              value: "public",
              label: "Public",
              desc: "Visible on the group page",
            },
            {
              value: "featured",
              label: "Featured",
              desc: "Appears on the /meetups page alongside global events",
            },
          ] as const).map((v) => (
            <label
              key={v.value}
              class="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50"
            >
              <input
                type="radio"
                name="visibility"
                value={v.value}
                checked={visibility.value === v.value}
                onChange={() => {
                  visibility.value = v.value;
                }}
                class="mt-0.5 text-primary"
              />
              <div>
                <p class="text-sm font-medium text-near-black">{v.label}</p>
                <p class="text-xs text-gray-500">{v.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ── Section 7: Additional Details ───────────────────────────── */}
      <div
        class="rounded-2xl p-6"
        style="background:white;border:1px solid #e5e7eb;"
      >
        <h2 class={sectionHeadingClass}>Additional Details</h2>
        <div>
          <label class={labelClass} for="slideshow_url">
            Slideshow URL
          </label>
          <input
            id="slideshow_url"
            name="slideshow_url"
            type="url"
            defaultValue={props.initialSlideshowUrl ?? ""}
            class={inputClass}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* ── Section 8: Resources ────────────────────────────────────── */}
      <div
        class="rounded-2xl p-6"
        style="background:white;border:1px solid #e5e7eb;"
      >
        <h2 class={sectionHeadingClass}>Resources</h2>

        {/* Serialise resources as JSON in hidden input */}
        <input
          type="hidden"
          name="resources"
          value={JSON.stringify(resources.value)}
        />

        <div class="space-y-4">
          {resources.value.map((res, idx) => (
            <div
              key={idx}
              class="border border-gray-100 rounded-xl p-4 relative"
            >
              <button
                type="button"
                onClick={() => removeResource(idx)}
                class="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors text-sm leading-none"
                aria-label="Remove resource"
              >
                ✕
              </button>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                <div>
                  <label class={labelClass}>Label</label>
                  <input
                    type="text"
                    value={res.label}
                    onInput={(e) =>
                      updateResource(
                        idx,
                        "label",
                        (e.target as HTMLInputElement).value,
                      )}
                    class={inputClass}
                    placeholder="e.g. Slide deck"
                  />
                </div>
                <div>
                  <label class={labelClass}>URL</label>
                  <input
                    type="url"
                    value={res.url}
                    onInput={(e) =>
                      updateResource(
                        idx,
                        "url",
                        (e.target as HTMLInputElement).value,
                      )}
                    class={inputClass}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label class={labelClass}>Type</label>
                  <select
                    value={res.type}
                    onChange={(e) =>
                      updateResource(
                        idx,
                        "type",
                        (e.target as HTMLSelectElement).value,
                      )}
                    class={inputClass}
                  >
                    <option value="link">Link</option>
                    <option value="download">Download</option>
                  </select>
                </div>
                <div>
                  <label class={labelClass}>Description (optional)</label>
                  <input
                    type="text"
                    value={res.description}
                    onInput={(e) =>
                      updateResource(
                        idx,
                        "description",
                        (e.target as HTMLInputElement).value,
                      )}
                    class={inputClass}
                    placeholder="Brief description"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addResource}
          class="mt-4 text-sm font-medium hover:underline"
          style="color:#1a5f6e;"
        >
          + Add resource
        </button>
      </div>

      {/* ── Submit ──────────────────────────────────────────────────── */}
      <div class="flex justify-end">
        <button
          type="submit"
          class="px-6 py-3 text-white font-semibold rounded-xl transition-opacity hover:opacity-90"
          style="background:#c4853a;"
        >
          {props.mode === "edit"
            ? "Save Changes"
            : eventType.value === "recurring"
            ? "Save Program"
            : eventType.value === "instance-of-program"
            ? "Add Instance"
            : "Save Event"}
        </button>
      </div>
    </form>
  );
}
