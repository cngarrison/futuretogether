import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";
import {
  getEventMoreInfoHtml,
  getNextAvailableEvent,
} from "@/utils/db/group-events.ts";
import { getRegistrationCount } from "@/utils/db/group-registrations.ts";
import EventMoreInfo from "@/islands/EventMoreInfo.tsx";
import EventRegistrationForm from "@/islands/EventRegistrationForm.tsx";
import EventDateTime from "@/islands/EventDateTime.tsx";
import { getTurnstileSiteKey } from "@/utils/turnstile.ts";

/**
 * Event registration page.
 * Uses an async page component (Fresh v2 pattern) to load server-side data
 * without needing a separate handler and ctx.render().
 */
export default define.page(async function EventPage({ params, state }) {
  const { eventSlug } = params;
  const event = await getNextAvailableEvent(eventSlug, state);
  const registrationCount = event
    ? await getRegistrationCount(event.id, state)
    : 0;
  const moreInfoHtml = event?.moreInfoPath
    ? await getEventMoreInfoHtml(event.moreInfoPath)
    : null;
  const turnstileSiteKey = getTurnstileSiteKey();

  // state.user is populated by the root _middleware.ts — no manual token resolution needed
  const user = state.user;

  if (!event) {
    return (
      <>
        <Head>
          <title>Event Not Available — Future Together</title>
        </Head>
        <section class="text-white bg-primary">
          <div class="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
            <h1 class="text-3xl font-bold mb-4">No upcoming events</h1>
            <p class="mb-8" style="color: rgba(255,255,255,0.75);">
              This event has ended or no future sessions are currently
              scheduled. Check back soon.
            </p>
            <a
              href="/meetups"
              class="inline-block px-6 py-3 text-white font-semibold bg-accent rounded-xl transition-opacity hover:opacity-90"
            >
              See all meetups
            </a>
          </div>
        </section>
      </>
    );
  }

  const spotsRemaining = event.capacity - registrationCount;

  return (
    <>
      <Head>
        <title>{event.title} — Future Together</title>
        <meta name="description" content={event.description} />
        <meta
          property="og:title"
          content={`${event.title} — Future Together`}
        />
        <meta property="og:description" content={event.description} />
        <meta property="og:type" content="event" />
      </Head>

      {/* Hero */}
      <section class="text-white bg-primary">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <p
            class="text-xs font-semibold uppercase tracking-widest mb-3"
            style="color: rgba(255,255,255,0.55);"
          >
            Meetup Event
          </p>
          <h1 class="text-3xl sm:text-4xl font-bold mb-4">{event.title}</h1>
          <div
            class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
            style="color: rgba(255,255,255,0.8);"
          >
            <EventDateTime
              date={event.date}
              timezone={event.timezone}
              showIcon
              iconClass="w-4 h-4 mr-1 inline-block"
              textClass=""
            />
            <span>
              &middot;&ensp; {event.duration} min &ensp;&middot;&ensp;{" "}
              {event.meetingLink && event.meetingLocation
                ? "Online + In Person"
                : event.meetingLink
                ? "Online"
                : "In Person"} &ensp;&middot;&ensp; Free
            </span>
          </div>
          {event.meetingLocation && (
            <p
              class="mt-1 text-sm flex items-center gap-1.5"
              style="color: rgba(255,255,255,0.75);"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="flex-shrink-0"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {event.meetingLocation}
            </p>
          )}
          {spotsRemaining > 0 && spotsRemaining <= 10 && (
            <p class="mt-3 text-sm font-semibold text-accent">
              Only {spotsRemaining} spot{spotsRemaining === 1 ? "" : "s"}{" "}
              remaining!
            </p>
          )}
        </div>
      </section>

      {/* Body: details + registration form */}
      <section class="bg-warm-white">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* Left: event details */}
            <div class="md:col-span-7 space-y-6">
              {event.posterImage && (
                <div
                  class="rounded-2xl overflow-hidden"
                  style="border: 1px solid #d0e4e7;"
                >
                  <img
                    src={event.posterImage}
                    alt={`Visual summary: ${event.title}`}
                    class="w-full h-auto"
                  />
                </div>
              )}

              <div
                class="bg-white rounded-2xl p-8"
                style="border: 1px solid #d0e4e7;"
              >
                <h2 class="text-xl font-bold text-near-black mb-4">
                  About this meetup
                </h2>
                <div
                  class="prose max-w-none space-y-3"
                  style="color: rgba(28,26,24,0.8);"
                >
                  {event.description.split("\n").map((
                    paragraph: string,
                    i: number,
                  ) => paragraph.trim() && <p key={i}>{paragraph}</p>)}
                </div>
              </div>

              {event.topics && event.topics.length > 0 && (
                <div
                  class="bg-white rounded-2xl p-8"
                  style="border: 1px solid #d0e4e7;"
                >
                  <h2 class="text-xl font-bold text-near-black mb-4">
                    What we’ll discuss
                  </h2>
                  <ul class="space-y-3">
                    {event.topics.map((topic: string, i: number) => (
                      <li key={i} class="flex items-start gap-3">
                        <svg
                          class="flex-shrink-0 mt-0.5"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#c4853a"
                          stroke-width="2.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <span style="color: rgba(28,26,24,0.8);">
                          {topic}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {event.supportingImages &&
                event.supportingImages.map((imgSrc: string, i: number) => (
                  <div
                    key={i}
                    class="rounded-2xl overflow-hidden"
                    style="border: 1px solid #d0e4e7;"
                  >
                    <img
                      src={imgSrc}
                      alt={`Supporting graphic: ${event.title}`}
                      class="w-full h-auto"
                    />
                  </div>
                ))}

              {moreInfoHtml && <EventMoreInfo html={moreInfoHtml} />}
            </div>

            {/* Right: registration form */}
            <div class="md:col-span-5">
              <div class="sticky top-20">
                <EventRegistrationForm
                  eventHeadingText="Register — it’s free"
                  eventHeadingClass="text-xl font-bold mb-4"
                  eventSlug={event.slug}
                  eventTitle={event.title}
                  turnstileSiteKey={turnstileSiteKey}
                  showSlack={!!Deno.env.get("SLACK_ENABLED")}
                  isLoggedIn={user !== null}
                  userFirstName={state.profile?.name_first ?? ""}
                  userLastName={state.profile?.name_last ?? ""}
                  userEmail={state.profile?.email ?? user?.email ?? ""}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Back link */}
      <div class="bg-warm-white" style="border-top: 1px solid #d0e4e7;">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <a
            href="/meetups"
            class="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-opacity hover:opacity-70"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            All meetups
          </a>
        </div>
      </div>
    </>
  );
});
