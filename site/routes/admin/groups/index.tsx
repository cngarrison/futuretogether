import { page } from "fresh";
import { define } from "@/utils.ts";
import {
  approveGroupAdmin,
  declineGroupAdmin,
  getGroupsForAdmin,
} from "@/utils/db/groups.ts";
import type { GroupDetail } from "@/utils/db/groups.ts";
type AdminGroup = GroupDetail & { applicant_email?: string };

interface PageData {
  groups: AdminGroup[];
  statusFilter: string;
  flashError: string | null;
}

export const handler = define.handlers({
  async GET(ctx) {
    const url = new URL(ctx.req.url);
    const statusFilter = url.searchParams.get("status") ?? "all";
    const groups = await getGroupsForAdmin();
    ctx.state.adminBreadcrumbs = [{ label: "Groups" }];
    return page({ groups, statusFilter, flashError: null });
  },

  async POST(ctx) {
    const form = await ctx.req.formData();
    const action = form.get("action") as string | null;
    const groupId = form.get("groupId") as string | null;
    const reason = (form.get("reason") as string | null) ?? "other";

    if (!action || !groupId) {
      const groups = await getGroupsForAdmin();
      return page({
        groups,
        statusFilter: "all",
        flashError: "Missing action or group ID.",
      });
    }

    const approverId = ctx.state.user?.id ?? "";

    if (action === "approve" && approverId) {
      await approveGroupAdmin(groupId, approverId);
      return new Response(null, {
        status: 302,
        headers: { Location: "/admin/groups/?status=pending" },
      });
    }

    if (action === "decline") {
      await declineGroupAdmin(groupId, reason);
      return new Response(null, {
        status: 302,
        headers: { Location: "/admin/groups/?status=pending" },
      });
    }

    return new Response(null, {
      status: 302,
      headers: { Location: "/admin/groups/" },
    });
  },
});

export default define.page<typeof handler>(function AdminGroupsIndex(
  { data },
) {
  const { groups, statusFilter, flashError } = data as PageData;

  // Filter groups by status tab
  const filtered = statusFilter === "all"
    ? groups
    : groups.filter((g) => g.status === statusFilter);

  const tabs = ["all", "pending", "active", "archived"];
  const counts: Record<string, number> = { all: groups.length };
  for (const g of groups) {
    counts[g.status] = (counts[g.status] ?? 0) + 1;
  }

  return (
    <div class="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Groups</h1>
        {/* Create group — Phase B */}
        <button
          type="button"
          disabled
          class="px-4 py-2 text-sm font-medium rounded-lg bg-gray-200 text-gray-400 cursor-not-allowed"
          title="Coming in Phase B"
        >
          + Create group
        </button>
      </div>

      {flashError && (
        <div
          class="mb-4 p-3 rounded-lg text-sm"
          style="background: #fff3cd; color: #856404;"
        >
          {flashError}
        </div>
      )}

      {/* Status tabs */}
      <div class="flex gap-1 mb-6" style="border-bottom: 2px solid #e5e7eb;">
        {tabs.map((tab) => (
          <a
            key={tab}
            href={`/admin/groups/?status=${tab}`}
            class={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              statusFilter === tab
                ? "border-b-2 -mb-0.5 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
            style={statusFilter === tab ? "border-color: #1a5f6e;" : ""}
          >
            {tab}{" "}
            {counts[tab] !== undefined && (
              <span class="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {counts[tab]}
              </span>
            )}
          </a>
        ))}
      </div>

      {/* Table */}
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0
          ? (
            <div class="p-10 text-center text-gray-400">
              No groups with status “{statusFilter}”.
            </div>
          )
          : (
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  {[
                    "Name",
                    "Location",
                    "Type",
                    "Tier",
                    "Status",
                    "Members",
                    "Created",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                {filtered.map((group) => (
                  <GroupRow key={group.id} group={group} />
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// GroupRow sub-component
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "background:#fff3cd;color:#856404;",
    active: "background:#d4edda;color:#155724;",
    archived: "background:#e9ecef;color:#495057;",
    suspended: "background:#f8d7da;color:#721c24;",
  };
  const style = styles[status] ?? "background:#e9ecef;color:#495057;";
  return (
    <span
      class="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={style}
    >
      {status}
    </span>
  );
}

function GroupRow({ group }: { group: AdminGroup }) {
  const created = new Date(group.created_at).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <tr class="hover:bg-gray-50">
      <td class="px-4 py-3">
        <span class="font-medium text-gray-900">{group.name}</span>
        {group.tagline && (
          <p class="text-xs text-gray-400 mt-0.5 max-w-xs truncate">
            {group.tagline}
          </p>
        )}
      </td>
      <td class="px-4 py-3 text-gray-600">{group.location_name ?? "—"}</td>
      <td class="px-4 py-3 text-gray-600 capitalize">
        {group.group_type.replace("-", "‑")}
      </td>
      <td class="px-4 py-3 text-gray-600 capitalize">{group.tier ?? "—"}</td>
      <td class="px-4 py-3">
        <StatusBadge status={group.status} />
      </td>
      <td class="px-4 py-3 text-gray-600">{group.member_count}</td>
      <td class="px-4 py-3 text-gray-500 text-xs">{created}</td>
      <td class="px-4 py-3">
        <GroupActions group={group} />
      </td>
    </tr>
  );
}

function GroupActions({ group }: { group: AdminGroup }) {
  if (group.status === "pending") {
    return (
      <div class="flex items-center gap-2">
        {/* View detail */}
        <a
          href={`/admin/groups/${group.slug}`}
          class="px-3 py-1 text-xs font-medium rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          View
        </a>

        {/* Approve */}
        <form method="POST">
          <input type="hidden" name="action" value="approve" />
          <input type="hidden" name="groupId" value={group.id} />
          <button
            type="submit"
            class="px-3 py-1 text-xs font-semibold rounded-lg text-white transition-opacity hover:opacity-90"
            style="background:#155724;"
          >
            Approve
          </button>
        </form>

        {/* Decline — inline expand */}
        <details class="relative">
          <summary
            class="px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer list-none"
            style="background:#f8d7da;color:#721c24;"
          >
            Decline…
          </summary>
          <div
            class="absolute right-0 top-8 z-10 w-52 rounded-xl shadow-lg p-3 bg-white"
            style="border: 1px solid #e5e7eb;"
          >
            <form method="POST" class="space-y-2">
              <input type="hidden" name="action" value="decline" />
              <input type="hidden" name="groupId" value={group.id} />
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Reason
              </label>
              <select
                name="reason"
                class="w-full text-xs rounded-lg px-2 py-1.5"
                style="border:1px solid #d1d5db;"
              >
                <option value="spam">Spam or fake</option>
                <option value="marketing">Commercial / marketing intent</option>
                <option value="duplicate">Duplicate of existing group</option>
                <option value="incomplete">Incomplete application</option>
                <option value="other">Other</option>
              </select>
              <button
                type="submit"
                class="w-full px-3 py-1.5 text-xs font-semibold rounded-lg text-white"
                style="background:#721c24;"
              >
                Confirm decline
              </button>
            </form>
          </div>
        </details>
      </div>
    );
  }

  // Active, archived, suspended — view link only
  return (
    <a
      href={`/admin/groups/${group.slug}`}
      class="text-xs font-medium text-primary hover:underline"
    >
      View &rarr;
    </a>
  );
}
