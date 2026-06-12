import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getAccountMemberships } from "@/utils/db/group-members.ts";
import type { AccountMembership } from "@/utils/db/group-members.ts";
import { getProfileUpcomingRegistrations } from "@/utils/db/group-registrations.ts";
import type { ProfileRegistration } from "@/utils/db/group-registrations.ts";
import AccountGroupsPage from "@/islands/AccountGroupsPage.tsx";

export interface AccountGroupsData {
  memberships: AccountMembership[];
  registrations: ProfileRegistration[];
}

// Type aliases used by AccountGroupsPage island
export type MembershipRow = AccountMembership;
export type RegistrationRow = ProfileRegistration;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const handler = define.handlers<AccountGroupsData>({
  async GET(ctx) {
    const user = ctx.state.user!;
    const profileId = user.id;

    const [memberships, registrations] = await Promise.all([
      getAccountMemberships(profileId, ctx.state),
      getProfileUpcomingRegistrations(profileId, ctx.state),
    ]);

    return page<AccountGroupsData>({ memberships, registrations });
  },
});

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default define.page<typeof handler>(
  function AccountGroupsIndexPage({ data }) {
    const isEmpty = data.memberships.length === 0 &&
      data.registrations.length === 0;

    return (
      <>
        <Head>
          <title>Your groups — Future Together</title>
          <meta
            name="description"
            content="Manage your Future Together group memberships and upcoming event registrations."
          />
        </Head>
        <div class="min-h-screen py-12 px-4 bg-warm-white">
          <div class="max-w-2xl mx-auto">
            {/* Back link */}
            <div class="mb-8">
              <a
                href="/account/"
                class="text-sm font-medium text-primary inline-flex items-center gap-1 hover:underline"
              >
                ← Back to your account
              </a>
            </div>

            <h1 class="text-3xl font-bold text-primary mb-8">Your groups</h1>

            {isEmpty
              ? (
                <div class="text-center py-16 text-gray-500">
                  <p class="mb-4">You're not a member of any groups yet.</p>
                  <a
                    href="/groups"
                    class="inline-block text-sm font-medium text-amber-600 hover:underline"
                  >
                    Browse groups →
                  </a>
                </div>
              )
              : (
                <AccountGroupsPage
                  memberships={data.memberships}
                  registrations={data.registrations}
                />
              )}
          </div>
        </div>
      </>
    );
  },
);
