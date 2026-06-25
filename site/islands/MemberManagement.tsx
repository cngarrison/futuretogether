import { useComputed, useSignal } from "@preact/signals";
import type { GroupMember } from "@/utils/db/group-members.ts";

// GroupMemberWithOptIn mirrors the extended GroupMember interface (ft-07i.2)
export type GroupMemberWithOptIn = GroupMember;

type RoleFilter = "all" | "admin" | "member";
type StatusFilter = "active" | "pending" | "banned";

interface Props {
  groupSlug: string;
  groupId: string;
  members: GroupMemberWithOptIn[];
  optedOutCount: number;
  totalActiveCount: number;
  isOwner: boolean;
}

function formatSource(source: string | null): string {
  if (!source) return "—";
  switch (source) {
    case "self-joined":
      return "Joined";
    case "invited":
      return "Invited";
    case "imported":
      return "Imported";
    case "admin-added":
      return "Added";
    default:
      return "—";
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function RoleBadge({ role }: { role: string }) {
  if (role === "group_owner") {
    return (
      <span
        class="inline-flex items-center text-primary px-2 py-0.5 rounded text-xs font-semibold"
        style="background:#eef5f7;"
      >
        Owner
      </span>
    );
  }
  if (role === "group_admin") {
    return (
      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700">
        Admin
      </span>
    );
  }
  return (
    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
      Member
    </span>
  );
}

interface ActionsCellProps {
  member: GroupMemberWithOptIn;
  isOwner: boolean;
  loading: boolean;
  doAction: (
    membershipId: string,
    action: string,
    newRole?: string,
  ) => Promise<void>;
}

function ActionsCell({ member, isOwner, loading, doAction }: ActionsCellProps) {
  const { id, role, status } = member;

  if (role === "group_owner") {
    return <span class="text-xs text-gray-400">—</span>;
  }

  if (status === "active") {
    return (
      <div class="flex gap-2 flex-wrap">
        {role === "member" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => doAction(id, "role", "group_admin")}
            class="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-colors disabled:opacity-50"
          >
            Promote
          </button>
        )}
        {role === "group_admin" && isOwner && (
          <button
            type="button"
            disabled={loading}
            onClick={() => doAction(id, "role", "member")}
            class="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Demote
          </button>
        )}
        <button
          type="button"
          disabled={loading}
          onClick={() => doAction(id, "remove")}
          class="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50"
        >
          Remove
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => doAction(id, "ban")}
          class="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50"
        >
          Ban
        </button>
      </div>
    );
  }

  if (status === "pending" || status === "banned") {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={() => doAction(id, "remove")}
        class="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50"
      >
        Remove
      </button>
    );
  }

  return <span class="text-xs text-gray-400">—</span>;
}

