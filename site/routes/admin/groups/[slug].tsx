import { page } from "fresh";
import { define } from "@/utils.ts";
import {
  approveGroupAdmin,
  declineGroupAdmin,
  getGroupBySlugAdmin,
  getGroupEmailHistory,
  reactivateGroupAdmin,
  suspendGroupAdmin,
} from "@/utils/db/groups.ts";
import type { GroupDetail, GroupEmailSend } from "@/utils/db/groups.ts";
import { getGroupEventsSummary } from "@/utils/db/group-events.ts";
import type { GroupEvent } from "@/utils/db/group-events.ts";
import { getGroupMembers } from "@/utils/db/group-members.ts";
import type { GroupMember } from "@/utils/db/group-members.ts";
import { renderMarkdown } from "@/utils/markdown.ts";

interface PageData {
  group: GroupDetail;
  members: GroupMember[];
  events: GroupEvent[];
  emailHistory: GroupEmailSend[];
  flashError: string | null;
}

export const handler = define.handlers({
  async GET(ctx) {
    const { slug } = ctx.params;
    const group = await getGroupBySlugAdmin(slug);
    if (!group) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/admin/groups/" },
      });
    }
    const [members, events, emailHistory] = await Promise.all([
      getGroupMembers(group.id, ctx.state),
      getGroupEventsSummary(group.id, ctx.state),
      getGroupEmailHistory(group.id, ctx.state),
    ]);
    ctx.state.adminBreadcrumbs = [
      { label: "Groups", href: "/admin/groups/" },
      { label: group.name },
    ];
    return page({ group, members, events, emailHistory, flashError: null });
  },

  async POST(ctx) {
    const { slug } = ctx.params;
    const form = await ctx.req.formData();
    const action = form.get("action") as string | null;
    const groupId = form.get("groupId") as string | null;
    const reason = (form.get("reason") as string | null) ?? "other";

    if (action && groupId) {
      const approverId = ctx.state.user?.id ?? "";

      if (action === "approve" && approverId) {
        await approveGroupAdmin(groupId, approverId);
      } else if (action === "decline" || action === "archive") {
        await declineGroupAdmin(groupId, reason);
      } else if (action === "suspend" && approverId) {
        await suspendGroupAdmin(groupId, approverId);
      } else if (action === "reactivate" && approverId) {
        await reactivateGroupAdmin(groupId, approverId);
      }
    }

    return new Response(null, {
      status: 302,
      headers: { Location: `/admin/groups/${slug}` },
    });
  },
});

export default define.page<typeof handler>(function AdminGroupDetail({ data }) {
  const { group, members, events, emailHistory, flashError } = data as PageData;

  const created = new Date(group.created_at).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const approved = group.approved_at
    ? new Date(group.approved_at).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    : null;

  return (
    <div class="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div class="mt-3 mb-8 flex items-start justify-between">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-900">{group.name}</h1>
            <StatusBadge status={group.status} />
          </div>
          <p class="text-sm text-gray-500 mt-1">
            /{group.slug} &bull; {group.group_type.replace("-", "‑")}
            {group.tier ? ` • ${group.tier}` : ""}
          </p>
        </div>
      </div>

      {flashError && (
        <div
          class="mb-6 p-3 rounded-lg text-sm"
          style="background:#fff3cd;color:#856404;"
        >
          {flashError}
        </div>
      )}

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info panel + data sections */}
        <div class="lg:col-span-2 space-y-6">
          <InfoPanel group={group} created={created} approved={approved} />
          <MembersCard members={members} />
          <EventsCard events={events} />
          <EmailHistoryCard emailHistory={emailHistory} />
        </div>

        {/* Sidebar: cover image + member count + actions */}
        <div class="space-y-5">
          <div class="rounded-xl overflow-hidden shadow-sm">
            <img
              src={group.cover_url}
              alt={group.name}
              class="w-full h-40 object-cover"
            />
          </div>

          <div class="bg-white rounded-xl p-4 shadow-sm text-center">
            <p class="text-2xl font-bold text-gray-900">
              {group.member_count}
            </p>
            <p class="text-xs text-gray-500">active members</p>
          </div>

          <ActionsPanel group={group} />
        </div>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "background:#fff3cd;color:#856404;",
    active: "background:#d4edda;color:#155724;",
    archived: "background:#e9ecef;color:#495057;",
    suspended: "background:#f8d7da;color:#721c24;",
    draft: "background:#e9ecef;color:#495057;",
    published: "background:#d4edda;color:#155724;",
    cancelled: "background:#f8d7da;color:#721c24;",
    completed: "background:#e0e7ff;color:#3730a3;",
  };
  const style = styles[status] ?? "background:#e9ecef;color:#495057;";
  return (
    <span
      class="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={style}
    >
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    group_owner: "background:#dbeafe;color:#1e40af;",
    group_admin: "background:#e0e7ff;color:#3730a3;",
    member: "background:#f3f4f6;color:#374151;",
  };
  const labels: Record<string, string> = {
    group_owner: "Owner",
    group_admin: "Admin",
    member: "Member",
  };
  const style = styles[role] ?? "background:#f3f4f6;color:#374151;";
  return (
    <span class="px-2 py-0.5 rounded-full text-xs font-semibold" style={style}>
      {labels[role] ?? role}
    </span>
  );
}

