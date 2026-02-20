import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";

export default define.page(function StartAGroup() {
  const steps = [
    {
      number: "01",
      title: "Get grounded in the topic",
      body:
        "Before you run your first meetup, spend some time with the material. Read through the ",
      link: { href: "/blog", text: "Future Together blog series" },
      body2:
        " — it covers the core questions in plain language. The series is designed for exactly the kind of people you'll be inviting. You don't need to read it all before you start, but the more familiar you are with the ideas, the more confident you'll feel facilitating.",
    },
    {
      number: "02",
      title: "Choose your format",
      body:
        "In-person or online — both work. In-person creates stronger connection; online removes geography as a barrier. Our monthly online meetups run on video call with 15–30 people and feel genuinely conversational. A local in-person group could be as small as five people around someone's kitchen table. Start with whatever format you can actually sustain.",
    },
    {
      number: "03",
      title: "Invite a few people",
      body:
        "You don't need a crowd. Three to five people for a first conversation is plenty. Think about friends, colleagues, or community members who you sense are paying attention — or who you think should be. The invitation doesn't have to be polished. Something like: “I've been reading about AI and what it could mean for all of us. I'd like to have a conversation about it — want to join me?” is enough.",
    },
    {
      number: "04",
      title: "Use the slideshow as your starting point",
      body:
        "You don't need to build your own presentation. We've already created one. The ",
      link: { href: "/meetups/slideshow", text: "Future Together slideshow" },
      body2:
        " walks through the key ideas — what's happening with AI, why it matters, and what questions we should all be asking. Use it to open the conversation, then step back and let people respond. The goal is discussion, not lecture.",
    },
    {
      number: "05",
      title: "Facilitate, don't lecture",
      body:
        "The most important thing to get right: you are not the expert presenting to an audience. You're someone who's been thinking about this and wants to think about it with others. Ask questions. Invite people to share what they're seeing in their own work and life. Push back gently on easy answers. The best Future Together conversations are the ones where everyone leaves with more questions than they arrived with.",
    },
    {
      number: "06",
      title: "List your group with Future Together",
      body:
        "Once you've run your first session — or even before, if you want some support getting started — get in touch. We'd love to know your group exists, help you connect with others doing the same thing, and eventually list your group so people in your area can find it. Use the ",
      link: { href: "/contact", text: "contact form" },
      body2:
        " and select “Starting or finding a local group” as your topic.",
    },
    {
      number: "07",
      title: "Keep going",
      body:
        "One conversation is a start. A regular meetup is a community. Monthly is sustainable — enough frequency to build momentum, not so frequent it becomes a burden. The conversations will get richer as people become more familiar with the ideas and with each other. The goal isn't to reach a conclusion. It's to keep the conversation alive.",
    },
  ];

  return (
    <>
      <Head>
        <title>Start a Group — Future Together</title>
        <meta
          name="description"
          content="How to start a Future Together meetup in your own community. A simple guide to getting the conversation started — no expertise required."
        />
      </Head>

      {/* Hero */}
      <section class="text-white pt-16" style="background-color: #1a5f6e;">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <p
            class="text-sm font-semibold uppercase tracking-widest mb-4"
            style="color: rgba(255,255,255,0.6);"
          >
            Take action
          </p>
          <h1 class="text-4xl sm:text-5xl font-bold mb-5">
            Start a group in your community
          </h1>
          <p
            class="text-lg leading-relaxed"
            style="color: rgba(255,255,255,0.8);"
          >
            The conversation Future Together is trying to start needs to happen
            everywhere — not just online, but in living rooms, community halls,
            and cafés around the world. You don't need to be an expert. You
            need a room and a willingness to ask the question.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section class="py-16" style="background-color: #f7f4ef;">
        <div class="max-w-3xl mx-auto px-4 sm:px-6">
          <div
            class="prose prose-lg max-w-none"
            style="color: rgba(28,26,24,0.85);"
          >
            <p>
              Future Together started as a local meetup in regional New South
              Wales. One person, a few friends, a conversation that felt
              necessary. It grew into a monthly online meetup reaching people
              across Australia and beyond.
            </p>
            <p>
              The model works because the conversation itself is the point. No
              polished answers, no expert panel — just people who are paying
              attention, thinking together about what's coming and how to face
              it.
            </p>
            <p>
              If you've read{" "}
              <a href="/blog/what-can-you-actually-do-right-now">
                what you can actually do right now
              </a>{" "}
              and felt the pull to start something — this guide is for you.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section
        class="py-16 sm:py-20"
        style="background-color: #eef5f7; border-top: 1px solid #d0e4e7;"
      >
        <div class="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 class="text-2xl font-bold mb-10" style="color: #1c1a18;">
            How to run your first meetup
          </h2>
          <div class="space-y-10">
            {steps.map((step) => (
              <div class="flex gap-6">
                <div class="flex-shrink-0">
                  <span
                    class="text-3xl font-bold"
                    style="color: #c4853a; line-height: 1;"
                  >
                    {step.number}
                  </span>
                </div>
                <div>
                  <h3
                    class="text-lg font-semibold mb-2"
                    style="color: #1a5f6e;"
                  >
                    {step.title}
                  </h3>
                  <p
                    class="leading-relaxed"
                    style="color: rgba(28,26,24,0.8);"
                  >
                    {step.body}
                    {step.link && (
                      <a
                        href={step.link.href}
                        class="underline"
                        style="color: #1a5f6e;"
                      >
                        {step.link.text}
                      </a>
                    )}
                    {step.body2 ?? ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section class="py-16" style="background-color: #f7f4ef;">
        <div class="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 class="text-2xl font-bold mb-8" style="color: #1c1a18;">
            Resources to get you started
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                title: "The slideshow",
                desc:
                  "Our ready-to-use presentation. Open it on your laptop, walk through it with your group.",
                href: "/meetups/slideshow",
                label: "Open slideshow",
              },
              {
                title: "The blog series",
                desc:
                  "Nine posts covering the core ideas — AI, work, community, preparation, and hope.",
                href: "/blog",
                label: "Read the series",
              },
              {
                title: "Resources page",
                desc:
                  "Curated external reading and viewing for people who want to go deeper.",
                href: "/resources",
                label: "Browse resources",
              },
            ].map((r) => (
              <div
                class="bg-white rounded-xl p-6"
                style="border: 1px solid #d0e4e7;"
              >
                <h3
                  class="font-semibold text-base mb-2"
                  style="color: #1a5f6e;"
                >
                  {r.title}
                </h3>
                <p
                  class="text-sm leading-relaxed mb-4"
                  style="color: rgba(28,26,24,0.7);"
                >
                  {r.desc}
                </p>
                <a
                  href={r.href}
                  class="text-sm font-semibold"
                  style="color: #c4853a;"
                >
                  {r.label} &rarr;
                </a>
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
          <h2 class="text-3xl font-bold mb-4">Let us know you exist</h2>
          <p class="mb-8 text-lg" style="color: rgba(255,255,255,0.8);">
            Once you've run your first session, get in touch. We'd love to
            connect you with others, share what you're learning, and eventually
            list your group so people in your area can find it.
          </p>
          <a
            href="/contact"
            class="inline-block px-8 py-3.5 text-white font-semibold rounded-xl transition-opacity hover:opacity-90"
            style="background-color: #c4853a;"
          >
            Get in touch &rarr;
          </a>
          <p class="mt-6 text-sm" style="color: rgba(255,255,255,0.6);">
            Select “Starting or finding a local group” in the contact form.
          </p>
        </div>
      </section>
    </>
  );
});
