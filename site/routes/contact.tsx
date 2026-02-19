import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import ContactForm from "@/islands/ContactForm.tsx";

/**
 * Contact page — Future Together
 * Two-column layout: info + links on the left, contact form on the right.
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

      {/* Hero */}
      <section style="background-color: #1a5f6e; color: white;" class="pt-16">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <h1 class="text-4xl font-bold mb-4">Get in touch</h1>
          <p class="text-lg" style="color: rgba(255,255,255,0.8);">
            Questions, feedback, or just want to connect — we'd love to hear
            from you.
          </p>
        </div>
      </section>

      <section style="background-color: #f7f4ef;" class="py-20">
        <div class="max-w-4xl mx-auto px-4 sm:px-6">
          <div class="grid md:grid-cols-2 gap-10">
            {/* Left column — info */}
            <div>
              <p class="text-lg mb-8" style="color: rgba(28,26,24,0.75);">
                The best way to connect is to join a meetup — that's where the
                real conversation happens. But if you have a specific question
                or want to get in touch directly, use the form or find us on
                LinkedIn.
              </p>

              <h2
                class="text-xl font-semibold mb-4"
                style="color: #1c1a18;"
              >
                Connect with us
              </h2>

              <ul class="space-y-4 mb-8">
                <li class="flex items-center gap-3">
                  {/* LinkedIn icon */}
                  <svg
                    class="w-6 h-6 flex-shrink-0"
                    style={{ color: "#1a5f6e" }}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  <a
                    href="https://www.linkedin.com/company/future-together"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="font-semibold transition-opacity hover:opacity-70"
                    style="color: #1a5f6e;"
                  >
                    Future Together on LinkedIn
                  </a>
                </li>
              </ul>

              <div
                class="pt-6"
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

            {/* Right column — form */}
            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
});
