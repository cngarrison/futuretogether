import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";

const ExternalLinkIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

interface ExternalResource {
  category: string;
  title: string;
  url: string;
  description: string;
}

interface InternalResource {
  title: string;
  href: string;
  description: string;
  label: string;
}

const externalResources: ExternalResource[] = [
  {
    category: "Perspectives",
    title: "Should we pause AI? Here's the debate.",
    url: "https://www.youtube.com/watch?v=tUB_uvSqiw8",
    description:
      "An animated explainer from Rational Animations. If superintelligent AI could cause human extinction, why don't we simply stop building it? The video lays out the main arguments, the practical difficulties, and proposed responses — clearly and without hype.",
  },
  {
    category: "Perspectives",
    title: "Machines of Loving Grace — Dario Amodei",
    url: "https://www.darioamodei.com/essay/machines-of-loving-grace",
    description:
      "A long essay by the CEO of Anthropic on what a positive AI future could actually look like — in detail. Most discussion of AI focuses on risk. This is the other side: what does a world where everything goes right look like? Essential reading for the full picture, not just the warnings.",
  },
  {
    category: "Perspectives",
    title: "Horses — Andy Jones",
    url: "https://andyljones.com/posts/horses.html",
    description:
      "A short, uncomfortable essay. Horses were once central to the economy — transport, agriculture, war. Then they weren't. Jones asks what happens to a species when its primary economic role disappears. Read slowly.",
  },
  {
    category: "Context & Frameworks",
    title: "Maslow's Hierarchy of Needs",
    url: "https://en.wikipedia.org/wiki/Maslow%27s_hierarchy_of_needs",
    description:
      "The framework Future Together uses to think about preparing for different futures. If things go badly, we start at the bottom — physiological needs, safety, shelter — and plan up from there. If things go well, we think about how to help people reach the top of the pyramid. A useful map for conversations that might otherwise feel abstract.",
  },
  {
    category: "Context & Frameworks",
    title: "Why Robotics Will Work — Final Offshoring",
    url: "https://finaloffshoring.com",
    description:
      "A clear-eyed look at the economics driving physical automation. The argument: robotics will follow the same cost-curve trajectory as software AI — and the timeline is shorter than most people expect.",
  },
  {
    category: "Preparation & Resilience",
    title: "What is Transition? — Transition Network",
    url: "https://transitionnetwork.org/about-the-movement/what-is-transition/",
    description:
      "A model of what community-led resilience actually looks like in practice. Transition groups around the world have been building local food production, energy independence, and strong community networks for years. Whatever disruption comes — economic, technological, environmental — the social infrastructure this movement builds is what makes communities genuinely resilient.",
  },
  {
    category: "Preparation & Resilience",
    title: "How Catastrophes Impact Access to Food — ALLFED",
    url: "https://allfed.info/about/catastrophic-risks-to-food",
    description:
      "ALLFED (Alliance to Feed the Earth in Disasters) is a nonprofit research organisation that studies what happens to global food systems when things go seriously wrong — nuclear winter, supervolcanic eruption, grid collapse from cyberattack or solar storm, simultaneous crop failures across multiple regions. A clear-eyed map of the scenarios worth understanding, and why local resilience matters.",
  },
  {
    category: "Stay Informed",
    title: "Import AI — Jack Clark",
    url: "https://importai.substack.com/",
    description:
      "A weekly newsletter tracking AI capabilities research, written by Jack Clark (co-founder of Anthropic). Technical but not impenetrable — if you want to stay across what AI systems can actually do week to week, this is the most reliable signal in the noise.",
  },
  {
    category: "Stay Informed",
    title: "Situation Monitor — Global Situation",
    url: "https://hipcityreg-situation-monitor.vercel.app/",
    description:
      "A live overview of what's happening in the world \u2014 not just AI, but the full picture: military operations, environmental disruptions, political turmoil, border tensions. The things that can compound and cascade. Useful context for understanding what kind of future we might actually be preparing for.",
  },
];

