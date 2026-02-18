import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";

export default define.page(function About() {
  return (
    <>
      <Head>
        <title>About — Future Together</title>
        <meta
          name="description"
          content="Future Together was founded by Charlie Garrison after watching AI transform software development in real time. This is the origin story."
        />
      </Head>

      {/* Hero */}
      <section class="text-white pt-16" style="background-color: #1a5f6e;">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <p
            class="text-sm font-semibold uppercase tracking-widest mb-4"
            style="color: rgba(255,255,255,0.6);"
          >
            Origin story
          </p>
          <h1 class="text-4xl sm:text-5xl font-bold mb-5">
            Why Future Together exists
          </h1>
          <p
            class="text-lg leading-relaxed"
            style="color: rgba(255,255,255,0.8);"
          >
            This community started with a conversation no-one was having — about
            what AI is actually doing to the world, right now, and how ordinary
            people can face it together.
          </p>
        </div>
      </section>

      {/* Founder bio */}
      <section
        style="background-color: #f7f4ef; border-bottom: 1px solid #d0e4e7;"
        class="py-14"
      >
        <div class="max-w-3xl mx-auto px-4 sm:px-6">
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <div class="flex-shrink-0">
              <img
                src="/profile-cng.jpeg"
                alt="Charlie Garrison"
                width={120}
                height={120}
                class="rounded-full object-cover"
                style="width: 120px; height: 120px; border: 3px solid #d0e4e7;"
              />
            </div>
            <div>
              <p
                class="text-xs font-semibold uppercase tracking-widest mb-1"
                style="color: #c4853a;"
              >
                Founder
              </p>
              <h2 class="text-2xl font-bold mb-1" style="color: #1c1a18;">
                Charlie Garrison
              </h2>
              <p
                class="text-sm mb-3"
                style="color: rgba(28,26,24,0.55);"
              >
                Software developer &middot; Sydney, Australia
              </p>
              <p
                class="leading-relaxed text-sm mb-4"
                style="color: rgba(28,26,24,0.75);"
              >
                Charlie has been building software for most of his working life.
                After watching AI transform software development faster than
                almost anyone predicted, he started Future Together to help
                people understand and prepare for what’s coming.
              </p>
              <a
                href="https://cngarrison.com"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
                style="color: #1a5f6e;"
              >
                cngarrison.com
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Founder story */}
      <section class="py-20 sm:py-28" style="background-color: #f7f4ef;">
        <div class="max-w-3xl mx-auto px-4 sm:px-6">
          <div
            class="prose prose-lg max-w-none"
            style="color: rgba(28,26,24,0.85);"
          >
            <h2 style="color: #1c1a18;">The moment everything became real</h2>
            <p>
              I’ve been in and around the technology industry for most of my
              working life. I’m not an AI researcher. I don’t work at a lab. I’m
              a software developer who started paying close attention to what
              was happening — and what I saw changed how I understood the world.
            </p>
            <p>
              Last year, I built an app in a way I’d never done before. I
              described what I wanted. Explained the problem. Then I left the
              computer for four hours.
            </p>
            <p>
              When I came back, it was done. Tens of thousands of lines of
              working code. Not a prototype — the finished thing. Something that
              would have taken me weeks now took an afternoon.
            </p>
            <p>
              That wasn’t the surprising part. The surprising part was how
              unsurprising it felt. Because by then, I’d been watching AI tools
              get better every month, every week, sometimes every day. I’d been
              tracking it closely enough that this was just the next step in an
              obvious trajectory.
            </p>
            <p>
              But I knew most people hadn’t been tracking it. Most people were
              still in the “seems overblown” phase — the same phase we were in
              with COVID in February 2020, before everything changed in three
              weeks.
            </p>

            <h2 style="color: #1c1a18;">The gap that worried me</h2>
            <p>
              The gap between what’s actually happening and what most people
              understand is enormous. That gap is dangerous. Not because AI is
              going to do something to people — but because people who don’t
              understand what’s happening can’t make good decisions about their
              lives, their work, their communities, or their future.
            </p>
            <p>
              I couldn’t find a community doing what I thought needed doing:
              meeting regularly, talking honestly, working through the
              implications together, and figuring out how to prepare — not with
              panic, not with forced optimism, but with clear eyes.
            </p>
            <p>So I started one.</p>

            <h2 style="color: #1c1a18;">What we’re trying to do</h2>
            <p>
              Future Together isn’t a product. There’s nothing to sell you. It’s
              not affiliated with any AI company, and it’s not a doomsday-prep
              community either.
            </p>
            <p>
              It’s a community for people who are paying attention — or who want
              to start. People who feel something significant is happening and
              want to face it with others rather than alone.
            </p>
            <p>We meet monthly. We talk honestly. We prepare together.</p>
            <p class="font-semibold" style="color: #1c1a18;">
              The future is arriving. Let’s face it together.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section
        class="py-16 sm:py-20"
        style="background-color: #eef5f7; border-top: 1px solid #d0e4e7;"
      >
        <div class="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 class="text-2xl font-bold mb-10" style="color: #1c1a18;">
            What we stand for
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: "Honest, not alarming",
                body:
                  "We don\u2019t catastrophise. We also don\u2019t pretend everything is fine. We try to see clearly.",
              },
              {
                title: "Curious, not certain",
                body:
                  "Nobody has this figured out. We hold our views with appropriate humility and update them when we should.",
              },
              {
                title: "Together, not alone",
                body:
                  "The most important thing about this community is the \u2018together\u2019. You don\u2019t have to figure this out by yourself.",
              },
              {
                title: "Action, not paralysis",
                body:
                  "Awareness leads to conversation leads to action. Every meetup moves us forward, however small the step.",
              },
            ].map((item) => (
              <div
                class="bg-white rounded-xl p-6"
                style="border: 1px solid #d0e4e7;"
              >
                <h3
                  class="font-semibold text-base mb-2"
                  style="color: #1a5f6e;"
                >
                  {item.title}
                </h3>
                <p
                  class="text-sm leading-relaxed"
                  style="color: rgba(28,26,24,0.75);"
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        class="py-20 text-center"
        style="background-color: #1a5f6e; color: white;"
      >
        <div class="max-w-xl mx-auto px-4 sm:px-6">
          <h2 class="text-3xl font-bold mb-4">Come to a meetup</h2>
          <p class="mb-8 text-lg" style="color: rgba(255,255,255,0.8);">
            The best way to understand what Future Together is about is to
            experience a conversation. Join us.
          </p>
          <a
            href="/events/discuss-our-future"
            class="inline-block px-8 py-3.5 text-white font-semibold rounded-xl transition-opacity hover:opacity-90"
            style="background-color: #c4853a;"
          >
            Register for the next meetup &rarr;
          </a>
        </div>
      </section>
    </>
  );
});
