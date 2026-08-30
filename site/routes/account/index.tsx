import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getMemberGroups } from "@/utils/db/group-members.ts";
import type { MemberGroupEntry } from "@/utils/db/group-members.ts";
import { getProfileUpcomingRegistrations } from "@/utils/db/group-registrations.ts";
import type { ProfileRegistration } from "@/utils/db/group-registrations.ts";
import { formatNaiveDatetime } from "@/utils/temporal.ts";
import AccountPage from "@/islands/AccountPage.tsx";

/**
 * /account/ — Member account management page
 *
 * Protected by account/_middleware.ts — ctx.state.user is always set here.
 *
 * Server-side data:
 *   Reads name_first, name_last, has_password from ctx.state.profile (populated by root middleware).
 *   Fetches active group memberships (name, slug, role) for the groups summary section.
 *
 * Interactive forms (profile + password) are handled by the AccountPage island.
 */

interface AccountData {
  nameFirst: string;
  nameLast: string;
  email: string;
  hasPassword: boolean;
  groups: MemberGroupEntry[];
  upcomingRegistrations: ProfileRegistration[];
}

export const handler = define.handlers<AccountData>({
  async GET(ctx) {
    const user = ctx.state.user!;
    const profile = ctx.state.profile;

    // Fetch active group memberships + upcoming registrations for the summary sections.
    const [groups, allRegistrations] = await Promise.all([
      getMemberGroups(user.id, ctx.state),
      getProfileUpcomingRegistrations(user.id, ctx.state),
    ]);

    return page({
      nameFirst: profile?.name_first ?? "",
      nameLast: profile?.name_last ?? "",
      email: user.email ?? "",
      hasPassword: profile?.has_password ?? false,
      groups,
      upcomingRegistrations: allRegistrations.slice(0, 2),
    });
  },
});

export default define.page<typeof handler>(function AccountIndexPage({ data }) {
  const displayName = [data.nameFirst, data.nameLast].filter(Boolean).join(" ");
  return (
    <>
      <Head>
        <title>Your account — Future Together</title>
        <meta
          name="description"
          content="Manage your Future Together account: update your name or change your password."
        />
      </Head>
      <div class="min-h-screen py-12 px-4 bg-warm-white">
        <div class="max-w-2xl mx-auto">
          {/* Back link */}
          <div class="mb-8">
            <a
              f-client-nav={false}
              href="/"
              class="text-sm font-medium text-primary inline-flex items-center gap-1 hover:underline"
            >
              ← Back to Future Together
            </a>
          </div>

          {/* Page heading */}
          <h1 class="text-3xl font-bold text-primary mb-1">
            Your account
          </h1>
          {displayName && (
            <p class="text-gray-500 mb-8">Welcome, {displayName}</p>
          )}
          {!displayName && <div class="mb-8" />}

          {/* Interactive forms (island) */}
          <AccountPage
            nameFirst={data.nameFirst}
            nameLast={data.nameLast}
            email={data.email}
            hasPassword={data.hasPassword}
          />

          {/* Upcoming events summary */}
          {data.upcomingRegistrations.length > 0 && (
            <div class="mt-10">
              <div class="flex items-baseline justify-between mb-3">
                <h2 class="text-lg font-semibold text-near-black">
                  Upcoming events
                </h2>
                <a
                  f-client-nav={false}
                  href="/account/groups/"
                  class="text-sm font-medium text-primary hover:underline"
                >
                  View all registrations →
                </a>
              </div>
              <ul class="space-y-2">
                {data.upcomingRegistrations.map((reg) => {
                  const dateStr = reg.eventDate
                    ? formatNaiveDatetime(
                      reg.eventDate,
                      reg.timezone,
                      {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      },
                    )
                    : "Date TBC";
                  return (
                    <li
                      key={reg.id}
                      class="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3 gap-3"
                    >
                      <div class="min-w-0">
                        <p class="font-medium text-near-black truncate">
                          {reg.eventTitle}
                        </p>
                        <p class="text-xs text-gray-500 mt-0.5">{dateStr}</p>
                      </div>
                      <a
                        f-client-nav={false}
                        href="/account/groups/"
                        class="shrink-0 text-xs font-medium text-primary hover:underline"
                      >
                        Manage
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Groups summary */}
          <div class="mt-10">
            <div class="flex items-baseline justify-between mb-3">
              <h2 class="text-lg font-semibold text-near-black">Your groups</h2>
              {data.groups.length > 0 && (
                <a
                  f-client-nav={false}
                  href="/account/groups/"
                  class="text-sm font-medium text-primary hover:underline"
                >
                  Manage groups &amp; registrations →
                </a>
              )}
            </div>

            {data.groups.length === 0
              ? (
                <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500">
                  You're not a member of any groups yet.{" "}
                  <a
                    f-client-nav={false}
                    href="/groups"
                    class="font-medium text-primary hover:underline"
                  >
                    Browse local groups →
                  </a>
                </div>
              )
              : (
                <ul class="space-y-2">
                  {data.groups.map((g) => (
                    <li
                      key={g.slug}
                      class="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3"
                    >
                      <a
                        f-client-nav={false}
                        href={`/groups/${g.slug}/`}
                        class="font-medium text-primary hover:underline"
                      >
                        {g.name}
                      </a>
                      <span
                        class={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          g.role === "group_owner"
                            ? "bg-amber-100 text-amber-800"
                            : g.role === "group_admin"
                            ? "bg-teal-100 text-teal-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {g.role === "group_owner"
                          ? "Owner"
                          : g.role === "group_admin"
                          ? "Admin"
                          : "Member"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

            {data.groups.length > 0 && (
              <p class="mt-3 text-xs text-gray-400">
                <a
                  f-client-nav={false}
                  href="/account/groups/"
                  class="hover:underline"
                >
                  Manage email preferences, event registrations and group
                  settings →
                </a>
              </p>
            )}
          </div>

          {/* Sign out link */}
          <div class="mt-8 text-center">
            <a
              f-client-nav={false}
              href="/logout"
              class="text-sm text-gray-400 hover:text-gray-600 hover:underline transition-colors"
            >
              Sign out
            </a>
          </div>
        </div>
      </div>
    </>
  );
});
