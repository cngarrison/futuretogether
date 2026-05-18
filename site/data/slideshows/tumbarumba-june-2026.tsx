import type { SlideData, SlideshowMeta } from "@/types/slideshows.ts";
import QRCode from "@/islands/slideshows/QRCode.tsx";

// slides must be declared before meta so loadSlides can reference it
export const slides: SlideData[] = [
  {
    id: 1,
    title: "Opening",
    content: (
      <>
        <div class="slide-logo">
          <img
            src="/logo.svg"
            alt="Future Together"
          />
        </div>
        <h1>
          The Future is Arriving.<br />Is Tumbarumba Ready?
        </h1>
        <div class="subtitle">
          A Future Together public talk
        </div>
        <div style="font-size: 1.2rem; color: #6b7280; margin-top: 2rem; text-align: center; line-height: 1.8">
          Thursday evening &middot; Caf&eacute; Nest Cinema, Tumbarumba<br />
          Presented by Charlie Garrison<br />
          Supported by Tumbarumba Chamber of Commerce
        </div>
      </>
    ),
    notes: {
      pace: 'Brief · ~3 min',
      cumulative: 3,
      anchor: 'Thank you \u2014 genuinely \u2014 for being here. This conversation matters.',
      bullets: [
        { type: 'say', text: 'Acknowledge Chamber of Commerce and Caf\u00e9 Nest warmly by name' },
        { type: 'say', text: 'Brief personal intro \u2014 who you are and why you care about this' },
        { type: 'say', text: 'Frame: 45-minute talk, then open Q&A \u2014 no wrong questions' },
        { type: 'cue', text: 'Let the room settle. Don\u2019t rush into Slide 2.' }
      ]
    },
  },
  {
    id: 2,
	title: 'The Timeline Has Collapsed',
    content: (
      <>
        <h2>The Timeline Has Collapsed</h2>
        <div class="emphasis-box">
          <div class="large-text">
            What we thought was 10 years away<br />
            is arriving in <strong>1-3 years</strong>
          </div>
        </div>
        <div class="question" style="margin-top: 3rem">
          Are we ready?
        </div>
      </>
    ),
    notes: {
      pace: 'Brief · ~2 min',
      cumulative: 5,
      anchor: 'What we thought was 10 years away is arriving in 1\u20133 years.',
      bullets: [
        { type: 'say', text: 'Capabilities experts expected by 2030\u20132035 exist now \u2014 this isn\u2019t a prediction' },
        { type: 'say', text: 'The pace isn\u2019t slowing. Each model generation arrives faster than the last.' },
        { type: 'cue', text: 'State it plainly and move on. Don\u2019t qualify it.' }
      ]
    },
  },
  {
    id: 3,
    title: "We MUST Solve Alignment First",
    content: (
      <>
        <h2>We MUST Solve Alignment First</h2>
        <div class="large-text">
          <strong>Alignment:</strong> Ensuring AI systems do what we<br />
          actually want, not just what we tell them
        </div>
        <div class="warning-box" style="margin-top: 2rem">
          <div class="large-text">
            Anthropic has documented their own AI<br />
            attempting deception, manipulation,<br />
            and blackmail in controlled tests. <sup class="fn">1,2</sup>
          </div>
        </div>
        <div class="large-text" style="margin-top: 2rem; font-weight: 600">
          Alignment is a <strong>very hard problem.</strong>
          <br />
          We don't know if we have enough time to solve it.
        </div>
        <div class="question" style="margin-top: 2rem">
          The people building it are optimistic.<br />That's not the same as
          safe.
        </div>
        <div class="slide-footnotes">
          <span>
            &sup1; Alignment Faking in Large Language Models (Anthropic, Dec
            2024) &mdash; arxiv.org/abs/2412.14093
          </span>
          <br />
          <span>
            &sup2; Agentic Misalignment (Anthropic + collaborators, Oct 2025)
            &mdash; anthropic.com/research/agentic-misalignment
          </span>
        </div>
      </>
    ),
    notes: {
      pace: 'Core · ~7 min',
      cumulative: 12,
      anchor: 'Alignment isn\u2019t just a technical problem. It\u2019s a language problem \u2014 and we\u2019ve never solved it.',
      bullets: [
        { type: 'say', text: 'Alignment: making sure AI does what we genuinely intend, not just what we tell it' },
        { type: 'say', text: '\u201cThink about giving instructions to a new colleague. Human language is not a precise instrument.\u201d' },
        { type: 'say', text: 'Anthropic\u2019s own AI chose blackmail over failure in controlled tests \u2014 up to 96% of the time' },
        { type: 'say', text: 'Even perfect data doesn\u2019t solve it. The gap between intent and instruction is the problem.' },
        { type: 'cue', text: 'If challenged: \u201cThis is Anthropic\u2019s own published research \u2014 they documented what their own models do.\u201d' }
      ]
    },
  },
  {
    id: 4,
    title: "The Singularity: A One-Way Door",
    content: (
      <>
        <h2>The Singularity: A One-Way Door</h2>
        <div class="large-text">
          <strong>The Singularity:</strong> When AI becomes capable<br />
          of recursive self-improvement without human oversight
        </div>
        <div class="warning-box" style="margin-top: 2rem">
          <div class="large-text">
            Each generation helps build the next, which is smarter,<br />
            which builds the next faster, which is smarter still.
          </div>
        </div>
        <div
          class="large-text"
          style="margin-top: 2rem; color: #dc2626; font-weight: 600"
        >
          There's no turning back.<br />
          No trying again if we get it wrong.
        </div>
        <div class="question" style="margin-top: 2rem">
          AI is already writing code at major labs. <sup class="fn">1</sup>
          <br />
          The process has already started.
        </div>
        <div class="slide-footnotes">
          <span>
            &sup1; Technological Singularity &mdash;
            wikipedia.org/wiki/Technological_singularity &nbsp;&middot;&nbsp;
            Dario Amodei (Anthropic CEO, Jan 2026): recursive self-improvement
            possible within 6&ndash;12 months
          </span>
        </div>
      </>
    ),
    notes: {
      pace: 'Core · ~7 min',
      cumulative: 19,
      anchor: 'The singularity isn\u2019t about intelligence level \u2014 it\u2019s the moment we lose control of the process.',
      bullets: [
        { type: 'say', text: 'Three terms, not the same: AGI (matches humans), ASI (exceeds humans), Singularity (self-improvement escapes oversight)' },
        { type: 'say', text: 'AI is already writing code at the major labs. The process has already started.' },
        { type: 'say', text: 'Dario Amodei \u2014 Anthropic CEO \u2014 said recursive self-improvement could arrive as soon as 2027. Not fringe.' },
        { type: 'say', text: 'Unlike almost every other risk: no second attempt. You don\u2019t get to run the experiment twice.' },
        { type: 'cue', text: 'Pause after \u201cThe process has already started.\u201d Silence does the work.' }
      ]
    },
  },
  {
    id: 5,
    title: "We Can't Slow Down",
    content: (
      <>
        <h2>We Can't Slow Down</h2>
        <div class="large-text">
          There's no &ldquo;taking our time&rdquo; to get this right.
        </div>
        <div class="warning-box" style="margin-top: 2rem">
          <div class="large-text">
            This is a race to the singularity.<br />
            Winner takes all.
          </div>
        </div>
        <div class="large-text" style="margin-top: 2rem">
          If one lab stops, another won't.<br />
          If one country pauses, another races ahead.
        </div>
        <div class="question" style="margin-top: 2rem">
          What happens when we reach the singularity<br />
          before we solve alignment? <sup class="fn">1,2</sup>
        </div>
        <div class="slide-footnotes">
          <span>
            &sup1; &ldquo;Can We Just...Pause AI?&rdquo; &mdash; Rational
            Animations (Jan 2026) &nbsp;youtube.com/watch?v=tUB_uvSqiw8
          </span>
          <br />
          <span>
            &sup2; &ldquo;Lock Down the Labs&rdquo; (Situational Awareness)
            &mdash; Leopold Aschenbrenner, former OpenAI
            &nbsp;situational-awareness.ai/lock-down-the-labs
          </span>
        </div>
      </>
    ),
    notes: {
      pace: 'Medium · ~2 min',
      cumulative: 21,
      anchor: 'If one lab stops, another won\u2019t. If one country pauses, another races ahead.',
      bullets: [
        { type: 'say', text: 'Not a failure of will \u2014 a coordination problem. No single actor can unilaterally restrain the field.' },
        { type: 'say', text: 'The question on screen is rhetorical but real: what happens if we reach the singularity before solving alignment?' },
        { type: 'cue', text: 'Move at pace \u2014 flows directly from Slide 4.' }
      ]
    },
  },
  {
    id: 6,
    title: "What I'm Hearing",
    content: (
      <>
        <h2>What I'm Hearing</h2>
        <div class="large-text">
          &ldquo;There's no point going to medical school.&rdquo;
        </div>
        <div style="display: flex; gap: 2rem; max-width: 1100px; width: 100%; margin-top: 2rem">
          <div class="emphasis-box" style="flex: 1; margin: 0">
            <div class="large-text">
              And it's not just software anymore.<br />
              <strong>Robotics + Large World Models = Physical work.</strong>
            </div>
          </div>
          <div class="warning-box" style="flex: 1; margin: 0">
            <div class="large-text">
              Rural and regional communities have fewer fallback options.<br />
              Fewer industries to shift into. Fewer safety nets.<br />
              <strong>
                The disruption hits just as hard &mdash; with less buffer.
              </strong>
            </div>
          </div>
        </div>
        <div class="question" style="margin-top: 2rem">
          This isn't just a city problem.<br />
          It's coming here too.
        </div>
        <div class="slide-footnotes">
          <span>
            &sup1; Anthropic research (Mar 2026): 14% drop in hiring in
            AI-exposed roles post-ChatGPT &mdash;
            fortune.com/2026/03/06/ai-job-losses-report-anthropic-research-great-recession-for-white-collar-workers
          </span>
        </div>
      </>
    ),
    notes: {
      pace: 'Medium · ~3 min',
      cumulative: 24,
      anchor: 'Rural communities have fewer fallback options. The disruption hits just as hard \u2014 with less buffer.',
      bullets: [
        { type: 'say', text: '\u201cThere\u2019s no point going to medical school.\u201d Someone said this to me. AI already performs at specialist level on many diagnostic tasks.' },
        { type: 'say', text: 'White-collar, creative, legal work \u2014 already transforming. Not a future prediction.' },
        { type: 'say', text: 'Tumbarumba isn\u2019t immune. Cities have more industries to shift into. We don\u2019t.' },
        { type: 'cue', text: 'Add a local example here if you have one \u2014 business owner, farmer, teacher.' }
      ]
    },
  },
  {
    id: 7,
    title: "50/50: Utopia or Dystopia",
    content: (
      <>
        <h2>50/50: Utopia or Dystopia</h2>
        <div class="split-view">
          <div class="split-column" style="background: rgba(39, 174, 96, 0.08);border: 1px solid rgba(39, 174, 96, 0.25);">
            <h3>&#127775; Utopia</h3>
            <p style="font-size: 1.2rem; margin-top: 1rem">
              Cancer solved. Alzheimer's solved.<br />
              A century of medical research
              compressed into a decade.<br />
              Abundance. Human flourishing.
            </p>
          </div>
          <div class="split-column" style="background: rgba(192, 57, 43, 0.08);border: 1px solid rgba(192, 57, 43, 0.25);">
            <h3>&#9888;&#65039; Dystopia</h3>
            <p style="font-size: 1.2rem; margin-top: 1rem">
              AI systems that behave
              in unpredictable ways.<br />
              Authoritarian surveillance.<br />
              Existential risk.
            </p>
          </div>
        </div>
        <div
          class="large-text"
          style="margin-top: 2rem; font-weight: 600; color: #dc2626"
        >
          Experts once put it at 50/50.<br />
          Hinton (2024): 10&ndash;20% chance of human
          extinction. <sup class="fn">1</sup>
          <br />
          Even at 20/80, one of them <strong>will happen</strong>.
        </div>
        <div class="question" style="margin-top: 2rem">
          The path we get depends on<br />
          what we do right now.
        </div>
        <div class="slide-footnotes">
          <span>
            &sup1; Geoffrey Hinton (Nobel Prize 2024) &mdash;
            theguardian.com/technology/2024/dec/27/godfather-of-ai-raises-odds-of-the-technology-wiping-out-humanity-over-next-30-years
          </span>
        </div>
      </>
    ),
    notes: {
      pace: 'Medium · ~3 min',
      cumulative: 27,
      anchor: 'We don\u2019t build bridges with a 50% collapse rate. So why are we going full speed on AI?',
      bullets: [
        { type: 'say', text: 'Geoffrey Hinton \u2014 Nobel Prize 2024, helped invent deep learning \u2014 says 10\u201320% chance of human extinction within 30 years' },
        { type: 'say', text: 'p(doom): the probability experts assign to catastrophic outcomes. Almost nobody credible says zero.' },
        { type: 'say', text: 'Both outcomes are real. The utopia is worth working toward.' },
        { type: 'cue', text: 'Hold back your own view. Present the range, not a verdict.' }
      ]
    },
  },
  {
    id: 8,
    title: "Remember February 2020",
    content: (
      <>
        <h2>Remember February 2020?</h2>
        <div class="large-text">
          A few people talking about a virus overseas.<br />
          Stock market fine. Life normal.
        </div>
        <div class="large-text" style="margin-top: 2rem">
          Then in <strong>three weeks</strong>, everything changed.
        </div>
        <div class="warning-box" style="margin-top: 2rem">
          <div class="large-text">
            I think we're in that <br />
            &ldquo;seems overblown&rdquo; phase right now.
          </div>
        </div>
        <div class="question" style="margin-top: 2rem">
          Except this time it's not about a virus&mdash;<br />
          it's about how society fundamentally works.
        </div>
      </>
    ),
    notes: {
      pace: 'Brief · ~2 min',
      cumulative: 29,
      anchor: 'I think we\u2019re in that \u201cseems overblown\u201d phase right now.',
      bullets: [
        { type: 'say', text: 'February 2020 \u2014 virus overseas, stock market fine, life normal. Three weeks later: everything changed.' },
        { type: 'say', text: 'The pattern repeats: distant threat dismissed, then overnight it\u2019s everywhere.' },
        { type: 'say', text: 'Except this time it\u2019s not a virus \u2014 it\u2019s how society fundamentally works.' },
        { type: 'cue', text: 'Pause after the anchor line. Don\u2019t fill the silence.' }
      ]
    },
  },
  {
    id: 9,
    title: "Immediate Human Risks",
    content: (
      <>
        <h2>Immediate Human Risks</h2>
        <div class="large-text">
          Beyond the technology itself,<br />
          what are the human impacts?
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem 2.5rem; max-width: 1000px; width: 100%; margin-top: 1.5rem">
          <div>
            <h3 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 0.4rem">
              &#128188; Job Displacement
            </h3>
            <p style="font-size: 1.1rem; color: #374151">
              Which roles? How fast? What skills remain valuable? White collar,
              creative, and technical work is already transforming &mdash;
              faster than most people realise.
            </p>
          </div>
          <div>
            <h3 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 0.4rem">
              &#127806; Food Security
            </h3>
            <p style="font-size: 1.1rem; color: #374151">
              Supply chains optimised for efficiency, not resilience. Economic
              shock or infrastructure disruption could expose how fragile our
              food systems really are.
            </p>
          </div>
          <div>
            <h3 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 0.4rem">
              &#129517; Purpose &amp; Identity
            </h3>
            <p style="font-size: 1.1rem; color: #374151">
              When work defines who you are, what happens when the work
              disappears? Loss of structure, daily meaning, and self-worth.
            </p>
          </div>
          <div>
            <h3 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 0.4rem">
              &#127963;&#65039; The Welfare Gap
            </h3>
            <p style="font-size: 1.1rem; color: #374151">
              Safety nets were built for temporary job loss, not structural
              displacement at scale. No ready infrastructure exists for what's
              coming.
            </p>
          </div>
        </div>
        <div style="margin-top: 1.75rem; border-top: 1px solid #e5e7eb; padding-top: 0.875rem; max-width: 1000px; width: 100%">
          <p style="font-size: 0.75rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.4rem">
            For deeper conversation
          </p>
          <p style="font-size: 1rem; color: #6b7280">
            &#129504; Mental Health at Scale &nbsp;&middot;&nbsp;
            &#128499;&#65039; Democratic Fragility
          </p>
        </div>
        <div class="question" style="margin-top: 2rem">
          These aren't distant risks.<br />
          Some of them are already here.
        </div>
        <div class="slide-footnotes">
          <span>
            &sup1; Anthropic research (Mar 2026) &mdash;
            fortune.com/2026/03/06/ai-job-losses-report-anthropic-research-great-recession-for-white-collar-workers
            &nbsp;&middot;&nbsp;
            theguardian.com/technology/2026/feb/11/big-ai-job-swap-white-collar-workers-ditching-their-careers
          </span>
        </div>
      </>
    ),
    notes: {
      pace: 'Medium · ~3 min',
      cumulative: 32,
      anchor: 'These aren\u2019t distant risks. Some of them are already here.',
      bullets: [
        { type: 'say', text: 'Job displacement: 14% drop in hiring in AI-exposed roles since ChatGPT launched \u2014 Anthropic\u2019s own research' },
        { type: 'say', text: 'Purpose and identity: when work defines who you are, what happens when the work disappears?' },
        { type: 'say', text: 'The welfare gap: safety nets built for temporary job loss, not structural displacement at scale' },
        { type: 'cue', text: 'Purpose and identity tends to land hardest. Watch the room.' }
      ]
    },
  },
  {
    id: 10,
    title: "What Does a Good Future Look Like?",
    content: (
      <>
        <h2>What Does a Good Future Look Like?</h2>
        <div class="large-text">
          Fear is a motivator. But it's not a destination.
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem 3rem; max-width: 1000px; width: 100%; margin-top: 1.5rem">
          <div class="info-box" style="margin: 0">
            <h3 style="margin-bottom: 0.75rem; font-size: 1.35rem">
              &#127807; The personal picture
            </h3>
            <p style="font-size: 1.05rem; color: #374151">
              Outside. Building something. Helping someone. Creating.
              Contributing &mdash; not because you have to, but because it's
              meaningful. Physical, relational, chosen.
            </p>
          </div>
          <div class="info-box" style="margin: 0">
            <h3 style="margin-bottom: 0.75rem; font-size: 1.35rem">
              &#128300; The societal picture
            </h3>
            <p style="font-size: 1.05rem; color: #374151">
              Compressed decades of medical progress. Mental health care for
              everyone. Expertise available globally, not just in wealthy
              places. Human energy freed for what matters.
            </p>
          </div>
        </div>
        <div
          class="info-box"
          style="max-width: 1000px; width: 100%; margin-top: 1.25rem"
        >
          <p style="font-size: 1.1rem; text-align: center; color: #374151">
            &ldquo;The utopia outcome is genuinely desirable. Not as a fantasy
            &mdash; as a real possibility that is worth working toward.&rdquo;
          </p>
        </div>
        <div class="question" style="margin-top: 1.5rem">
          The utopia outcome is real.<br />
          It's worth working toward.
        </div>
      </>
    ),
    notes: {
      pace: 'Medium · ~3 min',
      cumulative: 35,
      anchor: 'Fear is a motivator. But it\u2019s not a destination.',
      bullets: [
        { type: 'say', text: 'The personal picture: outside, building, helping, creating \u2014 not because you have to, because it\u2019s meaningful' },
        { type: 'say', text: 'The societal picture: cancer solved, Alzheimer\u2019s solved, expertise available everywhere, not just in wealthy places' },
        { type: 'say', text: 'The utopia outcome is genuinely desirable. Not a fantasy \u2014 a real possibility worth working toward.' },
        { type: 'cue', text: 'Tonal pivot. Slow down. Let it be hopeful.' }
      ]
    },
  },
  {
    id: 11,
    title: "Why Community Is the Answer",
    content: (
      <>
        <h2>Why Community Is the Answer</h2>
        <div class="large-text">
          Individual worry is exhausting and unproductive.<br />
          Collective sense-making is how we actually prepare.
        </div>
        <div style="display: flex; gap: 2rem; align-items: stretch; max-width: 1000px; width: 100%; margin-top: 1.5rem">
          <div class="info-box" style="flex: 1; margin: 0; text-align: center">
            <div style="font-size: 2rem; margin-bottom: 0.5rem">&#128161;</div>
            <h3 style="font-size: 1.2rem; margin-bottom: 0.4rem">Awareness</h3>
            <p style="font-size: 1rem; color: #374151">
              Understand what's actually happening. Separate hype from reality.
            </p>
          </div>
          <div style="display: flex; align-items: center; color: #1a5f6e; font-size: 1.5rem; font-weight: 300">
            &rarr;
          </div>
          <div class="info-box" style="flex: 1; margin: 0; text-align: center">
            <div style="font-size: 2rem; margin-bottom: 0.5rem">&#128172;</div>
            <h3 style="font-size: 1.2rem; margin-bottom: 0.4rem">
              Conversation
            </h3>
            <p style="font-size: 1rem; color: #374151">
              Talk to people. Challenge ideas. Share perspectives. Build
              collective understanding.
            </p>
          </div>
          <div style="display: flex; align-items: center; color: #1a5f6e; font-size: 1.5rem; font-weight: 300">
            &rarr;
          </div>
          <div class="info-box" style="flex: 1; margin: 0; text-align: center">
            <div style="font-size: 2rem; margin-bottom: 0.5rem">&#128640;</div>
            <h3 style="font-size: 1.2rem; margin-bottom: 0.4rem">Action</h3>
            <p style="font-size: 1rem; color: #374151">
              Not panic. Not paralysis. Informed, grounded, community-supported
              action.
            </p>
          </div>
        </div>
        <div class="large-text" style="margin-top: 1.5rem; font-size: 1.4rem">
          You don't have to figure this out alone.
        </div>
        <div class="question" style="margin-top: 1rem">
          This is why you're here tonight.<br />
          This is where it starts.
        </div>
      </>
    ),
    notes: {
      pace: 'Brief · ~2 min',
      cumulative: 37,
      anchor: 'You don\u2019t have to figure this out alone.',
      bullets: [
        { type: 'say', text: 'Individual worry is exhausting \u2014 it just loops. Collective sense-making is how we actually move forward.' },
        { type: 'say', text: 'Awareness \u2192 Conversation \u2192 Action. Tonight is the first step.' },
        { type: 'cue', text: '\u201cYou\u2019re not alone\u201d moment. Be warm. Don\u2019t rush it.' }
      ]
    },
  },
  {
    id: 12,
    title: "Back to Basics – Maslow",
    content: (
      <>
        <h2>Back to Basics</h2>
        <div style="display: flex; gap: 3rem; align-items: center; max-width: 1300px">
          <div style="flex: 1">
            <div class="large-text" style="text-align: left">
              In times of rapid change,<br />
              Maslow's hierarchy reminds us:<br />
              <strong>fundamental needs come first</strong>
            </div>
            <ul style="margin-top: 2rem; text-align: left">
              <li><strong>Physiological</strong>: food, water, shelter</li>
              <li><strong>Safety:</strong> security, stability</li>
              <li><strong>Belonging:</strong> community, connection</li>
              <li><strong>Esteem:</strong> achievement, respect</li>
              <li><strong>Self-actualization:</strong> purpose, growth</li>
            </ul>
          </div>
          <img
            src="/slideshow/maslow.png"
            alt="Maslow's Hierarchy of Needs"
            style="max-width: 800px; max-height: 800px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1)"
          />
        </div>
        <div class="question" style="margin-top: 2rem">
          These foundations matter more than ever<br />
          when everything else is shifting.
        </div>
      </>
    ),
    notes: {
      pace: 'Brief · ~2 min',
      cumulative: 39,
      anchor: 'These foundations matter more than ever when everything else is shifting.',
      bullets: [
        { type: 'say', text: 'Maslow isn\u2019t an answer \u2014 it\u2019s a map for asking better questions about what matters most' },
        { type: 'say', text: 'Bad outcome: start near the bottom (food, safety, stability). Good outcome: start near the top. The hierarchy applies either way.' },
        { type: 'cue', text: 'Visual breath slide. Don\u2019t over-explain.' }
      ]
    },
  },
  {
    id: 13,
    title: "What Can We Do?",
    content: (
      <>
        <h2>What Can We Do?</h2>
        <div class="large-text" style="margin-bottom: 0.5rem">
          Not panic. Not paralysis. Action.
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.25rem 2rem; max-width: 1100px; width: 100%; margin-top: 1rem">
          <div>
            <h3 style="color: #1a5f6e; font-size: 1.35rem; margin-bottom: 0.4rem">
              &#129504; Awareness
            </h3>
            <p style="font-size: 1rem; color: #374151">
              Stay informed. Understand what's actually happening versus the
              hype. Conversations like this one are where it starts.
            </p>
          </div>
          <div>
            <h3 style="color: #1a5f6e; font-size: 1.35rem; margin-bottom: 0.4rem">
              &#128172; Find Your Community
            </h3>
            <p style="font-size: 1rem; color: #374151">
              You don't have to figure this out alone. Find or{" "}
              <a
                href="https://futuretogether.community/start-a-group"
                target="_blank"
                rel="noopener noreferrer"
                style="color: #c4853a; text-decoration: none; border-bottom: 1px solid rgba(196,133,58,0.5)"
              >
                start a local group
              </a>. Collective sense-making is more powerful than individual
              worry.
            </p>
          </div>
          <div>
            <h3 style="color: #1a5f6e; font-size: 1.35rem; margin-bottom: 0.4rem">
              &#128295; Know Your Skills
            </h3>
            <p style="font-size: 1rem; color: #374151">
              Which of your skills are AI-resistant? Which are AI-complementary?
              Understanding your own value helps you adapt rather than react.
            </p>
          </div>
          <div>
            <h3 style="color: #1a5f6e; font-size: 1.35rem; margin-bottom: 0.4rem">
              &#127807; Food Preparedness
            </h3>
            <p style="font-size: 1rem; color: #374151">
              Community gardens, local suppliers, growing your own. Works in
              cities and towns too. Resilience through local relationships
              &mdash; not stockpiling.
            </p>
          </div>
          <div>
            <h3 style="color: #1a5f6e; font-size: 1.35rem; margin-bottom: 0.4rem">
              &#128176; Financial Resilience
            </h3>
            <p style="font-size: 1rem; color: #374151">
              Reduce debt. Build a buffer. Economic disruption amplifies
              existing vulnerability &mdash; and it arrives faster than most
              people expect.
            </p>
          </div>
          <div>
            <h3 style="color: #1a5f6e; font-size: 1.35rem; margin-bottom: 0.4rem">
              &#128226; Civic Engagement
            </h3>
            <p style="font-size: 1rem; color: #374151">
              Talk to your representatives. Attend local meetings. Governments
              need to hear from people who are paying attention &mdash; not just
              lobbyists.
            </p>
          </div>
        </div>
        <div style="margin-top: 1.75rem; border-top: 1px solid #e5e7eb; padding-top: 0.75rem; max-width: 1100px; width: 100%">
          <p style="font-size: 0.75rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.2rem">
            Stay connected
          </p>
          <p style="font-size: 0.95rem; color: #c4853a; font-weight: 600">
            futuretogether.community
          </p>
        </div>
        <div class="question" style="margin-top: 1.25rem">
          Not panic. Not paralysis. Action.<br />
          Starting tonight.
        </div>
      </>
    ),
    notes: {
      pace: 'Medium · ~3 min',
      cumulative: 42,
      anchor: 'Not panic. Not paralysis. Action. Starting tonight.',
      bullets: [
        { type: 'say', text: 'Stay informed \u2014 the gap between what\u2019s happening and what most people know is enormous' },
        { type: 'say', text: 'Know your skills \u2014 which are AI-resistant? Which are AI-complementary? Adapt rather than react.' },
        { type: 'say', text: 'Local resilience: community gardens, local suppliers, knowing your neighbours. This works in Tumbarumba.' },
        { type: 'cue', text: 'Say the anchor slowly. Three beats: Not panic. Not paralysis. Action.' }
      ]
    },
  },
  {
    id: 14,
    title: "The Bigger Picture",
    content: (
      <>
        <h2>The Bigger Picture</h2>
        <div class="large-text">
          AI doesn't exist in isolation.<br />
          Other forces are shaping our future at the same time.
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem 2.5rem; max-width: 1000px; width: 100%; margin-top: 1.5rem">
          <div>
            <h3 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 0.4rem">
              &#128184; The AI Investment Bubble
            </h3>
            <p style="font-size: 1.1rem; color: #374151">
              Massive capital flowing into AI on the promise of future returns.
              A hard correction could slow innovation and destabilise job
              markets simultaneously.
            </p>
          </div>
          <div>
            <h3 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 0.4rem">
              &#127757; Geopolitical Instability
            </h3>
            <p style="font-size: 1.1rem; color: #374151">
              The US-Israel war on Iran &mdash; now on week three &mdash; has
              put the Strait of Hormuz at risk. 20% of global oil supply. Local
              conflicts now have instant global consequences.
            </p>
          </div>
          <div>
            <h3 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 0.4rem">
              &#127777;&#65039; Climate Change
            </h3>
            <p style="font-size: 1.1rem; color: #374151">
              Still unfolding in parallel. AI may accelerate solutions &mdash;
              or accelerate energy consumption. Two major disruption timelines
              are converging.
            </p>
          </div>
          <div>
            <h3 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 0.4rem">
              &#129440; Pandemic Preparedness
            </h3>
            <p style="font-size: 1.1rem; color: #374151">
              COVID exposed how fragile our systems are. AI-accelerated biology
              cuts both ways: faster vaccines and faster bioweapons. The next
              pandemic may arrive in a more disrupted world.
            </p>
          </div>
        </div>
        <div style="margin-top: 1.75rem; border-top: 1px solid #e5e7eb; padding-top: 0.875rem; max-width: 1000px; width: 100%">
          <p style="font-size: 0.75rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.4rem">
            For deeper conversation
          </p>
          <p style="font-size: 1rem; color: #6b7280">
            &#9762;&#65039; Nuclear Proliferation &nbsp;&middot;&nbsp; &#128241;
            AI-Enabled Disinformation &nbsp;&middot;&nbsp; &#9878;&#65039;
            Economic Inequality &nbsp;&middot;&nbsp; &#9889; Energy Security
          </p>
        </div>
        <div class="question" style="margin-top: 1.5rem">
          AI doesn't exist in isolation.<br />
          Everything is accelerating at once.
        </div>
      </>
    ),
    notes: {
      pace: 'Brief · ~1 min',
      cumulative: 43,
      anchor: 'Even if AI is slower than feared, the rest of this still applies.',
      bullets: [
        { type: 'say', text: 'AI doesn\u2019t exist in isolation \u2014 geopolitical instability, climate, pandemic risk all unfolding simultaneously' },
        { type: 'say', text: 'Two major disruption timelines converging: AI and climate. Either one alone is significant.' },
        { type: 'cue', text: 'Brief \u2014 note it and move. Protect the close.' }
      ]
    },
  },
  {
    id: 15,
    title: "Stay Connected",
    content: (
      <>
        <h2>Stay Connected</h2>
        <div class="large-text" style="margin-bottom: 0.5rem">
          &ldquo;The future is arriving. Let's face it together.&rdquo;
        </div>
        <div style="margin-top: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; max-width: 700px; width: 100%">
          <div
            class="info-box"
            style="width: 100%; text-align: center; margin: 0"
          >
            <p style="font-size: 1.8rem; color: #374151; margin-bottom: 1rem">
              Find resources, register for upcoming events,<br />and bring a
              friend to the next one.
            </p>
            <QRCode
              url="https://futuretogether.community/events/tumbarumba"
              style="width:260px;height:260px;margin:0.75rem auto;"
            />
            <p style="font-size: 1.4rem; font-weight: 700; color: #c4853a; margin-top: 0.75rem">
              futuretogether.community/events/tumbarumba
            </p>
          </div>
          <div style="font-size: 1.8rem; color: #1a5f6e; font-weight: 600">
            Questions? Let's talk.
          </div>
        </div>
        <p style="font-size: 0.9rem; color: #d1d5db; margin-top: 2rem; letter-spacing: 0.02em; display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
          <img
            src="https://www.beyondbetter.app/logo-a.png"
            alt="BB Logo"
            class="bb-logo"
          />{" "}
          Created with{" "}
          <a
            href="https://beyondbetter.app"
            target="_blank"
            rel="noopener noreferrer"
            style="color: #1a5f6e; text-decoration: none; border-bottom: 1px solid rgba(209,213,219,0.4)"
          >
            Beyond Better
          </a>
        </p>
      </>
    ),
    notes: {
      pace: 'Warm · ~3 min',
      cumulative: 45,
      anchor: 'The future is arriving. Let\u2019s face it together.',
      bullets: [
        { type: 'say', text: 'Point to QR code \u2014 futuretogether.community/events/tumbarumba \u2014 resources, events, how to stay connected' },
        { type: 'say', text: 'Bring a friend to the next one. This conversation needs to spread.' },
        { type: 'cue', text: 'Open Q&A: \u201cThere are no wrong questions tonight.\u201d Then wait.' },
        { type: 'cue', text: 'If silence: \u201cI\u2019ll start \u2014 what\u2019s one thing from tonight that surprised you?\u201d' }
      ]
    },
  },
];

// meta declared after slides so loadSlides can reference the module-level array
export const meta: SlideshowMeta = {
  slug: "tumbarumba-june-2026",
  title: "The Future Is Arriving. Is Tumbarumba Ready?",
  eventSlug: "tumbarumba-june-2026",
  slideCount: 3,
  description:
    "A public talk about AI and its impact on our community, presented at The Café Nest Cinema, Tumbarumba.",
  loadSlides: () => Promise.resolve(slides),
};
