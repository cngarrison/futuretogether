import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";

/**
 * Contact page — Future Together
 * Simple contact for the Phase 1 MVP.
 * Full contact form integration (Resend) can be added in Phase 2.
 */
export default define.page(function Contact() {
  return (
    <>
      <Head>
        <title>Contact — Future Together</title>
        <meta
          name="description"
          content="Get in touch with Future Together. Questions, feedback, or just want to connect."
        />
      </Head>

      <section style="background-color: #1a5f6e; color: white;" class="pt-16">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <h1 class="text-4xl font-bold mb-4">Get in touch</h1>
          <p class="text-lg" style="color: rgba(255,255,255,0.8);">
            Questions, feedback, or just want to connect.
          </p>
        </div>
      </section>

      <section style="background-color: #f7f4ef;" class="py-20">
        <div class="max-w-3xl mx-auto px-4 sm:px-6">
          <div class="bg-white rounded-2xl p-8 sm:p-12" style="border: 1px solid #d0e4e7;">
            <p class="text-lg mb-8" style="color: rgba(28,26,24,0.8);">
              The best way to connect with Future Together is to join a meetup
              — that’s where the real conversation happens. But if you have
              specific questions or want to get in touch directly, reach out
              via the channels below.
            </p>

            <div class="space-y-5">
              <div class="flex items-start gap-4">
                <div
                  class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  style="background-color: #e8f3f5;"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a5f6e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div>
                  <p class="font-semibold mb-0.5" style="color: #1c1a18;">LinkedIn</p>
                  <a
                    href="https://www.linkedin.com/company/futuretogether-community"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm transition-opacity hover:opacity-70"
                    style="color: #1a5f6e;"
                  >
                    linkedin.com/company/futuretogether-community
                  </a>
                </div>
              </div>

              <div
                class="pt-6 mt-2"
                style="border-top: 1px solid #d0e4e7;"
              >
                <p
                  class="text-sm font-semibold uppercase tracking-widest mb-3"
                  style="color: rgba(28,26,24,0.4);"
                >
                  Or just join the conversation
                </p>
                <a
                  href="/events/discuss-our-future"
                  class="inline-block px-6 py-3 text-white font-semibold rounded-xl transition-opacity hover:opacity-90"
                  style="background-color: #c4853a;"
                >
                  Register for the next meetup &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
});
