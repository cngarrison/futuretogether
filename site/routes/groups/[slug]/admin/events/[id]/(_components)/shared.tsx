// Shared types, helpers, and micro-components for the [id] event/program admin pages.
import type {
  GroupEventDetail,
  GroupEventListItem,
} from "@/utils/db/group-events.ts";
import type {
  GroupEventWithProgramDefaults,
} from "@/utils/db/group-programs.ts";
import type { GroupEventRegistrant } from "@/utils/db/group-registrations.ts";
import type { GroupProgramDetail } from "@/utils/db/group-programs.ts";
import type { GroupMember } from "@/utils/db/group-members.ts";

// ── Types ─────────────────────────────────────────────────────────────────────────────

export type FlashType =
  | "saved"
  | "published"
  | "cancelled"
  | "error"
  | "generated";
export type Flash = { type: FlashType; message?: string } | null;

export type PageMode =
  | {
    mode: "event";
    event: GroupEventDetail;
    eventWithDefaults: GroupEventWithProgramDefaults | null;
    registrants: GroupEventRegistrant[];
  }
  | {
    mode: "program";
    program: GroupProgramDetail;
    instances: GroupEventListItem[];
  }
  | {
    mode: "one-off";
    program: GroupProgramDetail;
    event: GroupEventDetail;
    registrants: GroupEventRegistrant[];
  };

export type PageData = PageMode & {
  groupName: string;
  groupSlug: string;
  members: GroupMember[];
  currentUserId: string;
  flash: Flash;
};

// ── Helpers ───────────────────────────────────────────────────────────────────────────

/**
 * Convert a stored naive local datetime string to "YYYY-MM-DDTHH:mm" for
 * <input type="datetime-local">. No timezone conversion needed (ft-07i.15).
 */
export function toDatetimeLocal(localDt: string | null): string {
  if (!localDt) return "";
  // Supabase returns `timestamp` as "YYYY-MM-DD HH:MM:SS" (space separator);
  // datetime-local inputs require "YYYY-MM-DDTHH:MM" (T separator).
  return localDt.replace(" ", "T").slice(0, 16);
}

// ── Shared micro-components ───────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    published: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-[#eef5f7] text-primary",
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

export function FlashBanner({ flash }: { flash: Flash }) {
  if (!flash) return null;
  if (flash.type === "saved") {
    return (
      <div class="mb-6 px-4 py-3 rounded-lg bg-green-50 text-green-700 text-sm">
        ✓ Changes saved.
      </div>
    );
  }
  if (flash.type === "published") {
    return (
      <div
        class="mb-6 px-4 py-3 rounded-lg text-sm"
        style="background:#fffbf0;color:#92400e;"
      >
        ✓ Published. Members will be notified.
      </div>
    );
  }
  if (flash.type === "cancelled") {
    return (
      <div class="mb-6 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">
        Event cancelled. Registered attendees have been notified.
      </div>
    );
  }
  if (flash.type === "error") {
    return (
      <div class="mb-6 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">
        Error: {flash.message}
      </div>
    );
  }
  if (flash.type === "generated") {
    return (
      <div class="mb-6 px-4 py-3 rounded-lg bg-green-50 text-green-700 text-sm">
        ✓ Instances generated successfully.
      </div>
    );
  }
  return null;
}

// ── Shared panel components ───────────────────────────────────────────────────────────

/**
 * Publish / cancel actions panel for events and recurring instances.
 * Set label="Instance" and showNotes={false} for the recurring-instance variant.
 */
export function EventActionsPanel({
  groupSlug,
  eventId,
  status,
  label = "Event",
  showNotes = true,
}: {
  groupSlug: string;
  eventId: string;
  status: string;
  label?: string;
  showNotes?: boolean;
}) {
  return (
    <div
      class="mt-8 rounded-2xl p-6"
      style="background:white;border:1px solid #e5e7eb;"
    >
      <h2 class="text-base font-semibold text-near-black mb-4">Actions</h2>
      {(status === "draft" || status === "cancelled") && (
        <div class={showNotes ? "mb-4" : ""}>
          <form
            method="POST"
            action={`/groups/${groupSlug}/admin/events/${eventId}/publish`}
            f-client-nav="false"
          >
            <button
              type="submit"
              class="px-5 py-2.5 text-white text-sm font-semibold bg-primary rounded-xl transition-opacity hover:opacity-90"
            >
              Publish {label}
            </button>
          </form>
          {showNotes && (
            <p class="text-xs text-gray-400 mt-2">
              Publishing will notify opted-in group members.
            </p>
          )}
        </div>
      )}
      {status === "published" && (
        <div class={showNotes ? "" : "mt-3"}>
          {showNotes && (
            <p class="text-sm text-red-600 mb-2">
              Cancelling will notify all registered attendees.
            </p>
          )}
          <form
            method="POST"
            action={`/groups/${groupSlug}/admin/events/${eventId}/cancel`}
            f-client-nav="false"
          >
            <button
              type="submit"
              class="px-5 py-2.5 text-white text-sm font-semibold rounded-xl bg-red-600 transition-opacity hover:opacity-90"
            >
              Cancel {label}
            </button>
          </form>
        </div>
      )}
      {status === "completed" && (
        <p class="text-sm text-gray-500">
          This {label.toLowerCase()} is{" "}
          <strong>{status}</strong>. No further actions available.
        </p>
      )}
    </div>
  );
}

