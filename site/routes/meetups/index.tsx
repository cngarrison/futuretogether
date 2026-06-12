import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { naiveDatetimeToDate } from "@/utils/temporal.ts";
import {
  getFeaturedGroupEvents,
  getNextAvailableEvent,
  getPastRecurringEvents,
  getPastSpecialEvents,
  getUpcomingSpecialEvents,
} from "@/utils/db/group-events.ts";
import type {
  EventConfig,
  FeaturedGroupEvent,
} from "@/utils/db/group-events.ts";

// The "Discuss Our Future" meetup alternates start times each month
// to accommodate participants in different time zones:
//   - Even months: 10:00 AM AEDT (better for Europe / morning crowd)
//   - Odd months: 6:00 PM AEDT (better for evening / after-work attendance)
// The actual time for each session is defined in the event YAML files.

const RECURRING_SLUG = "discuss-our-future";
const RECURRING_PAST_LIMIT = 3;

// Format a full date + time string for upcoming events.
// dateStr is a naive local datetime (ft-07i.15) — use naiveDatetimeToDate for correct conversion.
function formatEventDateTime(
  dateStr: string,
  timezone: string,
): string {
  try {
    const tz = timezone ?? "Australia/Sydney";
    return naiveDatetimeToDate(dateStr, tz).toLocaleString("en-AU", {
      timeZone: tz,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    });
  } catch {
    return dateStr;
  }
}

