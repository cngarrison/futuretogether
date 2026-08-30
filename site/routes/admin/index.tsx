import { page } from "fresh";
import { define } from "@/utils.ts";
import { getGroupDashboardStatsAdmin } from "@/utils/db/groups.ts";
import type { GroupDashboardStats } from "@/utils/db/groups.ts";

interface PageData {
  groupStats: GroupDashboardStats;
}

export const handler = define.handlers({
  async GET(_ctx) {
    const groupStats = await getGroupDashboardStatsAdmin();
    return page({ groupStats });
  },
});

export default define.page<typeof handler>(function AdminIndex({ data }) {
  const { groupStats } = data as PageData;
  const hasPending = groupStats.pendingCount > 0;

  return (
    <div class="max-w-5xl mx-auto px-6 py-10">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p class="text-gray-600 mb-8">Welcome to the admin management area.</p>

      {/* Groups stats section */}
      <section class="mb-10">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Groups</h2>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {/* Total active groups */}
          <div class="bg-white rounded-lg p-5 border-2 border-primary">
            <p class="text-3xl font-bold text-gray-900">
              {groupStats.activeCount}
            </p>
            <p class="text-sm text-gray-500 mt-1">Active groups</p>
          </div>

          {/* Pending approval — amber if > 0, grey if 0 */}
          <div
            class="bg-white rounded-lg p-5 border-2"
            style={hasPending
              ? "border-color: #c4853a; background: #fffbf5;"
              : "border-color: #d1d5db;"}
          >
            <p
              class="text-3xl font-bold"
              style={hasPending ? "color: #c4853a;" : "color: #6b7280;"}
            >
              {groupStats.pendingCount}
            </p>
            <p class="text-sm text-gray-500 mt-1">Pending approval</p>
          </div>

          {/* Total members across all groups */}
          <div class="bg-white rounded-lg p-5 border-2 border-primary">
            <p class="text-3xl font-bold text-gray-900">
              {groupStats.totalMembers}
            </p>
            <p class="text-sm text-gray-500 mt-1">Total members</p>
          </div>

          {/* New groups in last 30 days */}
          <div
            class="bg-white rounded-lg p-5 border-2"
            style="border-color: #d1d5db;"
          >
            <p class="text-3xl font-bold text-gray-900">
              {groupStats.newLast30Days}
            </p>
            <p class="text-sm text-gray-500 mt-1">New (last 30 days)</p>
          </div>
        </div>

        {/* Review pending quick action — only shown if pending > 0 */}
        {hasPending && (
          <div class="mb-5">
            <a
              f-client-nav={false}
              href="/admin/groups/?status=pending"
              class="inline-block px-5 py-2.5 text-sm font-semibold rounded-lg text-white transition-opacity hover:opacity-90"
              style="background: #c4853a;"
            >
              Review {groupStats.pendingCount} pending group
              {groupStats.pendingCount !== 1 ? "s" : ""} →
            </a>
          </div>
        )}

        {/* Recent group applications */}
        {groupStats.recentApplications.length > 0 && (
          <div>
            <h3 class="text-sm font-semibold text-gray-600 mb-3">
              Recent group applications
            </h3>
            <div class="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
              {groupStats.recentApplications.map((app) => {
                const appDate = new Date(app.created_at)
                  .toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                const badgeStyle: Record<string, string> = {
                  pending: "background:#fff3cd;color:#856404;",
                  active: "background:#d4edda;color:#155724;",
                  archived: "background:#e9ecef;color:#495057;",
                  suspended: "background:#f8d7da;color:#721c24;",
                };
                return (
                  <a
                    f-client-nav={false}
                    key={app.id}
                    href={`/admin/groups/${app.slug}`}
                    class="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div class="flex items-center gap-3">
                      <span class="font-medium text-gray-900 text-sm">
                        {app.name}
                      </span>
                      <span
                        class="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                        style={badgeStyle[app.status] ??
                          "background:#e9ecef;color:#495057;"}
                      >
                        {app.status}
                      </span>
                    </div>
                    <span class="text-xs text-gray-400">{appDate}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Navigation cards */}
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Manage</h2>
      <div class="grid md:grid-cols-2 gap-6">
        <a
          f-client-nav={false}
          href="/admin/events"
          class="block bg-white p-6 rounded-lg border-2 border-primary hover:shadow-md transition-all"
        >
          <h2 class="text-xl font-bold text-gray-900 mb-2">Events</h2>
          <p class="text-gray-600">
            Manage events and registrations. View attendees, send reminders, and
            download registration data.
          </p>
        </a>
        <a
          f-client-nav={false}
          href="/admin/members"
          class="block bg-white p-6 rounded-lg border-2 hover:shadow-md transition-all"
          style="border-color: #c4853a;"
        >
          <h2 class="text-xl font-bold text-gray-900 mb-2">Members</h2>
          <p class="text-gray-600">
            View community members and organisers. Download the member list as
            CSV and manage membership records.
          </p>
        </a>
        <a
          f-client-nav={false}
          href="/admin/emails"
          class="block bg-white p-6 rounded-lg border-2 border-primary hover:shadow-md transition-all"
        >
          <h2 class="text-xl font-bold text-gray-900 mb-2">
            Email Members
          </h2>
          <p class="text-gray-600">
            Compose and send a Markdown email to all active community members
            via Resend.
          </p>
        </a>
        <a
          f-client-nav={false}
          href="/admin/groups/"
          class="block bg-white p-6 rounded-lg border-2 hover:shadow-md transition-all"
          style="border-color: #c4853a;"
        >
          <h2 class="text-xl font-bold text-gray-900 mb-2">Groups</h2>
          <p class="text-gray-600">
            Review group applications, manage active groups, and oversee
            membership across all Future Together groups.
          </p>
        </a>
      </div>
    </div>
  );
});
