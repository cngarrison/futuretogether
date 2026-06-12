import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getGroupMembers } from "@/utils/db/group-members.ts";
import type { GroupMember } from "@/utils/db/group-members.ts";
import MemberManagement from "@/islands/MemberManagement.tsx";

interface PageData {
  groupName: string;
  groupSlug: string;
  groupId: string;
  members: GroupMember[];
  optedOutCount: number;
  totalActiveCount: number;
  isOwner: boolean;
}

export const handler = define.handlers<PageData>({
  async GET(ctx) {
    const group = ctx.state.group!;
    const membership = ctx.state.membership;
    const isOwner = membership?.role === "group_owner" ||
      ctx.state.isSiteAdminBypass === true;

    const db = ctx.state.supabaseClient!;
    const [members, optInRes, totalActiveRes] = await Promise.all([
      getGroupMembers(group.id, ctx.state),
      db
        .from("group_memberships")
        .select("*", { count: "exact", head: true })
        .eq("group_id", group.id)
        .eq("status", "active")
        .eq("email_opt_in", true),
      db
        .from("group_memberships")
        .select("*", { count: "exact", head: true })
        .eq("group_id", group.id)
        .eq("status", "active"),
    ]);

    const totalActiveCount = totalActiveRes.count ?? 0;
    const optedInCount = optInRes.count ?? 0;
    const optedOutCount = Math.max(0, totalActiveCount - optedInCount);

    return page({
      groupName: group.name,
      groupSlug: group.slug,
      groupId: group.id,
      members,
      optedOutCount,
      totalActiveCount,
      isOwner,
    });
  },
});

export default define.page<typeof handler>(function MembersPage({ data }) {
  const {
    groupName,
    groupSlug,
    groupId,
    members,
    optedOutCount,
    totalActiveCount,
    isOwner,
  } = data as PageData;

  const activeCount = members.filter((m) => m.status === "active").length;
  const adminCount = members.filter((m) =>
    m.status === "active" &&
    (m.role === "group_admin" || m.role === "group_owner")
  ).length;
  const pendingCount = members.filter((m) => m.status === "pending").length;

  return (
    <>
      <Head>
        <title>Members — {groupName} — Future Together</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Header */}
        <div class="mb-6">
          <h1 class="text-2xl sm:text-3xl font-bold text-near-black mb-1">
            Members
          </h1>
          <p class="text-sm" style="color: rgba(28,26,24,0.55);">
            Manage who belongs to {groupName}.
          </p>
        </div>

        {/* Stats row */}
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {/* Active */}
          <div class="rounded-xl p-4" style="background-color:#eef5f7;">
            <div class="text-3xl font-bold mb-1" style="color:#1a5f6e;">
              {activeCount}
            </div>
            <div class="text-sm text-gray-600">Active</div>
          </div>
          {/* Admins */}
          <div class="rounded-xl p-4 bg-amber-50">
            <div class="text-3xl font-bold text-amber-600 mb-1">
              {adminCount}
            </div>
            <div class="text-sm text-gray-600">Admins</div>
          </div>
          {/* Pending */}
          <div
            class="rounded-xl p-4"
            style={pendingCount > 0
              ? "background:#fff8e6;"
              : "background:#f9fafb;"}
          >
            <div
              class="text-3xl font-bold mb-1"
              style={pendingCount > 0 ? "color:#c4853a;" : "color:#6b7280;"}
            >
              {pendingCount}
            </div>
            <div class="text-sm text-gray-600">Pending</div>
          </div>
          {/* Email opted in */}
          <div class="rounded-xl p-4 bg-gray-50">
            <div class="text-3xl font-bold text-gray-600 mb-1">
              {totalActiveCount - optedOutCount}
            </div>
            <div class="text-sm text-gray-600">Email opt-in</div>
          </div>
        </div>

        {/* Interactive member table island */}
        <MemberManagement
          groupSlug={groupSlug}
          groupId={groupId}
          members={members}
          optedOutCount={optedOutCount}
          totalActiveCount={totalActiveCount}
          isOwner={isOwner}
        />
      </div>
    </>
  );
});