// Format a short date for past events (no time needed).
function formatPastEventDate(
  dateStr: string,
  timezone: string,
): string {
  try {
    const tz = timezone ?? "Australia/Sydney";
    return naiveDatetimeToDate(dateStr, tz).toLocaleString("en-AU", {
      timeZone: tz,
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// Format just the month + year for the "since" note.
function formatMonthYear(dateStr: string, timezone: string): string {
  try {
    const tz = timezone ?? "Australia/Sydney";
    return naiveDatetimeToDate(dateStr, tz).toLocaleString("en-AU", {
      timeZone: tz,
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default define.page(async function Meetups(ctx) {
  // Load all data sources in parallel for fast page renders
  const [
    nextEvent,
    upcomingSpecial,
    pastSpecial,
    pastRecurring,
    featuredGroupEvents,
  ] = await Promise
    .all([
      getNextAvailableEvent(RECURRING_SLUG, ctx.state),
      getUpcomingSpecialEvents(RECURRING_SLUG, ctx.state),
      getPastSpecialEvents(RECURRING_SLUG, ctx.state),
      getPastRecurringEvents(RECURRING_SLUG, RECURRING_PAST_LIMIT, ctx.state),
      getFeaturedGroupEvents(ctx.state),
    ]);

  const nextEventDisplay = nextEvent?.date
    ? formatEventDateTime(
      nextEvent.date,
      nextEvent.timezone ?? "Australia/Sydney",
    )
    : null;

  const hasPastEvents = pastSpecial.length > 0 ||
    pastRecurring.events.length > 0;

  return (
    <>
      <Head>
        <title>Meetups — Future Together</title>
        <meta
          name="description"
          content="Monthly online meetups for people paying attention to AI and technological change. Free, honest, no agenda. Third Wednesday of each month."
        />
        <meta property="og:image" content="/img/discuss-our-future-card.webp" />
      </Head>

      {/* ------------------------------------------------------------------ */}
      {/* Hero — Discuss Our Future recurring event                           */}
      {/* ------------------------------------------------------------------ */}
      <section class="text-white bg-primary">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
          <p
            class="text-sm font-semibold uppercase tracking-widest mb-4"
            style="color: rgba(255,255,255,0.6)"
          >
            Monthly &middot; Online &middot; Free
          </p>
          <h1 class="text-4xl sm:text-5xl font-bold mb-5">
            The Discuss Our Future Meetup
          </h1>
          <p
            class="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style="color: rgba(255,255,255,0.8);"
          >
            Every month, a group of people gather online to talk honestly about
            what AI is doing to society — and what we can do about it. No
            product pitch. No agenda. Just people figuring this out together.
          </p>
          <a
            href="/events/discuss-our-future"
            class="inline-block px-8 py-3.5 text-white font-semibold bg-accent rounded-xl transition-opacity hover:opacity-90"
          >
            Register for the Next Meetup &rarr;
          </a>
        </div>
        <div class="max-w-5xl mx-auto px-4 sm:px-6 mt-10">
          <img
            src="/img/meetup-group-lg.webp"
            alt="Future Together — monthly online meetup: people connecting across screens — our monthly online community meetup"
            class="w-full rounded-t-2xl"
            style="max-height: 300px; object-fit: cover; object-position: center;"
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Details strip                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section class="text-white bg-near-black">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <p
                class="text-xs uppercase tracking-widest mb-1"
                style="color: rgba(255,255,255,0.45);"
              >
                Next session
              </p>
              {nextEventDisplay
                ? (
                  <p class="font-semibold text-sm leading-snug">
                    {nextEventDisplay}
                  </p>
                )
                : <p class="font-semibold">Third Wednesday of the month</p>}
              <p
                class="text-xs mt-1.5"
                style="color: rgba(255,255,255,0.5);"
              >
                Time alternates monthly for different time zones
              </p>
            </div>
            <div>
              <p
                class="text-xs uppercase tracking-widest mb-1"
                style="color: rgba(255,255,255,0.45);"
              >
                Where
              </p>
              <p class="font-semibold">Online via Jitsi</p>
              <p
                class="text-sm mt-0.5"
                style="color: rgba(255,255,255,0.6);"
              >
                No account needed, no tracking
              </p>
              <p
                class="text-xs mt-1"
                style="color: rgba(255,255,255,0.4);"
              >
                Link sent after registration
              </p>
            </div>
            <div>
              <p
                class="text-xs uppercase tracking-widest mb-1"
                style="color: rgba(255,255,255,0.45);"
              >
                Cost
              </p>
              <p class="font-semibold">Free</p>
              <p
                class="text-sm mt-0.5"
                style="color: rgba(255,255,255,0.6);"
              >
                Always will be
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Special / one-off upcoming events (hidden when none)               */}
      {/* ------------------------------------------------------------------ */}
      {upcomingSpecial.length > 0 && (
        <section class="py-16 sm:py-20 bg-warm-white">
          <div class="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 class="text-3xl font-bold text-near-black mb-3">
              Special Events
            </h2>
            <p class="mb-10" style="color: rgba(28,26,24,0.65);">
              In addition to our monthly meetup, we occasionally run focused
              sessions on specific topics.
            </p>
            <div class="space-y-8">
              {upcomingSpecial.map((event: EventConfig) => {
                const dateDisplay = formatEventDateTime(
                  event.date,
                  event.timezone ?? "Australia/Sydney",
                );
                return (
                  <div
                    key={event.id}
                    class="rounded-2xl overflow-hidden"
                    style="border: 1px solid #d0e4e7; background: white;"
                  >
                    {/* Card header */}
                    <div class="px-6 pt-6 pb-5">
                      <div class="flex flex-wrap items-center gap-2 mb-3">
                        <span
                          class="text-xs font-semibold text-primary uppercase tracking-widest px-2.5 py-1 rounded-full"
                          style="background-color: #eef5f7;"
                        >
                          Special Event
                        </span>
                        {event.duration && (
                          <span
                            class="text-xs font-medium px-2.5 py-1 rounded-full bg-warm-white"
                            style="color: rgba(28,26,24,0.6);"
                          >
                            {event.duration} min
                          </span>
                        )}
                      </div>
                      <h3 class="text-xl font-bold text-near-black mb-2 leading-snug">
                        {event.title}
                      </h3>
                      <p class="text-sm font-medium text-primary mb-4">
                        {dateDisplay}
                      </p>
                      {/* Description — first paragraph only to keep cards compact */}
                      <p
                        class="leading-relaxed text-sm"
                        style="color: rgba(28,26,24,0.75);"
                      >
                        {event.description.split("\n\n")[0]}
                      </p>
                    </div>

                    {/* Topics list */}
                    {event.topics && event.topics.length > 0 && (
                      <div
                        class="px-6 py-4"
                        style="border-top: 1px solid #eef5f7; background-color: #f9fbfc;"
                      >
                        <p
                          class="text-xs font-semibold uppercase tracking-widest mb-3"
                          style="color: rgba(28,26,24,0.4);"
                        >
                          What we'll cover
                        </p>
                        <ul class="space-y-1.5">
                          {event.topics.map((topic: string) => (
                            <li
                              key={topic}
                              class="text-sm"
                              style="color: rgba(28,26,24,0.75);"
                            >
                              {topic}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Card footer */}
                    <div
                      class="px-6 py-4 flex flex-wrap items-center justify-between gap-4"
                      style="border-top: 1px solid #eef5f7;"
                    >
                      {event.presentedBy && (
                        <p
                          class="text-sm"
                          style="color: rgba(28,26,24,0.5);"
                        >
                          Presented by {event.presentedBy}
                        </p>
                      )}
                      <a
                        href={`/events/${event.slug}`}
                        class="inline-block px-6 py-2.5 text-white text-sm font-semibold bg-accent rounded-xl transition-opacity hover:opacity-90 ml-auto"
                      >
                        Register — it's free &rarr;
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Community Events (featured group events)                          */}
      {/* ------------------------------------------------------------------ */}
      {(featuredGroupEvents as FeaturedGroupEvent[]).length > 0 && (
        <section class="py-16 sm:py-20 bg-warm-white">
          <div class="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 class="text-3xl font-bold text-near-black mb-3">
              Community Events
            </h2>
            <p class="mb-10" style="color: rgba(28,26,24,0.65);">
              Events hosted by local Future Together groups.
            </p>
            <div class="space-y-8">
              {(featuredGroupEvents as FeaturedGroupEvent[]).map(
                (event: FeaturedGroupEvent) => (
                  <div
                    key={event.id}
                    class="rounded-2xl overflow-hidden"
                    style="border: 1px solid #d0e4e7; background: white;"
                  >
                    <div class="px-6 pt-6 pb-5">
                      <div class="flex flex-wrap items-center gap-2 mb-3">
                        <span
                          class="text-xs font-semibold text-[#1a5f6e] uppercase tracking-widest px-2.5 py-1 rounded-full"
                          style="background-color: #eef5f7;"
                        >
                          Community Event &mdash; {event.group_name}
                        </span>
                        {event.location_type && (
                          <span
                            class="text-xs font-medium px-2.5 py-1 rounded-full bg-warm-white capitalize"
                            style="color: rgba(28,26,24,0.6);"
                          >
                            {event.location_type === "physical"
                              ? "In Person"
                              : event.location_type.charAt(0).toUpperCase() +
                                event.location_type.slice(1)}
                          </span>
                        )}
                        {event.duration_minutes && (
                          <span
                            class="text-xs font-medium px-2.5 py-1 rounded-full bg-warm-white"
                            style="color: rgba(28,26,24,0.6);"
                          >
                            {event.duration_minutes} min
                          </span>
                        )}
                      </div>
                      <h3 class="text-xl font-bold text-near-black mb-2">
                        {event.title}
                      </h3>
                      <p class="text-sm font-medium text-[#1a5f6e] mb-4">
                        {formatEventDateTime(event.event_date, event.timezone)}
                      </p>
                      <p
                        class="leading-relaxed text-sm"
                        style="color: rgba(28,26,24,0.75);"
                      >
                        {event.description.split("\n\n")[0]}
                      </p>
                    </div>
                    <div
                      class="px-6 py-4 flex justify-end"
                      style="border-top: 1px solid #eef5f7;"
                    >
                      <a
                        href={`/groups/${event.group_slug}/`}
                        class="inline-block px-6 py-2.5 text-white text-sm font-semibold bg-[#1a5f6e] rounded-xl transition-opacity hover:opacity-90"
                      >
                        View Group &rarr;
                      </a>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* What happens at a meetup                                           */}
      {/* ------------------------------------------------------------------ */}
      <section class="py-20 sm:py-24 bg-warm-white">
        <div class="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 class="text-3xl font-bold text-near-black mb-10">
            What happens at a meetup?
          </h2>
          <div class="space-y-8">
            {[
              {
                n: 1,
                color: "primary",
                title: "A brief update on what's changed",
                body:
                  "We start with what\u2019s happened in AI since the last meetup \u2014 the things that matter, explained clearly. No jargon, no assumption you\u2019re a technical person.",
              },
              {
                n: 2,
                color: "primary",
                title: "A focused topic or question",
                body:
                  "Each session has a theme. Past topics have included: how AI is changing knowledge work, what community resilience looks like, and how to think about AI without the hype or the doom.",
              },
              {
                n: 3,
                color: "accent",
                title: "Open discussion",
                body:
                  "This is the part people keep coming back for. Questions, challenges, personal experiences from different industries and countries. A real conversation, not a presentation.",
              },
            ].map((step) => (
              <div class="flex gap-5" key={step.n}>
                <div
                  class={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm bg-${step.color}`}
                >
                  {step.n}
                </div>
                <div>
                  <h3 class="font-semibold text-lg text-near-black mb-1">
                    {step.title}
                  </h3>
                  <p
                    style="color: rgba(28,26,24,0.7);"
                    class="leading-relaxed"
                  >
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Past Events (replaces hardcoded "Past Resources")                  */}
      {/* ------------------------------------------------------------------ */}
      {hasPastEvents && (
        <section
          class="py-16 sm:py-20"
          style="background-color: #eef5f7; border-top: 1px solid #d0e4e7; border-bottom: 1px solid #d0e4e7;"
        >
          <div class="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 class="text-2xl font-bold text-near-black mb-3">
              Past Events
            </h2>
            <p class="mb-10" style="color: rgba(28,26,24,0.7);">
              A record of our community in action. Where a slideshow is
              available, you can browse it below.
            </p>

            {/* Special / one-off past events — shown as fuller cards */}
            {pastSpecial.length > 0 && (
              <div class="mb-10 space-y-4">
                {pastSpecial.map((event: EventConfig) => (
                  <div
                    key={event.id}
                    class="rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    style="background: white; border: 1px solid #d0e4e7;"
                  >
                    <div>
                      <p class="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
                        Special Event
                      </p>
                      <p class="font-semibold text-near-black">
                        {event.title}
                      </p>
                      <p
                        class="text-sm mt-0.5"
                        style="color: rgba(28,26,24,0.5);"
                      >
                        {formatPastEventDate(
                          event.date,
                          event.timezone ?? "Australia/Sydney",
                        )}
                      </p>
                    </div>
                    {event.slideshowUrl && (
                      <a
                        href={`/meetups/${event.slug}?id=${event.id}`}
                        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-sm font-semibold text-white transition-opacity hover:opacity-90 flex-shrink-0"
                      >
                        What we covered &rarr;
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Recurring (Discuss Our Future) past sessions */}
            {pastRecurring.events.length > 0 && (
              <div>
                <p
                  class="text-xs font-semibold uppercase tracking-widest mb-4"
                  style="color: rgba(28,26,24,0.4);"
                >
                  Monthly Sessions
                </p>
                <div class="space-y-3">
                  {pastRecurring.events.map((event: EventConfig) => (
                    <div
                      key={event.id}
                      class="rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      style="background: white; border: 1px solid #d0e4e7;"
                    >
                      <div>
                        <p class="font-semibold text-near-black">
                          Discuss Our Future
                        </p>
                        <p
                          class="text-sm mt-0.5"
                          style="color: rgba(28,26,24,0.5);"
                        >
                          {formatPastEventDate(
                            event.date,
                            event.timezone ?? "Australia/Sydney",
                          )}
                        </p>
                      </div>
                      {event.slideshowUrl && (
                        <a
                          href={`/meetups/${event.slug}?id=${event.id}`}
                          class="inline-flex items-center gap-2 px-4 py-2 bg-primary rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 flex-shrink-0"
                        >
                          What we covered &rarr;
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                {/* "...plus N more" note when there are older sessions beyond the limit */}
                {pastRecurring.total > RECURRING_PAST_LIMIT && (
                  <p
                    class="text-sm mt-4 pl-1"
                    style="color: rgba(28,26,24,0.45);"
                  >
                    &hellip;plus {pastRecurring.total - RECURRING_PAST_LIMIT}
                    {" "}
                    earlier
                    session{pastRecurring.total - RECURRING_PAST_LIMIT === 1
                      ? ""
                      : "s"} running since {pastRecurring.earliestDate
                      ? formatMonthYear(
                        pastRecurring.earliestDate,
                        "Australia/Sydney",
                      )
                      : "our first meetup"}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Local Groups discovery                                             */}
      {/* ------------------------------------------------------------------ */}
      <section class="py-16 sm:py-20 bg-warm-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6">
          <div
            class="rounded-2xl px-8 py-10 sm:px-12 sm:py-12 flex flex-col sm:flex-row sm:items-center gap-8"
            style="background: white; border: 1px solid #d0e4e7;"
          >
            <div class="flex-1">
              <p class="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
                Local Groups
              </p>
              <h2 class="text-2xl sm:text-3xl font-bold text-near-black mb-4 leading-snug">
                Find a group near you
              </h2>
              <p class="leading-relaxed" style="color: rgba(28,26,24,0.7);">
                The monthly meetup is global — but sometimes you want a smaller
                room. Local groups meet in person, in your city or region, to
                continue the conversation face to face.
              </p>
            </div>
            <div class="flex-shrink-0">
              <a
                href="/groups"
                class="inline-block px-7 py-3.5 text-white font-semibold bg-primary rounded-xl transition-opacity hover:opacity-90 whitespace-nowrap"
              >
                Find a group &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section class="py-20 sm:py-24 text-center text-white bg-primary">
        <div class="max-w-xl mx-auto px-4 sm:px-6">
          <h2 class="text-3xl font-bold mb-4">Ready to join us?</h2>
          <p class="mb-8 text-lg" style="color: rgba(255,255,255,0.8);">
            Registration takes 30 seconds. The conversation is worth it.
          </p>
          <a
            href="/events/discuss-our-future"
            class="inline-block px-8 py-3.5 text-white font-semibold bg-accent rounded-xl transition-opacity hover:opacity-90"
          >
            Register — it's free &rarr;
          </a>
        </div>
      </section>
    </>
  );
});
