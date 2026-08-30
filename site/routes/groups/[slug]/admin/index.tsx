import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import type { GroupInfo, GroupMembershipInfo } from "@/utils.ts";

interface DashboardData {
  group: GroupInfo;
  membership: GroupMembershipInfo | null;
  isSiteAdminBypass: boolean;
  stats: {
    memberCount: number;
    upcomingEvents: number;
    emailsThisMonth: number;
  };
}

export const handler = define.handlers<DashboardData>({
  async GET(ctx) {
    const group = ctx.state.group!;
    const membership = ctx.state.membership ?? null;
    const isSiteAdminBypass = ctx.state.isSiteAdminBypass ?? false;

    const db = ctx.state.supabaseClient!;
    const now = new Date().toISOString();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Fetch stats in parallel
    const [
      { count: upcomingEvents },
      { count: emailsThisMonth },
    ] = await Promise.all([
      db
        .from("group_events")
        .select("*", { count: "exact", head: true })
        .eq("group_id", group.id)
        .eq("status", "published")
        .gte("event_date", now),
      db
        .from("email_sends")
        .select("*", { count: "exact", head: true })
        .eq("group_id", group.id)
        .gte("sent_at", monthStart.toISOString()),
    ]);

    return page({
      group,
      membership,
      isSiteAdminBypass,
      stats: {
        memberCount: group.member_count,
        upcomingEvents: upcomingEvents ?? 0,
        emailsThisMonth: emailsThisMonth ?? 0,
      },
    });
  },
});

export default define.page<typeof handler>(function GroupAdminDashboard(
  { data },
) {
  const { group, isSiteAdminBypass, stats } = data as DashboardData;
  const slug = group.slug;
  const basePath = `/groups/${slug}/admin`;

  return (
    <>
      <Head>
        <title>{group.name} — Admin — Future Together</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Site admin bypass banner */}
        {isSiteAdminBypass && (
          <div
            class="mb-6 flex items-start gap-3 px-4 py-3.5 rounded-xl text-sm"
            style="background-color: #fff8e6; border: 1px solid #f0d78a; color: #7a5a00;"
          >
            <span class="shrink-0 font-bold mt-px">!</span>
            <span>
              You’re viewing this group as a <strong>site admin</strong>{" "}
              — you are not a group member. Your actions here affect real member
              data.
            </span>
          </div>
        )}

        {/* Heading */}
        <div class="mb-8">
          <h1 class="text-2xl sm:text-3xl font-bold text-near-black mb-1">
            {group.name}
          </h1>
          <p class="text-sm" style="color: rgba(28,26,24,0.5);">
            Group dashboard
          </p>
        </div>

        {/* Stats row */}
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard label="Total members" value={stats.memberCount} />
          <StatCard label="Upcoming events" value={stats.upcomingEvents} />
          <StatCard
            label="Emails sent this month"
            value={stats.emailsThisMonth}
          />
        </div>

        {/* Quick actions */}
        <div class="mb-10">
          <h2
            class="text-xs font-semibold uppercase tracking-widest mb-4"
            style="color: rgba(28,26,24,0.4);"
          >
            Quick actions
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <QuickAction
              href={`${basePath}/members/`}
              label="Invite member"
              description="Send a direct invitation link"
            />
            <QuickAction
              href={`${basePath}/events/`}
              label="Create event"
              description="Schedule a new group event"
            />
            <QuickAction
              href={`${basePath}/email/`}
              label="Send email"
              description="Compose a message to members"
            />
          </div>
        </div>

        {/* Manage section links */}
        <div>
          <h2
            class="text-xs font-semibold uppercase tracking-widest mb-4"
            style="color: rgba(28,26,24,0.4);"
          >
            Manage
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              [
                `${basePath}/members/`,
                "Members",
                "View, invite and manage group members",
              ],
              [
                `${basePath}/events/`,
                "Events",
                "Schedule and manage group events",
              ],
              [
                `${basePath}/email/`,
                "Email",
                "Compose and send emails to members",
              ],
              [
                `${basePath}/settings/`,
                "Settings",
                "Update group details and preferences",
              ],
              [
                `${basePath}/support/`,
                "Support & resources",
                "Guides, templates and how-to materials",
              ],
            ] as [string, string, string][]).map(([href, label, desc]) => (
              <a
                f-client-nav={false}
                key={href}
                href={href}
                class="block px-5 py-4 rounded-xl border transition-colors hover:border-primary/30 hover:bg-white"
                style="border-color: #e0dbd3; background-color: #fff;"
              >
                <p class="text-sm font-semibold text-near-black mb-0.5">
                  {label}
                </p>
                <p class="text-xs" style="color: rgba(28,26,24,0.55);">
                  {desc}
                </p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
});

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      class="rounded-xl px-5 py-5"
      style="background-color: #fff; border: 1px solid #e0dbd3;"
    >
      <p class="text-3xl text-primary font-bold mb-1">
        {value}
      </p>
      <p class="text-sm" style="color: rgba(28,26,24,0.6);">
        {label}
      </p>
    </div>
  );
}

function QuickAction(
  { href, label, description }: {
    href: string;
    label: string;
    description: string;
  },
) {
  return (
    <a
      f-client-nav={false}
      href={href}
      class="flex flex-col px-5 py-4 rounded-xl border font-medium transition-colors hover:border-[#c4853a]/40 hover:bg-[#fdf6ee]"
      style="border-color: #e0dbd3; background-color: #fff;"
    >
      <p class="text-sm font-semibold text-near-black mb-0.5">{label}</p>
      <p class="text-xs" style="color: rgba(28,26,24,0.55);">{description}</p>
    </a>
  );
}
