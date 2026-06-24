import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getNextAvailableEvent } from "@/utils/db/group-events.ts";
import MemberSignupForm from "@/islands/MemberSignupForm.tsx";
import { getTurnstileSiteKey } from "@/utils/turnstile.ts";
import { generateFormToken } from "@/utils/form-token.ts";

export default define.page(async function Join(props) {
  const groupId = props.url.searchParams.get("group_id") ?? undefined;
  const nextUrl = props.url.searchParams.get("next") ?? "/groups";
  const turnstileSiteKey = getTurnstileSiteKey();
  const formToken = await generateFormToken() ?? undefined;
  const nextEvent = await getNextAvailableEvent(
    "discuss-our-future",
    props.state,
  );

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
      // Fall back gracefully
    }
  }

  return (
    <>
      <Head>
        <title>Join — Future Together</title>
        <meta
          name="description"
          content="Become a member of Future Together — a community of people paying attention to AI-driven change and thinking seriously about what to do. Free to join."
        />
      </Head>

      {/* Hero */}
      <section
        class="text-white bg-primary"
        style="background-image: linear-gradient(rgba(26,95,110,0.80), rgba(26,95,110,0.80)), url('/img/join-portrait-hero.webp'); background-size: cover; background-position: center top;"
      >
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h1 class="text-4xl sm:text-5xl font-bold mb-5">
            Join Future Together
          </h1>
          <p
            class="text-lg max-w-xl mx-auto leading-relaxed"
            style="color: rgba(255,255,255,0.8);"
          >
            You don't have to figure this out alone. Become a member and join a
            community that's paying attention — and doing something about it.
          </p>
        </div>
      </section>

      {/* Main content: asymmetric 2-col on desktop */}
      <section class="py-16 sm:py-20 bg-warm-white">
        <div class="max-w-5xl mx-auto px-4 sm:px-6">
          <div class="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 items-start">
            {/* Left: membership form card */}
            <div
              class="bg-white rounded-2xl p-8"
              style="border: 2px solid #1a5f6e;"
            >
              <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-5 text-white bg-primary">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </div>
              <h2 class="text-xl font-bold text-near-black mb-1">
                Become a member
              </h2>
              <p
                class="text-sm leading-relaxed mb-6"
                style="color: rgba(28,26,24,0.65);"
              >
                Free. No commitment. Cancel any time.
              </p>
              <MemberSignupForm
                turnstileSiteKey={turnstileSiteKey}
                formToken={formToken}
                groupId={groupId}
                nextUrl={nextUrl}
              />

              {/* Cross-links */}
              <p
                class="text-center text-xs mt-5"
                style="color: rgba(28,26,24,0.5);"
              >
                Already a member?{" "}
                <a href="/login" class="font-semibold text-primary">
                  Sign in &rarr;
                </a>
              </p>
              <p
                class="text-center text-xs mt-1.5"
                style="color: rgba(28,26,24,0.32);"
              >
                Prefer to set a password?{" "}
                <a
                  href="/signup"
                  style="color: rgba(28,26,24,0.4); text-decoration: underline;"
                >
                  Sign up here
                </a>
              </p>
            </div>

            {/* Right: stacked cards */}
            <div class="flex flex-col gap-6">
              {/* Attend the next meetup */}
              <div
                class="bg-white rounded-2xl p-7"
                style="border: 2px solid #c4853a;"
              >
                <div class="-mx-7 -mt-7 mb-5 overflow-hidden rounded-t-2xl">
                  <img
                    src="/img/discuss-our-future-card.webp"
                    alt="Discuss Our Future — monthly online community meetup"
                    class="w-full"
                    style="height: 160px; object-fit: cover; object-position: center;"
                  />
                </div>
                <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-white bg-accent">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <h2 class="text-lg font-bold text-near-black mb-1">
                  Attend the next meetup
                </h2>
                <p
                  class="text-sm leading-relaxed mb-1"
                  style="color: rgba(28,26,24,0.65);"
                >
                  Monthly online conversation — free, no agenda, just honest
                  discussion.
                </p>
                {nextEventDisplay
                  ? (
                    <p class="text-sm font-semibold text-near-black mb-0.5">
                      {nextEventDisplay}
                    </p>
                  )
                  : (
                    <p class="text-sm font-semibold text-near-black mb-0.5">
                      Third Wednesday of each month
                    </p>
                  )}
                <p
                  class="text-xs mb-5"
                  style="color: rgba(28,26,24,0.4);"
                >
                  Time alternates monthly for different time zones
                </p>
                <a
                  href="/events/discuss-our-future"
                  class="inline-block w-full text-center px-5 py-2.5 text-white text-sm font-semibold bg-accent rounded-xl transition-opacity hover:opacity-90"
                >
                  Register for next meetup &rarr;
                </a>
              </div>

              {/* What members get */}
              <div
                class="bg-white rounded-2xl p-7"
                style="border: 1px solid #d0e4e7;"
              >
                <h2 class="text-lg font-bold text-near-black mb-4">
                  What members get
                </h2>
                <ul class="space-y-3">
                  {([
                    [
                      "Monthly meetup invitations",
                      "Every month, a free online conversation with people thinking seriously about this.",
                    ],
                    [
                      "Slack community access",
                      "Where the conversation continues between meetups. Questions, reads, discussion — ongoing.",
                    ],
                    [
                      "New content first",
                      "Articles, resources, and guides as they're published.",
                    ],
                    [
                      "Community updates",
                      "Occasional news when there's something worth sharing. No noise.",
                    ],
                    [
                      "Local group support",
                      "Want to run a group in your city? We'll help you get started.",
                    ],
                  ] as [string, string][]).map(([title, desc]) => (
                    <li key={title} class="flex items-start gap-3">
                      <span class="mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold bg-primary">
                        ✓
                      </span>
                      <div>
                        <p class="text-sm font-semibold text-near-black">
                          {title}
                        </p>
                        <p
                          class="text-xs leading-relaxed"
                          style="color: rgba(28,26,24,0.6);"
                        >
                          {desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* end right column */}
          </div>
        </div>
      </section>

      {/* Slack invite section */}
      <section class="py-14 bg-primary">
        <div class="max-w-3xl mx-auto px-4 sm:px-6">
          <div class="flex flex-col sm:flex-row items-center gap-8">
            {/* Left: copy */}
            <div class="flex-1 text-white text-center sm:text-left">
              <div class="flex items-center justify-center sm:justify-start gap-2 mb-3">
                <span class="text-2xl">&#x1F4AC;</span>
                <h2 class="text-xl font-bold">Join us on Slack</h2>
              </div>
              <p
                class="leading-relaxed mb-1"
                style="color: rgba(255,255,255,0.8);"
              >
                Our Slack workspace is where the conversation continues between
                meetups. Ask questions, share what you're reading, find others
                thinking about the same things you are.
              </p>
              <p class="text-sm" style="color: rgba(255,255,255,0.55);">
                #discuss-our-future &nbsp;&middot;&nbsp; #risks-and-mitigation
                &nbsp;&middot;&nbsp; #introductions &nbsp;&middot;&nbsp;
                #what-are-you-reading
              </p>
            </div>
            {/* Right: CTA button */}
            <div class="flex-shrink-0">
              <a
                href="https://join.slack.com/t/future-together-group/shared_invite/zt-3ssaug5th-1JI5b86jGesX8B77RojgBQ"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-block px-8 py-3.5 font-bold rounded-xl text-white text-sm bg-accent transition-opacity hover:opacity-90"
              >
                Join the Slack workspace &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom reassurance strip */}
      <section
        class="py-14"
        style="background-color: #eef5f7; border-top: 1px solid #d0e4e7;"
      >
        <div class="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p class="text-lg font-semibold text-near-black mb-2">
            The future is arriving. Let's face it together.
          </p>
          <p
            class="max-w-xl mx-auto leading-relaxed"
            style="color: rgba(28,26,24,0.65);"
          >
            No spam. No sales. No political agenda. <br />
            Membership is free and always will be. <br />
            Unsubscribe any time.
          </p>
        </div>
      </section>
    </>
  );
});
