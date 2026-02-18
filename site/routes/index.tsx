import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";

export default define.page(function Home() {
  return (
    <>
      <Head>
        <title>
          Future Together — The future is arriving. Let's face it together.
        </title>
        <meta
          name="description"
          content="A community for people paying attention to AI and technological change. Monthly online meetups, honest conversation, and collective preparation. Join us."
        />
        <meta property="og:title" content="Future Together" />
        <meta
          property="og:description"
          content="The future is arriving. Let’s face it together. Monthly online meetups for people who want to understand and prepare for AI-driven change."
        />
        <meta property="og:url" content="https://futuretogether.community" />
      </Head>

      {/* ===================== HERO ===================== */}
      <section class="bg-primary text-white min-h-screen flex flex-col justify-center pt-16">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 py-24 text-center">
          <p class="text-sm font-semibold uppercase tracking-widest text-white/60 mb-6">
            Awareness &middot; Conversation &middot; Action
          </p>
          <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            The future is arriving.
            <br />
            <span class="text-accent">Let's face it together.</span>
          </h1>
          <p class="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            A community for people who are paying attention — and want to do
            something about it. Monthly online meetups. Honest conversation.
            Collective preparation.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/join"
              class="inline-block px-8 py-3.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent/85 transition-colors text-base"
            >
              Join the Next Meetup &rarr;
            </a>
            <a
              href="#the-gap"
              class="inline-block px-8 py-3.5 border-2 border-white/40 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors text-base"
            >
              What is Future Together? &darr;
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div class="flex justify-center pb-10 animate-bounce opacity-50">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ===================== THE GAP ===================== */}
      <section id="the-gap" class="bg-warm-white py-20 sm:py-28">
        <div class="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 class="text-3xl sm:text-4xl font-bold text-near-black mb-8">
            Something significant is happening.
          </h2>
          <div class="prose prose-lg max-w-none text-near-black/80 space-y-5">
            <p>
              Last week, the founder described an app. Explained what it should
              do, what it should look like. Walked away from the computer for
              four hours.
            </p>
            <p>
              When he came back, it was done. Tens of thousands of lines of
              working code. Not a rough draft. The finished thing.
            </p>
            <p>
              This isn’t a prediction about what AI might do someday.{" "}
              <strong class="text-near-black">
                This already happened. Last week.
              </strong>
            </p>
            <p>
              AI reached software engineers first — not because they were the
              target, but because AI that can write code helps build better AI.
              Software was the proving ground.
            </p>
            <p class="text-xl font-semibold text-near-black border-l-4 border-accent pl-5 py-1">
              Legal analysis. Financial modelling. Medical diagnosis. Strategic
              planning. Creative work. If your job happens on a screen — what
              just happened to software engineering is about to happen to yours.
            </p>
            <p>
              And it’s not just knowledge work. Robotics is entering homes and
              factories now. Large world models will transform physical work the
              same way language models transformed screen-based work.
            </p>
            <p>
              The gap between what’s actually happening and what most people
              understand is enormous. That gap is dangerous — because it
              prevents preparation.
            </p>
          </div>
        </div>
      </section>

      {/* ===================== FEBRUARY 2020 ===================== */}
      <section
        class="border-y py-20 sm:py-28"
        style="background-color: #eef5f7; border-color: #d0e4e7;"
      >
        <div class="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 class="text-3xl sm:text-4xl font-bold text-near-black mb-8">
            Remember February 2020?
          </h2>
          <div class="prose prose-lg max-w-none text-near-black/80 space-y-5">
            <p>
              A few people were talking about a virus spreading overseas. The
              stock market was fine. Kids were in school. We were planning
              trips, going to restaurants, living normally.
            </p>
            <p>
              Then in three weeks, everything changed.
            </p>
            <p class="text-xl font-semibold text-near-black border-l-4 border-primary pl-5 py-1">
              I think we’re in that “seems overblown” phase right now. Except
              this time it’s not about a virus. It’s about the fundamental
              restructuring of how human society works.
            </p>
            <p>
              The people using the latest AI tools daily — really using them,
              not just trying the free version once in 2023 — aren’t debating
              whether this is real anymore. We’re watching it happen in
              real-time. The debate is over.
            </p>
            <p class="font-semibold text-near-black">
              Now it’s about preparing.
            </p>
          </div>
        </div>
      </section>

      {/* ===================== JOURNEY ===================== */}
      <section class="bg-warm-white py-20 sm:py-28">
        <div class="max-w-5xl mx-auto px-4 sm:px-6">
          <div class="text-center mb-14">
            <h2 class="text-3xl sm:text-4xl font-bold text-near-black mb-4">
              Not panic. Not paralysis. Action.
            </h2>
            <p class="text-lg text-near-black/65 max-w-xl mx-auto">
              Future Together guides people through three stages — from
              understanding what’s happening, to processing it together, to
              doing something about it.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Awareness */}
            <div class="bg-white rounded-2xl p-8 border border-primary/10 shadow-sm">
              <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <span class="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 class="text-xl font-bold text-near-black mb-3">Awareness</h3>
              <p class="text-near-black/70 leading-relaxed">
                Understanding what’s actually happening — not the comfortable
                version, not the hype version. The honest picture of where AI
                development really is, and what it means.
              </p>
            </div>

            {/* Conversation */}
            <div class="bg-white rounded-2xl p-8 border border-primary/10 shadow-sm">
              <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <span class="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 class="text-xl font-bold text-near-black mb-3">
                Conversation
              </h3>
              <p class="text-near-black/70 leading-relaxed">
                Processing it together. Asking questions. Challenging
                assumptions. Sharing what you’re seeing in your industry and
                your community. This is a discussion, not a presentation.
              </p>
            </div>

            {/* Action */}
            <div
              class="bg-white rounded-2xl p-8 shadow-sm"
              style="border: 2px solid #e8d5c0;"
            >
              <div class="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                <span class="text-2xl font-bold text-accent">3</span>
              </div>
              <h3 class="text-xl font-bold text-near-black mb-3">Action</h3>
              <p class="text-near-black/70 leading-relaxed">
                Taking practical steps — individually and collectively. Building
                the local networks and community resilience that will matter
                most, regardless of how this unfolds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== MEETUP CTA ===================== */}
      <section class="bg-primary text-white py-20 sm:py-28">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 class="text-3xl sm:text-4xl font-bold mb-5">
            Join the conversation
          </h2>
          <p class="text-lg text-white/80 mb-4 leading-relaxed">
            Every month, we gather online to talk honestly about what’s
            happening and how we prepare. No product pitch. No agenda. Just
            people who are paying attention, figuring this out together.
          </p>
          <p class="text-white/60 mb-10 text-sm">
            Third Wednesday of each month &middot; Time varies &middot; Free,
            always
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/join"
              class="inline-block px-8 py-3.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent/85 transition-colors"
            >
              Register — it's free &rarr;
            </a>
            <a
              href="/meetups"
              class="inline-block px-8 py-3.5 border-2 border-white/40 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              Learn about meetups
            </a>
          </div>
          <p class="mt-10 text-white/45 text-sm">
            You don’t have to figure this out alone.
          </p>
        </div>
      </section>
    </>
  );
});