const internalResources: InternalResource[] = [
  {
    label: "Community",
    title: "Meetup Slideshow",
    href: "/meetups/slideshow",
    description:
      "The slideshow used in our monthly online meetups — a visual walkthrough of the key ideas, questions, and frameworks we discuss together. A good starting point if you're new.",
  },
  {
    label: "Community",
    title: "Blog",
    href: "/blog",
    description:
      "Writing from the Future Together community. Experiences, observations, and analysis from people navigating AI-driven change in their own lives and work.",
  },
];

const categories = [
  "Perspectives",
  "Context & Frameworks",
  "Preparation & Resilience",
  "Stay Informed",
];

export default define.page(function Resources() {
  return (
    <>
      <Head>
        <title>Resources — Future Together</title>
        <meta
          name="description"
          content="Curated reading, watching, and tools for understanding what AI is doing to the world — and how we prepare. Honest perspectives, not hype."
        />
      </Head>

      {/* Hero */}
      <section class="text-white pt-16" style="background-color: #1a5f6e;">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <p
            class="text-sm font-semibold uppercase tracking-widest mb-4"
            style="color: rgba(255,255,255,0.6);"
          >
            Curated reading &amp; watching
          </p>
          <h1 class="text-4xl sm:text-5xl font-bold mb-5">
            Resources
          </h1>
          <p
            class="text-lg leading-relaxed"
            style="color: rgba(255,255,255,0.8);"
          >
            A small, carefully chosen collection of writing, video, and tools
            for people trying to understand what's actually happening — and what
            it means for how we live and work.
          </p>
        </div>
      </section>

      {/* External resources */}
      <section class="py-20 sm:py-28" style="background-color: #f7f4ef;">
        <div class="max-w-3xl mx-auto px-4 sm:px-6">
          {categories.map((category) => {
            const items = externalResources.filter(
              (r) => r.category === category,
            );
            return (
              <div key={category} class="mb-16 last:mb-0">
                <h2
                  class="text-xs font-semibold uppercase tracking-widest mb-6"
                  style="color: #c4853a;"
                >
                  {category}
                </h2>
                <div class="flex flex-col gap-5">
                  {items.map((resource) => (
                    <a
                      key={resource.url}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="block bg-white rounded-xl p-6 transition-shadow hover:shadow-md group"
                      style="border: 1px solid #d0e4e7;"
                    >
                      <div class="flex items-start justify-between gap-4">
                        <h3
                          class="font-semibold text-base leading-snug group-hover:underline"
                          style="color: #1a5f6e;"
                        >
                          {resource.title}
                        </h3>
                        <span
                          class="flex-shrink-0 mt-0.5"
                          style="color: rgba(28,26,24,0.35);"
                        >
                          <ExternalLinkIcon />
                        </span>
                      </div>
                      <p
                        class="mt-2 text-sm leading-relaxed"
                        style="color: rgba(28,26,24,0.7);"
                      >
                        {resource.description}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Internal / community resources */}
      <section
        class="py-16 sm:py-20"
        style="background-color: #eef5f7; border-top: 1px solid #d0e4e7;"
      >
        <div class="max-w-3xl mx-auto px-4 sm:px-6">
          <h2
            class="text-xs font-semibold uppercase tracking-widest mb-6"
            style="color: #c4853a;"
          >
            From Future Together
          </h2>
          <div class="flex flex-col gap-5">
            {internalResources.map((resource) => (
              <a
                key={resource.href}
                href={resource.href}
                class="block bg-white rounded-xl p-6 transition-shadow hover:shadow-md group"
                style="border: 1px solid #d0e4e7;"
              >
                <div class="flex items-start justify-between gap-4">
                  <h3
                    class="font-semibold text-base leading-snug group-hover:underline"
                    style="color: #1a5f6e;"
                  >
                    {resource.title}
                  </h3>
                  <span
                    class="flex-shrink-0 mt-0.5"
                    style="color: rgba(28,26,24,0.35);"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </div>
                <p
                  class="mt-2 text-sm leading-relaxed"
                  style="color: rgba(28,26,24,0.7);"
                >
                  {resource.description}
                </p>
              </a>
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
            Resources are a starting point. The real work happens in
            conversation — with other people who are paying attention.
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
