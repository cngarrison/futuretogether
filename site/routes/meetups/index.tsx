import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getNextAvailableEvent } from "@/utils/events.ts";

// The "Discuss Our Future" meetup alternates start times each month
// to accommodate participants in different time zones:
//   - Even months: 10:00 AM AEDT (better for Europe / morning crowd)
//   - Odd months: 6:00 PM AEDT (better for evening / after-work attendance)
// The actual time for each session is defined in the event YAML files.

export default define.page(async function Meetups() {
  // Load the next upcoming event so we can show the real date/time
  const nextEvent = await getNextAvailableEvent("discuss-our-future");

  // Format a human-readable date + time string from the event data
  let nextEventDisplay: string | null = null;
  if (nextEvent?.date) {
    try {
      const d = new Date(nextEvent.date);
      nextEventDisplay = d.toLocaleString("en-AU", {
        timeZone: nextEvent.timezone ?? "Australia/Sydney",
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
      // Fall back gracefully if date parsing fails
    }
  }

  return (
    <>
      <Head>
        <title>Meetups — Future Together</title>
        <meta
          name="description"
          content="Monthly online meetups for people paying attention to AI and technological change. Free, honest, no agenda. Third Wednesday of each month."
        />
      </Head>

      {/* Hero */}
      <section class="text-white pt-16" style="background-color: #1a5f6e;">
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
            class="inline-block px-8 py-3.5 text-white font-semibold rounded-xl transition-opacity hover:opacity-90"
            style="background-color: #c4853a;"
          >
            Register for the Next Meetup &rarr;
          </a>
        </div>
      </section>

      {/* Details strip */}
      <section style="background-color: #1c1a18; color: white;">
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
                {/* Time alternates each month to suit different time zones */}
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
              <p class="font-semibold">Online via Google Meet</p>
              <p
                class="text-sm mt-0.5"
                style="color: rgba(255,255,255,0.6);"
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

      {/* What happens */}
      <section class="py-20 sm:py-24" style="background-color: #f7f4ef;">
        <div class="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 class="text-3xl font-bold mb-10" style="color: #1c1a18;">
            What happens at a meetup?
          </h2>
          <div class="space-y-8">
            {[
              {
                n: 1,
                color: "#1a5f6e",
                title: "A brief update on what’s changed",
                body:
                  "We start with what\u2019s happened in AI since the last meetup \u2014 the things that matter, explained clearly. No jargon, no assumption you\u2019re a technical person.",
              },
              {
                n: 2,
                color: "#1a5f6e",
                title: "A focused topic or question",
                body:
                  "Each session has a theme. Past topics have included: how AI is changing knowledge work, what community resilience looks like, and how to think about AI without the hype or the doom.",
              },
              {
                n: 3,
                color: "#c4853a",
                title: "Open discussion",
                body:
                  "This is the part people keep coming back for. Questions, challenges, personal experiences from different industries and countries. A real conversation, not a presentation.",
              },
            ].map((step) => (
              <div class="flex gap-5" key={step.n}>
                <div
                  class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                  style={`background-color: ${step.color};`}
                >
                  {step.n}
                </div>
                <div>
                  <h3
                    class="font-semibold text-lg mb-1"
                    style="color: #1c1a18;"
                  >
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

      {/* Past resources */}
      <section
        class="py-16 sm:py-20"
        style="background-color: #eef5f7; border-top: 1px solid #d0e4e7; border-bottom: 1px solid #d0e4e7;"
      >
        <div class="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 class="text-2xl font-bold mb-3" style="color: #1c1a18;">
            Past resources
          </h2>
          <p class="mb-8" style="color: rgba(28,26,24,0.7);">
            Missed a session? The conversation slideshow from our meetups is
            available to browse.
          </p>
          <a
            href="/meetups/slideshow"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
            style="background-color: #1a5f6e;"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
            View the meetup slideshow
          </a>
        </div>
      </section>

      {/* CTA */}
      <section
        class="py-20 sm:py-24 text-center"
        style="background-color: #1a5f6e; color: white;"
      >
        <div class="max-w-xl mx-auto px-4 sm:px-6">
          <h2 class="text-3xl font-bold mb-4">Ready to join us?</h2>
          <p class="mb-8 text-lg" style="color: rgba(255,255,255,0.8);">
            Registration takes 30 seconds. The conversation is worth it.
          </p>
          <a
            href="/events/discuss-our-future"
            class="inline-block px-8 py-3.5 text-white font-semibold rounded-xl transition-opacity hover:opacity-90"
            style="background-color: #c4853a;"
          >
            Register — it’s free &rarr;
          </a>
        </div>
      </section>
    </>
  );
});
