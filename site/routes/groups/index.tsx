import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import type { GroupSummary } from "@/utils/db/groups.ts";
import { getPublicGroups } from "@/utils/db/groups.ts";

export default define.page(async function GroupsIndex(ctx) {
  const groups = await getPublicGroups(ctx.state);

  return (
    <>
      <Head>
        <title>Groups — Future Together</title>
        <meta
          name="description"
          content="Browse active Future Together local groups. Find a community near you or start your own."
        />
        <meta property="og:title" content="Groups — Future Together" />
        <meta
          property="og:description"
          content="Browse active Future Together local groups. Find a community near you or start your own."
        />
        <meta property="og:image" content="/img/og-groups.webp" />
      </Head>

      {/* Hero */}
      <section class="text-white bg-primary">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h1 class="text-4xl sm:text-5xl font-bold mb-4">
            Find a group near you
          </h1>
          <p
            class="text-lg leading-relaxed mb-8 max-w-2xl"
            style="color: rgba(255,255,255,0.8);"
          >
            Future Together groups are communities of people who want to
            understand AI's impact and face the future together — in living
            rooms, cafés, and community halls around the world.
          </p>
          <a
            href="/groups/start"
            class="inline-block px-7 py-3 font-semibold rounded-xl bg-accent text-white transition-opacity hover:opacity-90"
          >
            Start a group &rarr;
          </a>
        </div>
      </section>

      {/* Filter section — stubbed for Phase B */}
      <section
        class="py-6"
        style="background-color: #eef5f7; border-bottom: 1px solid #d0e4e7;"
      >
        <div class="max-w-4xl mx-auto px-4 sm:px-6">
          {
            /* TODO Phase B: country/state filters
              Hook: pass { country, state } params to getPublicGroups()
              State managed via URL search params (?country=AU&state=NSW)
              Component: FilterBar island in site/islands/groups/FilterBar.tsx */
          }
          <p class="text-sm font-medium" style="color: rgba(28,26,24,0.6);">
            Browse all active Future Together groups
          </p>
        </div>
      </section>

      {/* Groups grid */}
      <section class="py-12 sm:py-16 bg-warm-white">
        <div class="max-w-6xl mx-auto px-4 sm:px-6">
          {groups.length === 0
            ? <EmptyState />
            : (
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            )}

          {/* CTA banner below grid */}
          {groups.length > 0 && (
            <div
              class="mt-16 rounded-2xl p-8 text-center"
              style="background-color: #eef5f7; border: 1px solid #d0e4e7;"
            >
              <h2 class="text-xl font-bold text-near-black mb-3">
                Don't see a group near you?
              </h2>
              <p
                class="mb-6 leading-relaxed"
                style="color: rgba(28,26,24,0.7);"
              >
                Start a conversation in your community. You don't need to be an
                expert — you just need a room and a question.
              </p>
              <a
                href="/groups/start"
                class="inline-block px-7 py-3 font-semibold rounded-xl bg-accent text-white transition-opacity hover:opacity-90"
              >
                Start a group in your community &rarr;
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  );
});

// ---------------------------------------------------------------------------
// GroupCard component
// ---------------------------------------------------------------------------

function GroupCard({ group }: { group: GroupSummary }) {
  const visibleTags = group.tags.slice(0, 3);

  return (
    <div
      class="rounded-2xl overflow-hidden bg-white flex flex-col"
      style="border: 1px solid #d0e4e7;"
    >
      {/* Cover image */}
      <div class="relative h-48 overflow-hidden">
        <img
          src={group.cover_url}
          alt={group.name}
          class="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Card body */}
      <div class="flex flex-col flex-1 p-5">
        <h3 class="text-base font-bold text-primary mb-1 leading-snug">
          {group.name}
        </h3>

        {group.location_name && (
          <p class="text-sm mb-2" style="color: rgba(28,26,24,0.5);">
            {group.location_name}
          </p>
        )}

        {group.tagline && (
          <p
            class="text-sm leading-relaxed mb-3 flex-1"
            style="color: rgba(28,26,24,0.75);"
          >
            {group.tagline}
          </p>
        )}

        {/* Member count badge */}
        <div class="flex items-center gap-2 mb-3">
          <span
            class="text-xs font-medium px-2 py-0.5 rounded-full"
            style="background-color: #eef5f7; color: #1a5f6e;"
          >
            {group.member_count === 1
              ? "1 member"
              : `${group.member_count} members`}
          </span>
        </div>

        {/* Tags */}
        {visibleTags.length > 0 && (
          <div class="flex flex-wrap gap-1.5 mb-4">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                class="text-xs px-2 py-0.5 rounded-full"
                style="background-color: #fdf6ee; color: #c4853a; border: 1px solid #f0dfc0;"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer link */}
        <div class="mt-auto pt-3" style="border-top: 1px solid #f0f0ef;">
          <a
            href={`/groups/${group.slug}/`}
            class="text-sm font-semibold text-accent hover:underline"
          >
            View group &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmptyState component
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div class="text-center py-16">
      <p
        class="text-lg mb-2 font-semibold"
        style="color: rgba(28,26,24,0.5);"
      >
        No groups yet
      </p>
      <p class="mb-8" style="color: rgba(28,26,24,0.5);">
        Be the first to start a Future Together group.
      </p>
      <a
        href="/groups/start"
        class="inline-block px-7 py-3 font-semibold rounded-xl bg-accent text-white transition-opacity hover:opacity-90"
      >
        Apply to start a group &rarr;
      </a>
    </div>
  );
}
