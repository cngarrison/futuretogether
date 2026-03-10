/**
 * Resources page data — Future Together
 *
 * To add, remove, or reorder a resource:
 *   - Edit externalResources or internalResources below.
 *   - Category must match one of the CATEGORIES array exactly.
 *   - Run `deno task check` to confirm no type errors.
 */

export interface ExternalResource {
  category: string;
  title: string;
  url: string;
  description: string;
}

export interface InternalResource {
  title: string;
  href: string;
  description: string;
  label: string;
}

export const CATEGORIES = [
  "Perspectives",
  "Context & Frameworks",
  "Preparation & Resilience",
  "Stay Informed",
] as const;

export const externalResources: ExternalResource[] = [
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
    category: "Perspectives",
    title: "What if AI bullishness is right — and bearish? — Citrini Research",
    url: "https://www.citriniresearch.com/p/2028gic",
    description:
      "A scenario piece from a macro research firm, not a prediction. What happens if AI adoption accelerates exactly as the optimists expect — but the speed of disruption outpaces the economy's ability to adapt? A careful look at left-tail economic risks that most AI commentary ignores. Thought-provoking whether or not you buy the scenario.",
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
      "A live overview of what's happening in the world — not just AI, but the full picture: military operations, environmental disruptions, political turmoil, border tensions. The things that can compound and cascade. Useful context for understanding what kind of future we might actually be preparing for.",
  },
];

export const internalResources: InternalResource[] = [
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