export default function MemberManagement(
  { groupSlug, members, optedOutCount, totalActiveCount, isOwner }: Props,
) {
  const roleFilter = useSignal<RoleFilter>("all");
  const statusFilter = useSignal<StatusFilter>("active");
  const loading = useSignal(false);
  const errorMsg = useSignal<string | null>(null);

  // Invite panel
  const inviteOpen = useSignal(false);
  const inviteEmail = useSignal("");
  const inviteLoading = useSignal(false);
  const inviteUrl = useSignal<string | null>(null);
  const inviteError = useSignal<string | null>(null);
  const inviteEmailSent = useSignal<string | null>(null);
  const copied = useSignal(false);

  const filtered = useComputed(() =>
    members.filter((m) => {
      const roleMatch = roleFilter.value === "all" ||
        (roleFilter.value === "admin" &&
          (m.role === "group_admin" || m.role === "group_owner")) ||
        (roleFilter.value === "member" && m.role === "member");
      const statusMatch = m.status === statusFilter.value;
      return roleMatch && statusMatch;
    })
  );

  async function doAction(
    membershipId: string,
    action: string,
    newRole?: string,
  ): Promise<void> {
    const confirmMsg = action === "remove"
      ? "Remove this member from the group?"
      : action === "ban"
      ? "Ban this member? They will not be able to rejoin without admin approval."
      : action === "role" && newRole === "group_admin"
      ? "Promote this member to Admin?"
      : action === "role" && newRole === "member"
      ? "Demote this admin to Member?"
      : "Are you sure?";
    if (!globalThis.confirm(confirmMsg)) return;
    loading.value = true;
    errorMsg.value = null;
    try {
      const res = await fetch(
        `/api/groups/${groupSlug}/admin/members/action`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ membershipId, action, newRole }),
        },
      );
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || json.error) {
        errorMsg.value = json.error ?? "Action failed.";
      } else {
        globalThis.location.reload();
      }
    } catch {
      errorMsg.value = "Network error. Please try again.";
    } finally {
      loading.value = false;
    }
  }

  async function generateInvite(): Promise<void> {
    inviteLoading.value = true;
    inviteError.value = null;
    inviteUrl.value = null;
    inviteEmailSent.value = null;
    copied.value = false;
    const email = inviteEmail.value.trim();
    try {
      const res = await fetch(`/api/groups/${groupSlug}/admin/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined }),
      });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || json.error) {
        inviteError.value = json.error ?? "Failed to generate invite link.";
      } else {
        inviteUrl.value = json.url ?? null;
        if (email) inviteEmailSent.value = email;
      }
    } catch {
      inviteError.value = "Network error. Please try again.";
    } finally {
      inviteLoading.value = false;
    }
  }

  async function copyLink(): Promise<void> {
    if (!inviteUrl.value) return;
    try {
      await navigator.clipboard.writeText(inviteUrl.value);
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2000);
    } catch {
      // clipboard API unavailable — user can manually copy the readonly input
    }
  }

  return (
    <div>
      {/* Filter bar */}
      <div class="flex flex-wrap gap-3 mb-4 items-center">
        <div class="flex gap-1 rounded-lg p-1" style="background:#f3f4f6;">
          {(["all", "admin", "member"] as RoleFilter[]).map((r) => (
            <button
              type="button"
              key={r}
              class={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                roleFilter.value === r
                  ? "bg-white shadow-sm text-near-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => {
                roleFilter.value = r;
              }}
            >
              {r === "all" ? "All roles" : r === "admin" ? "Admins" : "Members"}
            </button>
          ))}
        </div>
        <div class="flex gap-1 rounded-lg p-1" style="background:#f3f4f6;">
          {(["active", "pending", "banned"] as StatusFilter[]).map((s) => (
            <button
              type="button"
              key={s}
              class={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                statusFilter.value === s
                  ? "bg-white shadow-sm text-near-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => {
                statusFilter.value = s;
              }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <span class="text-sm text-gray-400 ml-auto">
          {filtered.value.length} shown
        </span>
      </div>

      {/* Error banner */}
      {errorMsg.value !== null && (
        <div class="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-start justify-between gap-2">
          <span>{errorMsg.value}</span>
          <button
            type="button"
            onClick={() => {
              errorMsg.value = null;
            }}
            class="text-red-400 hover:text-red-600 flex-shrink-0 font-medium"
          >
            ✕
          </button>
        </div>
      )}

      {/* Member table */}
      <div class="bg-white rounded-2xl shadow-sm overflow-x-auto mb-8">
        {filtered.value.length === 0
          ? (
            <p class="text-sm text-gray-500 px-6 py-8 text-center">
              No members match the current filters.
            </p>
          )
          : (
            <table class="min-w-full divide-y divide-gray-100">
              <thead>
                <tr class="text-left">
                  <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Name
                  </th>
                  <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Email
                  </th>
                  <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Role
                  </th>
                  <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Joined
                  </th>
                  <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Opt-in
                  </th>
                  <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Source
                  </th>
                  <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                {filtered.value.map((m) => (
                  <tr key={m.id} class="hover:bg-gray-50 transition-colors">
                    <td class="px-4 py-3 text-sm font-medium text-near-black whitespace-nowrap">
                      {[m.name_first, m.name_last].filter(Boolean).join(" ") ||
                        <span class="text-gray-400">—</span>}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {m.email}
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap">
                      <RoleBadge role={m.role} />
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(m.joined_at)}
                    </td>
                    <td class="px-4 py-3 text-center">
                      {m.email_opt_in
                        ? (
                          <span
                            class="text-green-500 text-base"
                            title="Opted in"
                          >
                            ✓
                          </span>
                        )
                        : (
                          <span
                            class="text-gray-300 text-base"
                            title="Opted out"
                          >
                            —
                          </span>
                        )}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatSource(m.source)}
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap">
                      <ActionsCell
                        member={m}
                        isOwner={isOwner}
                        loading={loading.value}
                        doAction={doAction}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {/* Opted-out note */}
      {optedOutCount > 0 && (
        <p class="text-sm text-gray-400 mb-8 -mt-6">
          {optedOutCount} member{optedOutCount !== 1 ? "s" : ""}{" "}
          {optedOutCount !== 1 ? "have" : "has"} opted out of emails
          {totalActiveCount > 0 &&
            ` (${
              totalActiveCount - optedOutCount
            } of ${totalActiveCount} opted in)`}.
        </p>
      )}

      {/* Invite panel */}
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <button
          type="button"
          class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
          onClick={() => {
            inviteOpen.value = !inviteOpen.value;
          }}
        >
          <span class="font-semibold text-near-black">Invite someone</span>
          <span class="text-gray-400 text-sm">
            {inviteOpen.value ? "▲" : "▼"}
          </span>
        </button>

        {inviteOpen.value && (
          <div class="px-6 pb-6 border-t border-gray-100">
            <p class="text-sm text-gray-500 mt-4 mb-4">
              Generate a single-use invite link (expires after 7 days).
              Optionally send it directly to an email address.
            </p>
            <div class="flex gap-3 mb-4 flex-wrap sm:flex-nowrap">
              <input
                type="email"
                placeholder="Email address (optional)"
                value={inviteEmail.value}
                onInput={(e) => {
                  inviteEmail.value = (e.target as HTMLInputElement).value;
                }}
                class="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent min-w-0"
                disabled={inviteLoading.value}
              />
              <button
                type="button"
                onClick={generateInvite}
                disabled={inviteLoading.value}
                class="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-opacity whitespace-nowrap"
                style="background:#1a5f6e;"
              >
                {inviteLoading.value ? "Generating…" : "Generate invite link"}
              </button>
            </div>

            {inviteError.value !== null && (
              <p class="text-sm text-red-600 mb-3">{inviteError.value}</p>
            )}

            {inviteEmailSent.value !== null && (
              <p class="text-sm text-primary mb-3">
                ✓ Invite email sent to {inviteEmailSent.value}
              </p>
            )}

            {inviteUrl.value !== null && (
              <div class="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl.value}
                  class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600 font-mono min-w-0"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  class="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  {copied.value ? "✓ Copied!" : "Copy link"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
