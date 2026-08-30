import { define } from "@/utils.ts";
import { page } from "fresh";
import { getAllMembersAdmin } from "@/utils/db/group-members.ts";
import type { Member } from "@/utils/members.ts";
import RemoveMemberButton from "@/islands/RemoveMemberButton.tsx";

/**
 * Admin members list — /admin/members
 */

interface MembersData {
  members: Member[];
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export const handler = define.handlers<MembersData>({
  async GET(ctx) {
    const members = await getAllMembersAdmin();
    ctx.state.adminBreadcrumbs = [{ label: "Members" }];
    return page({ members });
  },
});

export default define.page<typeof handler>(function AdminMembersPage(
  { data },
) {
  const { members } = data ?? { members: [] };

  const active = members.filter((m) => m.status !== "removed");
  const removed = members.filter((m) => m.status === "removed");
  const organisers = active.filter((m) => m.role === "organiser");
  const fromJoinForm = active.filter((m) => m.source === "join_form");
  const fromEvents = active.filter((m) => m.source === "event_registration");

  return (
    <div class="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Members</h1>
        <div class="flex flex-col items-end gap-2">
          <a
            f-client-nav={false}
            href="/api/admin/members/download"
            class="inline-flex items-center text-white px-4 py-2 bg-primary rounded-lg text-sm transition-opacity hover:opacity-90"
          >
            <svg
              class="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download CSV
          </a>
        </div>
      </div>

      {/* Stats */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
        <div class="rounded-lg p-6" style="background-color: #eef5f7;">
          <div class="text-3xl font-bold text-primary mb-2">
            {active.length}
          </div>
          <div class="text-gray-600">Active Members</div>
        </div>
        <div class="bg-amber-50 rounded-lg p-6">
          <div class="text-3xl font-bold text-accent mb-2">
            {organisers.length}
          </div>
          <div class="text-gray-600">Organisers</div>
        </div>
        <div class="bg-green-50 rounded-lg p-6">
          <div class="text-3xl font-bold text-green-600 mb-2">
            {fromJoinForm.length}
          </div>
          <div class="text-gray-600">Via Join Form</div>
        </div>
        <div class="bg-gray-50 rounded-lg p-6">
          <div class="text-3xl font-bold text-gray-600 mb-2">
            {fromEvents.length}
          </div>
          <div class="text-gray-600">Via Events</div>
        </div>
      </div>

      {/* Active members table */}
      {active.length > 0
        ? (
          <div class="overflow-x-auto mb-10">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  {[
                    "Name",
                    "Email",
                    "Role",
                    "Location",
                    "Heard From",
                    "Interests",
                    "Joined",
                    "Source",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {active.map((member, i) => (
                  <tr
                    key={member.id}
                    class={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                      <a
                        f-client-nav={false}
                        href={`mailto:${member.email}`}
                        class="text-primary hover:underline"
                      >
                        {member.email}
                      </a>
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap">
                      {member.role === "organiser"
                        ? (
                          <span class="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                            ⭐ Organiser
                          </span>
                        )
                        : (
                          <span class="px-2 py-1 text-xs font-semibold text-primary rounded-full bg-teal-100">
                            Member
                          </span>
                        )}
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.location || "—"}
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.heardFrom || "—"}
                    </td>
                    <td class="px-4 py-4 text-sm text-gray-500 max-w-[200px]">
                      {member.interests.length > 0
                        ? (
                          <span title={member.interests.join(", ")}>
                            {member.interests.slice(0, 2).join(", ")}
                            {member.interests.length > 2 &&
                              ` +${member.interests.length - 2}`}
                          </span>
                        )
                        : "—"}
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(member.joinedAt)}
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap">
                      <span
                        class={`px-2 py-1 text-xs font-semibold rounded-full ${
                          member.source === "join_form"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {member.source === "join_form" ? "Join form" : "Event"}
                      </span>
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap text-sm">
                      <RemoveMemberButton
                        memberId={member.id}
                        memberEmail={member.email}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        : (
          <div class="text-center py-12 text-gray-500 mb-10">
            <p class="text-lg">No members yet.</p>
            <p class="text-sm mt-2">
              Members appear here when someone joins via the /join page or
              registers for an event.
            </p>
          </div>
        )}

      {/* Removed members (collapsed) */}
      {removed.length > 0 && (
        <details class="mt-4">
          <summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            {removed.length} removed member{removed.length !== 1 ? "s" : ""}
          </summary>
          <div class="mt-4 overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 opacity-60">
              <thead class="bg-gray-50">
                <tr>
                  {["Name", "Email", "Role", "Joined", "Source"].map(
                    (h) => (
                      <th
                        key={h}
                        class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {removed.map((member) => (
                  <tr key={member.id}>
                    <td class="px-4 py-3 text-sm text-gray-400">
                      {member.firstName} {member.lastName}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-400">
                      {member.email}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-400">
                      {member.role}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-400">
                      {formatDate(member.joinedAt)}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-400">
                      {member.source === "join_form" ? "Join form" : "Event"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
});
