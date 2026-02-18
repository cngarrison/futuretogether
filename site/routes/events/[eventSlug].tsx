import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";
import {
  getNextAvailableEvent,
  getRegistrationCount,
} from "@/utils/events.ts";
import EventRegistrationForm from "@/islands/EventRegistrationForm.tsx";
import EventDateTime from "@/islands/EventDateTime.tsx";
import { getTurnstileSiteKey } from "@/utils/turnstile.ts";

/**
 * Event registration page.
 * Uses an async page component (Fresh v2 pattern) to load server-side data
 * without needing a separate handler and ctx.render().
 */
export default define.page(async function EventPage({ params }) {
  const { eventSlug } = params;
  const event = await getNextAvailableEvent(eventSlug);
  const registrationCount = event ? await getRegistrationCount(event.id) : 0;
  const turnstileSiteKey = getTurnstileSiteKey();

  if (!event) {
    return (
      <>
        <Head>
          <title>Event Not Available — Future Together</title>
        </Head>
        <section style="background-color: #1a5f6e; color: white;" class="pt-16">
          <div class="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
            <h1 class="text-3xl font-bold mb-4">No upcoming events</h1>
            <p class="mb-8" style="color: rgba(255,255,255,0.75);">
              This event has ended or no future sessions are currently
              scheduled. Check back soon.
            </p>
            <a
              href="/meetups"
              class="inline-block px-6 py-3 text-white font-semibold rounded-xl transition-opacity hover:opacity-90"
              style="background-color: #c4853a;"
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
      <section style="background-color: #1a5f6e; color: white;" class="pt-16">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <p
            class="text-xs font-semibold uppercase tracking-widest mb-3"
            style="color: rgba(255,255,255,0.55);"
          >
            Monthly Online Meetup
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
              &middot; {event.duration} min &middot; Google Meet &middot; Free
            </span>
          </div>
          {spotsRemaining > 0 && spotsRemaining <= 10 && (
            <p
              class="mt-3 text-sm font-semibold"
              style="color: #c4853a;"
            >
              Only {spotsRemaining} spot{spotsRemaining === 1 ? "" : "s"}{" "}
              remaining!
            </p>
          )}
        </div>
      </section>

      {/* Body: details + registration form */}
      <section style="background-color: #f7f4ef;">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* Left: event details */}
            <div class="md:col-span-7 space-y-6">
              <div
                class="bg-white rounded-2xl p-8"
                style="border: 1px solid #d0e4e7;"
              >
                <h2
                  class="text-xl font-bold mb-4"
                  style="color: #1c1a18;"
                >
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
                  <h2
                    class="text-xl font-bold mb-4"
                    style="color: #1c1a18;"
                  >
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
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Back link */}
      <div style="background-color: #f7f4ef; border-top: 1px solid #d0e4e7;">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <a
            href="/meetups"
            class="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
            style="color: #1a5f6e;"
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
