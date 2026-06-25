import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getGroupBySlug } from "@/utils/db/groups.ts";
import { getUpcomingGroupEvents } from "@/utils/db/group-events.ts";
import type { GroupEventSummary } from "@/utils/db/group-events.ts";
import { getRegisteredEventIds } from "@/utils/db/group-registrations.ts";
import { isSiteAdmin } from "@/utils/auth.ts";
import { renderMarkdown } from "@/utils/markdown.ts";

import { naiveDatetimeToDate } from "@/utils/temporal.ts";
import GroupEventRegistrationForm from "@/islands/GroupEventRegistrationForm.tsx";
import type { GroupDetail } from "@/utils/db/groups.ts";

interface PageData {
  group: GroupDetail;
  isMember: boolean;
  isLoggedIn: boolean;
  isGroupAdmin: boolean;
  upcomingEvents: GroupEventSummary[];
  /** Event IDs the logged-in user is already registered for (status='registered'). */
  registeredEventIds: string[];
  userFirstName: string;
  userLastName: string;
  userEmail: string;
}

export const handler = define.handlers<PageData>({
  async GET(ctx) {
    const { slug } = ctx.params;

    const group = await getGroupBySlug(slug, ctx.state);
    if (!group) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/groups/" },
      });
    }

    // Use ctx.state.user populated by root _middleware.ts
    const user = ctx.state.user;
    let isMember = false;
    let isGroupAdmin = false;

    if (user) {
      const db = ctx.state.supabaseClient!;
      const [memberRes, siteAdmin] = await Promise.all([
        db
          .from("group_memberships")
          .select("role")
          .eq("group_id", group.id)
          .eq("profile_id", user.id)
          .eq("status", "active")
          .maybeSingle(),
        isSiteAdmin(user.id),
      ]);
      if (memberRes.data) {
        isMember = true;
        const role = (memberRes.data as { role: string }).role;
        isGroupAdmin = role === "group_owner" || role === "group_admin";
      }
      isGroupAdmin = isGroupAdmin || siteAdmin;
    }

    const upcomingEvents = await getUpcomingGroupEvents(group.id, ctx.state);
    const stateProfile = ctx.state.profile;

    // Fetch registration status for all upcoming events in one query (logged-in only).
    const registeredEventIds = user
      ? await getRegisteredEventIds(
        user.id,
        upcomingEvents.map((e) => e.id),
        ctx.state,
      )
      : [];

    return page({
      group,
      isMember,
      isLoggedIn: user !== null,
      isGroupAdmin,
      upcomingEvents,
      registeredEventIds,
      userFirstName: stateProfile?.name_first ?? "",
      userLastName: stateProfile?.name_last ?? "",
      userEmail: stateProfile?.email ?? "",
    });
  },
});