/** Registrant table panel. Renders nothing when eventStatus is "draft". */
export function RegistrantsPanel({
  eventStatus,
  registrants,
}: {
  eventStatus: string;
  registrants: GroupEventRegistrant[];
}) {
  if (eventStatus === "draft") return null;
  return (
    <div
      class="mt-6 rounded-2xl p-6"
      style="background:white;border:1px solid #e5e7eb;"
    >
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold text-near-black">Registrants</h2>
        <span class="text-sm text-gray-500">
          {registrants.filter((r) => r.status === "registered").length} active
          {registrants.filter((r) => r.status === "cancelled").length > 0 &&
            ` · ${
              registrants.filter((r) => r.status === "cancelled").length
            } cancelled`}
        </span>
      </div>
      {registrants.length === 0
        ? <p class="text-sm text-gray-500">No registrations yet.</p>
        : (
          <div class="overflow-x-auto -mx-2">
            <table class="w-full text-sm min-w-[560px]">
              <thead>
                <tr class="text-left border-b border-gray-100">
                  <th class="px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Name
                  </th>
                  <th class="px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Email
                  </th>
                  <th class="px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th class="px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Registered
                  </th>
                  <th class="px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">
                    1-day
                  </th>
                  <th class="px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">
                    1-hour
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                {registrants.map((r) => (
                  <tr
                    key={r.id}
                    class={r.status === "cancelled" ? "opacity-40" : ""}
                  >
                    <td class="px-2 py-2.5 font-medium text-near-black">
                      {r.nameFirst} {r.nameLast}
                    </td>
                    <td class="px-2 py-2.5 text-gray-500 text-xs break-all">
                      {r.email}
                    </td>
                    <td class="px-2 py-2.5">
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
                    <td class="px-2 py-2.5 text-gray-500 text-xs">
                      {new Date(r.registeredAt).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td class="px-2 py-2.5 text-center">
                      {r.reminders.dayBefore
                        ? (
                          <span
                            title={r.reminders.dayBefore}
                            class="text-green-600"
                          >
                            ✓
                          </span>
                        )
                        : <span class="text-gray-300">&ndash;</span>}
                    </td>
                    <td class="px-2 py-2.5 text-center">
                      {r.reminders.hourBefore
                        ? (
                          <span
                            title={r.reminders.hourBefore}
                            class="text-green-600"
                          >
                            ✓
                          </span>
                        )
                        : <span class="text-gray-300">&ndash;</span>}
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

/** Poster image upload panel. */
export function PosterPanel({
  groupSlug,
  eventId,
  posterUrl,
}: {
  groupSlug: string;
  eventId: string;
  posterUrl: string | null | undefined;
}) {
  return (
    <div
      class="mt-6 rounded-2xl p-6"
      style="background:white;border:1px solid #e5e7eb;"
    >
      <h2 class="text-base font-semibold text-near-black mb-4">Poster Image</h2>
      {posterUrl && (
        <div class="mb-4">
          <img
            src={posterUrl}
            alt="Event poster"
            class="rounded-xl object-cover"
            style="max-height:12rem;"
          />
        </div>
      )}
      <form
        method="POST"
        action={`/groups/${groupSlug}/admin/events/${eventId}/poster`}
        enctype="multipart/form-data"
      >
        <div class="flex flex-wrap items-center gap-3">
          <input
            type="file"
            name="poster"
            accept="image/webp"
            class="text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />
          <button
            type="submit"
            class="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg transition-opacity hover:opacity-90"
          >
            Upload poster
          </button>
        </div>
        <p class="text-xs text-gray-400 mt-2">
          WebP only. Recommended: 1200×630px, max 5MB
        </p>
      </form>
    </div>
  );
}
