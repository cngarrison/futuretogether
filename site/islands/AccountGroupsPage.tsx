import { useSignal } from "@preact/signals";
import type { JSX } from "preact";
import type {
  MembershipRow,
  RegistrationRow,
} from "@/routes/account/groups/index.tsx";

// ---------------------------------------------------------------------------
// Date formatting helper
// ---------------------------------------------------------------------------

function formatDate(naiveDatetime: string, _timezone: string): string {
  // Note: Temporal is not used here — browser Temporal implementations differ from
  // Deno's in toZonedDateTime() signature. Instead, parse the naive wall-clock
  // components directly and treat them as UTC so Intl displays them unchanged.
  try {
    const [datePart, timePart = "00:00:00"] = naiveDatetime.split(/[T ]/);
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour = 0, minute = 0] = timePart.split(":").map(Number);
    if (!year || !month || !day) return naiveDatetime;
    const ref = new Date(Date.UTC(year, month - 1, day, hour, minute));
    return ref.toLocaleString("en-AU", {
      timeZone: "UTC",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return naiveDatetime;
  }
}

function formatMonthYear(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString("en-AU", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

// ---------------------------------------------------------------------------
// Role badge
// ---------------------------------------------------------------------------

function RoleBadge({ role }: { role: string }): JSX.Element {
  if (role === "group_owner") {
    return (
      <span class="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
        Owner
      </span>
    );
  }
  if (role === "group_admin") {
    return (
      <span class="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
        Admin
      </span>
    );
  }
  return (
    <span class="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
      Member
    </span>
  );
}

// ---------------------------------------------------------------------------
// Membership card
// ---------------------------------------------------------------------------

interface MembershipCardProps {
  membership: MembershipRow;
  onRemove: (id: string) => void;
}

function MembershipCard(
  { membership, onRemove }: MembershipCardProps,
): JSX.Element {
  const toggling = useSignal(false);
  const optIn = useSignal(membership.emailOptIn);
  const optInError = useSignal<string | null>(null);

  const confirming = useSignal(false);
  const leaving = useSignal(false);
  const leaveError = useSignal<string | null>(null);

  const isOwner = membership.role === "group_owner";
  const isAdmin = membership.role === "group_admin" || isOwner;

  async function handleOptInToggle(e: Event): Promise<void> {
    const newValue = (e.target as HTMLInputElement).checked;
    optIn.value = newValue;
    optInError.value = null;
    toggling.value = true;
    try {
      const res = await fetch(
        `/api/account/memberships/${membership.id}/opt-in`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailOptIn: newValue }),
        },
      );
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        optIn.value = !newValue; // revert
        optInError.value = json.error ?? "Failed to update preference.";
      }
    } catch {
      optIn.value = !newValue;
      optInError.value = "Network error. Please try again.";
    } finally {
      toggling.value = false;
    }
  }

  async function handleLeaveConfirm(): Promise<void> {
    leaving.value = true;
    leaveError.value = null;
    try {
      const res = await fetch(
        `/api/account/memberships/${membership.id}/leave`,
        {
          method: "POST",
        },
      );
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        leaveError.value = json.error ?? "Failed to leave group.";
      } else {
        onRemove(membership.id);
      }
    } catch {
      leaveError.value = "Network error. Please try again.";
    } finally {
      leaving.value = false;
      confirming.value = false;
    }
  }

  return (
    <div class="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
      {/* Header row */}
      <div class="flex items-start justify-between gap-3 mb-3">
        <div>
          <a
            href={`/groups/${membership.groupSlug}/`}
            class="text-lg font-semibold text-primary hover:underline"
          >
            {membership.groupName}
          </a>
          <div class="flex items-center gap-2 mt-1">
            <RoleBadge role={membership.role} />
            <span class="text-sm text-gray-500">
              Member since {formatMonthYear(membership.joinedAt)}
            </span>
          </div>
        </div>
        {isAdmin && (
          <a
            href={`/groups/${membership.groupSlug}/admin/`}
            class="text-sm font-medium text-teal-700 hover:underline whitespace-nowrap"
          >
            Manage group →
          </a>
        )}
      </div>

      {/* Email opt-in toggle */}
      <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none mb-3">
        <input
          type="checkbox"
          checked={optIn.value}
          disabled={toggling.value}
          onChange={handleOptInToggle}
          class="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50"
        />
        <span>Receive group emails</span>
        {toggling.value && (
          <span class="text-xs text-gray-400 ml-1">Saving…</span>
        )}
      </label>
      {optInError.value && (
        <p class="text-sm text-red-600 mb-3">{optInError.value}</p>
      )}

      {/* Leave group */}
      {!confirming.value
        ? (
          <button
            type="button"
            onClick={() => {
              if (!isOwner) confirming.value = true;
            }}
            disabled={isOwner}
            title={isOwner ? "Transfer ownership before leaving" : undefined}
            class={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              isOwner
                ? "border-gray-200 text-gray-300 cursor-not-allowed"
                : "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            }`}
          >
            Leave group
          </button>
        )
        : (
          <div class="mt-1">
            <p class="text-sm text-gray-700 mb-2">
              Leave{" "}
              <strong>{membership.groupName}</strong>? You can rejoin later.
            </p>
            <div class="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLeaveConfirm}
                disabled={leaving.value}
                class="text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {leaving.value ? "Leaving…" : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => {
                  confirming.value = false;
                  leaveError.value = null;
                }}
                class="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
            {leaveError.value && (
              <p class="text-sm text-red-600 mt-2">{leaveError.value}</p>
            )}
          </div>
        )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Registration card
// ---------------------------------------------------------------------------

interface RegistrationCardProps {
  registration: RegistrationRow;
  onRemove: (id: string) => void;
}

function RegistrationCard(
  { registration, onRemove }: RegistrationCardProps,
): JSX.Element {
  const confirming = useSignal(false);
  const cancelling = useSignal(false);
  const cancelError = useSignal<string | null>(null);

  async function handleCancelConfirm(): Promise<void> {
    cancelling.value = true;
    cancelError.value = null;
    try {
      const res = await fetch(
        `/api/account/registrations/${registration.id}/cancel`,
        {
          method: "POST",
        },
      );
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        cancelError.value = json.error ?? "Failed to cancel registration.";
      } else {
        onRemove(registration.id);
      }
    } catch {
      cancelError.value = "Network error. Please try again.";
    } finally {
      cancelling.value = false;
      confirming.value = false;
    }
  }

  return (
    <div class="bg-white rounded-xl border border-gray-200 p-4 mb-3 shadow-sm">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="font-medium text-gray-900">{registration.eventTitle}</p>
          {registration.eventDate && (
            <p class="text-sm text-gray-500 mt-0.5">
              {formatDate(registration.eventDate, registration.timezone)}
            </p>
          )}
          <a
            href={`/api/events/${registration.eventSlug}/ical`}
            class="text-xs text-teal-600 hover:underline mt-0.5 inline-block"
            download={`${registration.eventSlug}.ics`}
            f-client-nav={false}
          >
            Add to calendar ↓
          </a>
          <p class="text-xs text-gray-400 mt-0.5">
            <a
              href={`/groups/${registration.groupSlug}/`}
              class="hover:underline"
            >
              {registration.groupSlug}
            </a>
          </p>
        </div>

        {!confirming.value
          ? (
            <button
              type="button"
              onClick={() => {
                confirming.value = true;
              }}
              class="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              Cancel registration
            </button>
          )
          : (
            <div class="text-right">
              <p class="text-sm text-gray-700 mb-2">
                Cancel your registration for{" "}
                <strong>{registration.eventTitle}</strong>?
              </p>
              <div class="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleCancelConfirm}
                  disabled={cancelling.value}
                  class="text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {cancelling.value ? "Cancelling…" : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirming.value = false;
                    cancelError.value = null;
                  }}
                  class="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Keep
                </button>
              </div>
              {cancelError.value && (
                <p class="text-sm text-red-600 mt-2">{cancelError.value}</p>
              )}
            </div>
          )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main island
// ---------------------------------------------------------------------------

interface AccountGroupsPageProps {
  memberships: MembershipRow[];
  registrations: RegistrationRow[];
}

export default function AccountGroupsPage(
  { memberships: initialMemberships, registrations: initialRegistrations }:
    AccountGroupsPageProps,
): JSX.Element {
  const memberships = useSignal<MembershipRow[]>(initialMemberships);
  const registrations = useSignal<RegistrationRow[]>(initialRegistrations);

  function removeMembership(id: string): void {
    memberships.value = memberships.value.filter((m) => m.id !== id);
  }

  function removeRegistration(id: string): void {
    registrations.value = registrations.value.filter((r) => r.id !== id);
  }

  return (
    <div>
      {/* Memberships section */}
      <section class="mb-10">
        {memberships.value.length === 0
          ? (
            <p class="text-gray-500 text-sm">
              You have no active group memberships.
            </p>
          )
          : memberships.value.map((m) => (
            <MembershipCard
              key={m.id}
              membership={m}
              onRemove={removeMembership}
            />
          ))}
      </section>

      {/* Upcoming registrations section */}
      {registrations.value.length > 0 && (
        <section>
          <h2 class="text-xl font-semibold text-primary mb-4">
            Upcoming event registrations
          </h2>
          {registrations.value.map((r) => (
            <RegistrationCard
              key={r.id}
              registration={r}
              onRemove={removeRegistration}
            />
          ))}
        </section>
      )}
    </div>
  );
}