export default define.page<typeof handler>(function GroupDetail({ data }) {
  const {
    group,
    isMember,
    isLoggedIn,
    isGroupAdmin,
    upcomingEvents,
    registeredEventIds,
    userFirstName,
    userLastName,
    userEmail,
  } = data as PageData;

  function fmtEventDate(date: string, tz: string): string {
    return new Intl.DateTimeFormat("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: tz,
      timeZoneName: "short",
    }).format(naiveDatetimeToDate(date, tz));
  }

  const shortDescription = group.description
    ? group.description.slice(0, 160)
    : `A Future Together community group${
      group.location_name ? ` in ${group.location_name}` : ""
    }.`;

  return (
    <>
      <Head>
        <title>{group.name} — Future Together</title>
        <meta name="description" content={shortDescription} />
        <meta property="og:title" content={`${group.name} — Future Together`} />
        <meta property="og:description" content={shortDescription} />
        <meta property="og:image" content={group.cover_url} />
      </Head>

      {/* Hero: cover image with gradient overlay */}
      <section
        class="text-white relative"
        style={`background-image: linear-gradient(rgba(26,95,110,0.82), rgba(26,95,110,0.82)), url('${group.cover_url}'); background-size: cover; background-position: center; min-height: 280px;`}
      >
        <div class="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          {group.tier && (
            <p
              class="text-xs font-semibold uppercase tracking-widest mb-3"
              style="color: rgba(255,255,255,0.6);"
            >
              {group.tier} group
            </p>
          )}
          <h1 class="text-3xl sm:text-4xl font-bold mb-3">{group.name}</h1>
          {group.location_name && (
            <p
              class="text-lg"
              style="color: rgba(255,255,255,0.75);"
            >
              {group.location_name}
            </p>
          )}
        </div>
      </section>

      {/* Main content */}
      <section class="py-12 sm:py-16 bg-warm-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main: description + long-form content */}
            <div class="lg:col-span-2 space-y-8">
              {/* Description */}
              {group.description && (
                <div>
                  <h2 class="text-xl font-bold text-near-black mb-3">
                    About this group
                  </h2>
                  <div
                    class="prose prose-teal max-w-none"
                    // deno-lint-ignore react-no-danger
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(group.description),
                    }}
                  />
                </div>
              )}

              {/* Upcoming events */}
              <div>
                <h2 class="text-xl font-bold text-near-black mb-4">
                  Upcoming events
                </h2>
                {upcomingEvents.length === 0
                  ? (
                    <p class="text-sm" style="color: rgba(28,26,24,0.55);">
                      No upcoming events — join to stay informed.
                    </p>
                  )
                  : (
                    <div class="space-y-6">
                      {upcomingEvents.map((ev) => (
                        <div
                          key={ev.id}
                          class="rounded-2xl p-5"
                          style="background:white;border:1px solid #e5e7eb;"
                        >
                          {/* Date + title */}
                          <p class="text-xs text-primary font-semibold uppercase tracking-wide mb-1">
                            {fmtEventDate(
                              ev.event_date,
                              ev.timezone ?? "Australia/Sydney",
                            )}
                          </p>
                          <h3 class="text-base font-bold text-near-black mb-1">
                            {ev.title || "Event"}
                          </h3>
                          {ev.duration_minutes && (
                            <p
                              class="text-xs mb-3"
                              style="color:rgba(28,26,24,0.55);"
                            >
                              {ev.duration_minutes} min
                              {ev.location_name
                                ? ` · ${ev.location_name}`
                                : ev.meeting_link
                                ? " · Online"
                                : ""}
                            </p>
                          )}

                          {/* Registration */}
                          {ev.is_registration_required
                            ? (
                              <GroupEventRegistrationForm
                                groupSlug={group.slug}
                                eventId={ev.id}
                                eventTitle={ev.title || "Event"}
                                isLoggedIn={isLoggedIn}
                                userIsRegistered={registeredEventIds.includes(
                                  ev.id,
                                )}
                                userFirstName={userFirstName}
                                userLastName={userLastName}
                                userEmail={userEmail}
                              />
                            )
                            : ev.meeting_link
                            ? (
                              <a
                                href={ev.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="inline-block px-4 py-2 text-sm font-semibold text-white bg-primary rounded-xl"
                              >
                                Join event &rarr;
                              </a>
                            )
                            : null}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            {/* Sidebar: join panel + short metadata */}
            <div class="lg:col-span-1">
              <div class="sticky top-6 space-y-4">
                {/* Join panel */}
                <div
                  class="rounded-2xl p-6"
                  style="background-color: #eef5f7; border: 1px solid #d0e4e7;"
                >
                  {/* Member count */}
                  <p
                    class="text-sm font-medium mb-4"
                    style="color: rgba(28,26,24,0.6);"
                  >
                    {group.member_count === 1
                      ? "1 member"
                      : `${group.member_count} members`}
                  </p>

                  {isGroupAdmin
                    ? (
                      /* Site admin or group admin/owner */
                      <a
                        href={`/groups/${group.slug}/admin/`}
                        class="block text-center w-full px-6 py-3 font-semibold bg-primary rounded-xl text-white transition-opacity hover:opacity-90"
                      >
                        Manage group &rarr;
                      </a>
                    )
                    : isMember
                    ? (
                      /* Already a member */
                      <div class="space-y-3">
                        <div
                          class="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl"
                          style="background-color: #d4edda; color: #155724;"
                        >
                          <span>You're a member ✓</span>
                        </div>
                        <a
                          href="/account/groups/"
                          class="block text-center text-sm font-medium text-primary hover:underline"
                        >
                          Manage your membership &rarr;
                        </a>
                      </div>
                    )
                    : isLoggedIn
                    ? (
                      /* Logged in, not a member — POST form */
                      <form
                        method="POST"
                        action={`/api/groups/${group.slug}/join`}
                      >
                        <button
                          type="submit"
                          class="w-full px-6 py-3 font-semibold rounded-xl bg-accent text-white transition-opacity hover:opacity-90"
                        >
                          Join this group
                        </button>
                      </form>
                    )
                    : (
                      /* Not logged in — redirect to /join */
                      <a
                        href={`/join?next=/groups/${group.slug}/&group_id=${group.id}`}
                        class="block text-center w-full px-6 py-3 font-semibold rounded-xl bg-accent text-white transition-opacity hover:opacity-90"
                      >
                        Join this group
                      </a>
                    )}

                  <p
                    class="mt-4 text-xs text-center"
                    style="color: rgba(28,26,24,0.5);"
                  >
                    Free to join. No spam.
                  </p>
                </div>

                {/* Location details */}
                {(group.location_suburb || group.location_region ||
                  group.location_state) && (
                  <div
                    class="rounded-2xl p-5"
                    style="background-color: #eef5f7; border: 1px solid #d0e4e7;"
                  >
                    <h3
                      class="text-xs font-semibold uppercase tracking-wide mb-1"
                      style="color: rgba(28,26,24,0.5);"
                    >
                      Location
                    </h3>
                    <p class="text-sm" style="color: rgba(28,26,24,0.8);">
                      {[
                        group.location_suburb,
                        group.location_region,
                        group.location_state,
                        group.location_country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                )}

                {/* External website */}
                {group.website_url && (
                  <div
                    class="rounded-2xl p-5"
                    style="background-color: #eef5f7; border: 1px solid #d0e4e7;"
                  >
                    <h3
                      class="text-xs font-semibold uppercase tracking-wide mb-1"
                      style="color: rgba(28,26,24,0.5);"
                    >
                      Website
                    </h3>
                    <a
                      href={group.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-sm text-accent underline break-all"
                    >
                      {group.website_url}
                    </a>
                  </div>
                )}

                {/* Tags */}
                {group.tags.length > 0 && (
                  <div
                    class="rounded-2xl p-5"
                    style="background-color: #eef5f7; border: 1px solid #d0e4e7;"
                  >
                    <h3
                      class="text-xs font-semibold uppercase tracking-wide mb-3"
                      style="color: rgba(28,26,24,0.5);"
                    >
                      Topics
                    </h3>
                    <div class="flex flex-wrap gap-2">
                      {group.tags.map((tag: string) => (
                        <span
                          key={tag}
                          class="text-sm px-3 py-1 rounded-full"
                          style="background-color: #fdf6ee; color: #c4853a; border: 1px solid #f0dfc0;"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
});
