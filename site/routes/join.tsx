import { Head } from "fresh/runtime";
import { define } from "../utils.ts";

export default define.page(function Join() {
  return (
    <>
      <Head>
        <title>Join — Future Together</title>
        <meta
          name="description"
          content="Join the Future Together community. Register for the next monthly meetup — free, online, no agenda."
        />
      </Head>

      {/* Hero */}
      <section class="text-white pt-16" style="background-color: #1a5f6e;">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h1 class="text-4xl sm:text-5xl font-bold mb-5">
            Join Future Together
          </h1>
          <p
            class="text-lg max-w-xl mx-auto leading-relaxed"
            style="color: rgba(255,255,255,0.8);"
          >
            You don’t have to figure this out alone. Register for the next
            meetup and become part of a community that’s paying attention.
          </p>
        </div>
      </section>

      {/* Two paths */}
      <section class="py-20 sm:py-24" style="background-color: #f7f4ef;">
        <div class="max-w-4xl mx-auto px-4 sm:px-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Path 1: Register for meetup */}
            <div
              class="bg-white rounded-2xl p-8"
              style="border: 2px solid #c4853a;"
            >
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center mb-5 text-white font-bold"
                style="background-color: #c4853a;"
              >
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
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h2 class="text-xl font-bold mb-2" style="color: #1c1a18;">
                Join the next meetup
              </h2>
              <p
                class="text-sm leading-relaxed mb-6"
                style="color: rgba(28,26,24,0.7);"
              >
                The fastest way in. Register for our monthly online discussion —
                free, no commitment, just a conversation. Third Wednesday of
                each month, 6:00 PM AEDT.
              </p>
              <a
                href="/events/discuss-our-future"
                class="inline-block w-full text-center px-6 py-3 text-white font-semibold rounded-xl transition-opacity hover:opacity-90"
                style="background-color: #c4853a;"
              >
                Register now — it’s free &rarr;
              </a>
            </div>

            {/* Path 2: Learn more first */}
            <div
              class="bg-white rounded-2xl p-8"
              style="border: 1px solid #d0e4e7;"
            >
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center mb-5 text-white font-bold"
                style="background-color: #1a5f6e;"
              >
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
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </div>
              <h2 class="text-xl font-bold mb-2" style="color: #1c1a18;">
                Not sure yet?
              </h2>
              <p
                class="text-sm leading-relaxed mb-6"
                style="color: rgba(28,26,24,0.7);"
              >
                Read the founding essay — it’s the best explanation of what
                Future Together is about, why it exists, and what we’re trying
                to do together.
              </p>
              <div class="space-y-3">
                <a
                  href="/about"
                  class="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
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
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  About Future Together
                </a>
                <a
                  href="/meetups"
                  class="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
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
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  What happens at a meetup
                </a>
                <a
                  href="/blog/the-conversation-we-need-to-have"
                  class="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
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
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  Read: The conversation we need to have
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reassurance */}
      <section
        class="py-16"
        style="background-color: #eef5f7; border-top: 1px solid #d0e4e7;"
      >
        <div class="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p class="text-lg font-semibold mb-2" style="color: #1c1a18;">
            What you’re signing up for
          </p>
          <p
            style="color: rgba(28,26,24,0.7);"
            class="max-w-xl mx-auto leading-relaxed"
          >
            A monthly reminder that you’re not alone in thinking about this. No
            spam. No sales. No political agenda. Just honest conversation with
            people who are paying attention.
          </p>
        </div>
      </section>
    </>
  );
});