function InfoPanel(
  { group, created, approved }: {
    group: GroupDetail;
    created: string;
    approved: string | null;
  },
) {
  const rows: Array<{ label: string; value: string | null }> = [
    { label: "Location", value: group.location_name },
    {
      label: "State / region",
      value: group.location_region ?? group.location_state,
    },
    { label: "Country", value: group.location_country },
    { label: "Website", value: group.website_url },
    { label: "Created", value: created },
    { label: "Approved", value: approved },
  ];

  return (
    <div class="bg-white rounded-xl shadow-sm p-5 space-y-5">
      {group.description && (
        <div>
          <h2 class="text-sm font-semibold text-gray-700 mb-1">Description</h2>
          <div
            class="prose prose-sm max-w-none text-gray-600"
            // deno-lint-ignore react-no-danger
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(group.description),
            }}
          />
        </div>
      )}

      <div>
        <h2 class="text-sm font-semibold text-gray-700 mb-2">Details</h2>
        <dl class="space-y-2">
          {rows.filter((r) => r.value).map((r) => (
            <div key={r.label} class="flex gap-3 text-sm">
              <dt class="w-32 text-gray-400 shrink-0">{r.label}</dt>
              <dd class="text-gray-800">
                {r.label === "Website"
                  ? (
                    <a
                      href={r.value!}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="underline text-primary"
                    >
                      {r.value}
                    </a>
                  )
                  : r.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {group.tags.length > 0 && (
        <div>
          <h2 class="text-sm font-semibold text-gray-700 mb-2">Tags</h2>
          <div class="flex flex-wrap gap-2">
            {group.tags.map((tag) => (
              <span
                key={tag}
                class="text-xs px-2 py-0.5 rounded-full"
                style="background:#f3f4f6;color:#374151;"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Application answers */}
      {(group.applicant_why || group.applicant_how) && (
        <div style="border-top: 1px solid #e5e7eb; padding-top: 1.25rem;">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Application</h2>
          <dl class="space-y-4">
            {group.applicant_name && (
              <div>
                <dt class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Applicant
                </dt>
                <dd class="text-sm text-gray-800">
                  {group.applicant_name}
                  {group.applicant_email && (
                    <>
                      {" • "}
                      <a
                        href={`mailto:${group.applicant_email}`}
                        class="text-primary underline"
                      >
                        {group.applicant_email}
                      </a>
                    </>
                  )}
                </dd>
              </div>
            )}
            {group.applicant_why && (
              <div>
                <dt class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Why do they want to start this group?
                </dt>
                <dd class="text-sm text-gray-700 whitespace-pre-wrap">
                  {group.applicant_why}
                </dd>
              </div>
            )}
            {group.applicant_how && (
              <div>
                <dt class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  How do they plan to grow and run it?
                </dt>
                <dd class="text-sm text-gray-700 whitespace-pre-wrap">
                  {group.applicant_how}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

function MembersCard({ members }: { members: GroupMember[] }) {
  return (
    <div class="bg-white rounded-xl shadow-sm p-5">
      <div class="flex items-center gap-2 mb-4">
        <h2 class="text-sm font-semibold text-gray-700">Members</h2>
        <span
          class="px-2 py-0.5 rounded-full text-xs font-semibold"
          style="background:#e5e7eb;color:#374151;"
        >
          {members.length}
        </span>
      </div>
      {members.length === 0
        ? <p class="text-sm text-gray-400 text-center py-4">No members yet</p>
        : (
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100">
                  {["Name", "Email", "Role", "Status", "Joined"].map((h) => (
                    <th
                      key={h}
                      class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                {members.map((m) => (
                  <tr key={m.id} class="hover:bg-gray-50">
                    <td class="py-2 pr-3 font-medium text-gray-900">
                      {[m.name_first, m.name_last].filter(Boolean).join(" ") ||
                        "—"}
                    </td>
                    <td class="py-2 pr-3 text-gray-600">
                      <a
                        href={`mailto:${m.email}`}
                        class="hover:underline"
                        style="color:#1a5f6e;"
                      >
                        {m.email}
                      </a>
                    </td>
                    <td class="py-2 pr-3">
                      <RoleBadge role={m.role} />
                    </td>
                    <td class="py-2 pr-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td class="py-2 text-gray-400 text-xs">
                      {new Date(m.joined_at).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
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

function EventsCard({ events }: { events: GroupEvent[] }) {
  return (
    <div class="bg-white rounded-xl shadow-sm p-5">
      <h2 class="text-sm font-semibold text-gray-700 mb-4">Events</h2>
      {events.length === 0
        ? <p class="text-sm text-gray-400 text-center py-4">No events yet</p>
        : (
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100">
                  {["Title", "Date", "Status"].map((h) => (
                    <th
                      key={h}
                      class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                {events.map((e) => (
                  <tr key={e.id} class="hover:bg-gray-50">
                    <td class="py-2 pr-3 font-medium text-gray-900">
                      {e.title ?? "(untitled)"}
                    </td>
                    <td class="py-2 pr-3 text-gray-500 text-xs">
                      {e.event_date
                        ? new Date(e.event_date).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                        : "—"}
                    </td>
                    <td class="py-2">
                      <StatusBadge status={e.status} />
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

function EmailHistoryCard(
  { emailHistory }: { emailHistory: GroupEmailSend[] },
) {
  return (
    <div class="bg-white rounded-xl shadow-sm p-5">
      <h2 class="text-sm font-semibold text-gray-700 mb-4">Email history</h2>
      {emailHistory.length === 0
        ? (
          <p class="text-sm text-gray-400 text-center py-4">
            No emails sent yet
          </p>
        )
        : (
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100">
                  {["Subject", "Date", "Recipients"].map((h) => (
                    <th
                      key={h}
                      class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                {emailHistory.map((e) => (
                  <tr key={e.id} class="hover:bg-gray-50">
                    <td class="py-2 pr-3 font-medium text-gray-900">
                      {e.subject}
                    </td>
                    <td class="py-2 pr-3 text-gray-500 text-xs">
                      {new Date(e.sent_at).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td class="py-2 text-gray-500 text-xs">
                      {e.recipient_count ?? "n/a"}
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

function ActionsPanel({ group }: { group: GroupDetail }) {
  return (
    <div class="bg-white rounded-xl shadow-sm p-5 space-y-3">
      <h2 class="text-sm font-semibold text-gray-700">Actions</h2>

      {/* Pending: Approve + Decline */}
      {group.status === "pending" && (
        <>
          <form method="POST">
            <input type="hidden" name="action" value="approve" />
            <input type="hidden" name="groupId" value={group.id} />
            <button
              type="submit"
              class="w-full px-4 py-2 text-sm font-semibold rounded-lg text-white transition-opacity hover:opacity-90"
              style="background:#155724;"
            >
              Approve group
            </button>
          </form>

          <details>
            <summary
              class="text-sm font-medium cursor-pointer list-none px-4 py-2 rounded-lg text-center"
              style="background:#f8d7da;color:#721c24;"
            >
              Decline…
            </summary>
            <form method="POST" class="mt-2 space-y-2">
              <input type="hidden" name="action" value="decline" />
              <input type="hidden" name="groupId" value={group.id} />
              <select
                name="reason"
                class="w-full text-sm rounded-lg px-3 py-2"
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
                class="w-full px-4 py-2 text-sm font-semibold rounded-lg text-white"
                style="background:#721c24;"
              >
                Confirm decline
              </button>
            </form>
          </details>
        </>
      )}

      {/* Active: Suspend group */}
      {group.status === "active" && (
        <form method="POST">
          <input type="hidden" name="action" value="suspend" />
          <input type="hidden" name="groupId" value={group.id} />
          <button
            type="submit"
            class="w-full px-4 py-2 text-sm font-semibold rounded-lg text-white transition-opacity hover:opacity-90"
            style="background:#92400e;"
          >
            Suspend group
          </button>
        </form>
      )}

      {/* Archived / Suspended: Reactivate */}
      {(group.status === "archived" || group.status === "suspended") && (
        <form method="POST">
          <input type="hidden" name="action" value="reactivate" />
          <input type="hidden" name="groupId" value={group.id} />
          <button
            type="submit"
            class="w-full px-4 py-2 text-sm font-semibold rounded-lg text-white transition-opacity hover:opacity-90"
            style="background:#155724;"
          >
            Reactivate group
          </button>
        </form>
      )}

      {/* Open group admin panel — all non-pending statuses */}
      {group.status !== "pending" && (
        <a
          href={`/groups/${group.slug}/admin/`}
          target="_blank"
          rel="noopener noreferrer"
          class="block text-center px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-gray-50"
          style="border-color: #1a5f6e; color: #1a5f6e;"
        >
          Open group admin panel ↗
        </a>
      )}

      {/* Public view link — active only */}
      {group.status === "active" && (
        <a
          href={`/groups/${group.slug}/`}
          target="_blank"
          rel="noopener noreferrer"
          class="block text-center text-sm font-medium hover:underline"
          style="color: #1a5f6e;"
        >
          View public page &rarr;
        </a>
      )}
    </div>
  );
}
