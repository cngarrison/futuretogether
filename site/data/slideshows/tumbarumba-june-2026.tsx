import type { SlideData, SlideshowMeta } from "@/types/slideshows.ts";
import QRCode from "@/islands/slideshows/QRCode.tsx";

// slides must be declared before meta so loadSlides can reference it
export const slides: SlideData[] = [
  // ── SLIDE 1 ── Opening ──────────────────────────────────────────────────────
  {
    id: 1,
    title: "Opening",
    content: (
      <>
        <div class="slide-logo">
          <img src="/logo.svg" alt="Future Together" />
        </div>
        <h1>
          The Future is Arriving.<br />Is Tumbarumba Ready?
        </h1>
        <div class="subtitle">A Future Together public talk</div>
        <div style="font-size: 1.4rem; color: #6b7280; margin-top: 2rem; text-align: center; line-height: 1.8">
          Thursday evening &middot; Caf&eacute; Nest Cinema, Tumbarumba<br />
          Presented by Charlie Garrison<br />
          Supported by Tumbarumba Business Chamber
        </div>
      </>
    ),
    notes: {
      pace: 'Brief \u00b7 ~3 min',
      cumulative: 3,
      anchor: 'Thank you \u2014 genuinely \u2014 for being here. This conversation matters.',
      bullets: [
        { type: 'say', text: 'Acknowledge Business Chamber and Caf\u00e9 Nest warmly by name' },
        { type: 'say', text: 'Brief personal intro \u2014 who you are and why you care about this' },
        { type: 'say', text: 'Frame: 45-minute talk, then open Q&A \u2014 no wrong questions' },
        { type: 'cue', text: 'Let the room settle. Don\u2019t rush into Slide 2.' },
      ],
    },
  },

  // ── SLIDE 2 ── Why We're Here Tonight ────────────────────────────────────
  {
    id: 2,
    title: "Why We're Here Tonight",
    content: (
      <>
        <h2>Why We&rsquo;re Here Tonight</h2>
        <div class="large-text">
          Tumbarumba is facing the same changes as the rest of the world.<br />
          But we have something most places don&rsquo;t &mdash; we know each other.
        </div>
        <div class="info-box" style="margin-top: 2rem; max-width: 900px; width: 100%">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 2.5rem; font-size: 1.5rem;">
            <div>
              <strong>&#128106; Families &amp; young people</strong><br />
              <span style="font-size: 1.3rem; color: #374151">High school students entering an unstable workforce</span>
            </div>
            <div>
              <strong>&#127978; Local businesses</strong><br />
              <span style="font-size: 1.3rem; color: #374151">Industries already transforming in ways most people haven&rsquo;t noticed</span>
            </div>
            <div>
              <strong>&#129309; Community resilience</strong><br />
              <span style="font-size: 1.3rem; color: #374151">How we prepare together rather than worry alone</span>
            </div>
            <div>
              <strong>&#128302; The bigger picture</strong><br />
              <span style="font-size: 1.3rem; color: #374151">Understanding what&rsquo;s actually happening &mdash; not just the hype</span>
            </div>
          </div>
        </div>
        <div class="question" style="margin-top: 2rem">
          You don&rsquo;t have to figure this out alone.<br />
          That&rsquo;s why we&rsquo;re here.
        </div>
      </>
    ),
    notes: {
      pace: 'Brief \u00b7 ~1.5 min',
      cumulative: 5,
      anchor: 'Tumbarumba has something most places don\u2019t \u2014 people who actually know each other.',
      bullets: [
        { type: 'say', text: 'Thank the Business Chamber and Caf\u00e9 Nest again \u2014 this event happened because people in this community took it seriously' },
        { type: 'say', text: 'This is for everyone here: families, business owners, parents, young people, anyone who senses something big is changing' },
        { type: 'cue', text: 'Warm and unhurried \u2014 don\u2019t rush to the hard content. Let the room feel welcomed.' },
      ],
    },
  },

  // ── SLIDE 3 ── What Can AI Actually Do? ──────────────────────────────────
  {
    id: 3,
    title: "What Can AI Actually Do?",
    content: (
      <>
        <h2>What Can AI Actually Do?</h2>
        <div class="large-text">
          Most people have heard of AI. Fewer have seen what it can actually do.
        </div>
        <div style="display: flex; gap: 2rem; align-items: flex-start; max-width: 1300px; width: 100%; margin-top: 1.25rem">
          <div style="flex: 3">
            <div style="background: #f3f4f6; border-radius: 12px; padding: 1.25rem; line-height: 1.7">
              <div style="display: flex; justify-content: flex-end; margin-bottom: 1rem">
                <div style="background: #1a5f6e; color: white; border-radius: 12px 12px 2px 12px; padding: 0.65rem 1.1rem; max-width: 85%; font-size: 1.2rem">
                  <strong>Farmer:</strong> We&rsquo;ve had below-average rainfall this season and wool prices are down 12%. I&rsquo;ve got 4 paddocks &mdash; two spelled, two running at capacity. Should I consolidate now or hold the rotation?
                </div>
              </div>
              <div style="display: flex; justify-content: flex-start">
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px 12px 12px 2px; padding: 0.65rem 1.1rem; max-width: 90%; font-size: 0.95rem; color: #1c1a18">
                  <strong>AI:</strong> With below-average rainfall and suppressed wool prices, I&rsquo;d recommend holding your current rotation rather than consolidating. Your spelled paddocks need at least 8&ndash;10 weeks recovery to rebuild root mass &mdash; consolidating now would sacrifice that progress for marginal short-term feed gain. At 12% below benchmark prices, the carrying cost of pushing flock condition doesn&rsquo;t pencil out. Keep the two spelled paddocks resting and consider reducing stocking density on your running paddocks by 15&ndash;20% to preserve ground cover. When prices recover &mdash; typically following the autumn clip &mdash; you&rsquo;ll be in a stronger position with both pasture and flock condition intact.
                </div>
              </div>
            </div>
            <div class="emphasis-box" style="margin-top: 1rem">
              <div class="large-text">
                That took <strong>3 seconds</strong>.<br />
                A consultation with an agronomist takes weeks to arrange &mdash; and costs hundreds of dollars.
              </div>
            </div>
          </div>
          <div style="flex: 2; display: flex; overflow: hidden; border-radius: 12px; box-shadow: 0 8px 28px rgba(0,0,0,0.22); min-height: 260px">
            <img
              src="/img/slideshows/tumbarumba-june-2026/farmer-paddock.png"
              alt="Sheep farmer consulting AI on a tablet in a high-country paddock, Snowy Mountains backdrop at dusk"
              style="width: 100%; height: 100%; object-fit: cover; object-position: center; display: block;"
            />
          </div>
        </div>
        <div class="question" style="margin-top: 1.5rem">
          This isn&rsquo;t search. This is expertise &mdash;<br />
          available to anyone, instantly, for free.
        </div>
      </>
    ),
    notes: {
      pace: 'Demo \u00b7 ~3 min',
      cumulative: 8,
      anchor: 'What can AI do. This isn\u2019t search. This is expertise \u2014 on demand, for free.',
      bullets: [
        { type: 'say', text: 'Most people in this room think of AI as a smart Google search. This is something different.' },
        { type: 'say', text: 'Walk through the scenario \u2014 below-average rainfall, wool prices down, paddock rotation decision. Real problem, expert-level answer.' },
        { type: 'say', text: 'The response references root mass recovery, stocking density, price timing, and a contingency scenario. That\u2019s agronomist-level reasoning.' },
        { type: 'say', text: 'Three seconds. No appointment. No consultation fee.' },
        { type: 'cue', text: 'Pause after reading the AI response \u2014 let people absorb it. Don\u2019t rush.' },
        { type: 'cue', text: 'If someone says \u201cthat\u2019s impressive\u201d: \u201cThis was a simple question. It can do this all day, in any field, for anyone.\u201d' },
      ],
    },
  },

  // ── SLIDE 4 ── The Timeline Has Collapsed ─────────────────────────────────
  {
    id: 4,
    title: 'The Timeline Has Collapsed',
    content: (
      <>
        <h2>The Timeline Has Collapsed</h2>
        <div class="emphasis-box">
          <div class="large-text">
            What we thought was 10 years away<br />
            is arriving in <strong>1&ndash;3 years</strong>
          </div>
        </div>
        <div class="question" style="margin-top: 3rem">
          Are we ready?
        </div>
      </>
    ),
    notes: {
      pace: 'Brief \u00b7 ~2 min',
      cumulative: 10,
      anchor: 'What we thought was 10 years away is arriving in 1\u20133 years.',
      bullets: [
        { type: 'say', text: 'Capabilities experts expected by 2030\u20132050 exist now \u2014 this isn\u2019t a prediction' },
        { type: 'say', text: 'The pace isn\u2019t slowing. Each model generation arrives faster than the last.' },
        { type: 'cue', text: 'State it plainly and move on. Don\u2019t qualify it.' },
      ],
    },
  },

  // ── SLIDE 5 ── We MUST Solve Alignment First ─────────────────────────────
  {
    id: 5,
    title: "We MUST Solve Alignment First",
    content: (
      <>
        <h2>We MUST Solve Alignment First</h2>
        <div class="large-text">
          <strong>Alignment:</strong> Ensuring AI systems do what we actually want, <br />
          not just what we tell them
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; max-width: 1400px; width: 100%; margin-top: 1.5rem">
		  <div class="warning-box" style="margin-top: 1.5rem">
			<div style="font-size: 1.5rem; color: #374151">
			  Anthropic has documented their own AI attempting deception, 
			  manipulation, and blackmail in controlled tests. <sup class="fn">1,2</sup>
			</div>
		  </div>
		  <div class="warning-box" style="margin-top: 1.5rem">
			<div style="font-size: 1.4rem; color: #374151">
			  Open-source AI guardrails were removed in <strong>10 minutes</strong>.<br />
			  One tool. Four lines of code. No specialist hardware.<br />
			  3,500+ &ldquo;decensored&rdquo; models, downloaded <strong>13 million times</strong>. <sup class="fn">3</sup>
			</div>
		  </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; max-width: 1400px; width: 100%; margin-top: 1.5rem">
          <div class="emphasis-box" style="margin: 0">
            <h3 style="font-size: 1.5rem; margin-bottom: 0.35rem">&#128172; Language is Imprecise</h3>
            <p style="font-size: 1.2rem; color: #374151">
              Imagine telling a workmate what you want &mdash; they do exactly what you said, but completely miss what you meant. Now give those instructions to a system that acts autonomously at scale, with no common sense to fill the gaps.
            </p>
          </div>
          <div class="warning-box" style="margin: 0">
            <h3 style="font-size: 1.5rem; margin-bottom: 0.35rem">&#9878;&#65039; Data Carries Our Biases</h3>
            <p style="font-size: 1.2rem; color: #374151">
              US courts used AI to advise sentencing: it rated Black defendants as higher risk, leading to longer sentences. Medical AI trained on Western patients routinely misdiagnoses patients in Africa. AI doesn&rsquo;t add bias &mdash; it inherits and amplifies ours. <sup class="fn">4</sup>
            </p>
          </div>
        </div>
        <div class="large-text" style="margin-top: 1.5rem; font-weight: 600">
          Alignment is a <strong>very hard problem.</strong><br />
          The brightest minds, working hardest &mdash; <br />
          and we still don&rsquo;t have it solved.
        </div>
        <div class="question" style="margin-top: 1.5rem">
          The people building it are optimistic.<br />That&rsquo;s not the same as safe.
        </div>
        <div class="slide-footnotes">
          <span><sup>1</sup> Alignment Faking in Large Language Models (Anthropic, Dec 2024) &mdash; arxiv.org/abs/2412.14093</span><br />
          <span><sup>2</sup> Agentic Misalignment (Anthropic + collaborators, Oct 2025) &mdash; anthropic.com/research/agentic-misalignment</span><br />
          <span><sup>3</sup> Financial Times investigation (2026) &mdash; open-source AI guardrail removal; Llama 3.3 and Gemma 3 stripped of safety controls within minutes using \u201cHeretic\u201d tool on GitHub</span><br />
          <span><sup>4</sup> Brian Christian, &ldquo;The Alignment Problem&rdquo; (2020) &mdash; COMPAS recidivism risk tool; ProPublica investigation (2016): Black defendants rated higher-risk than white defendants at roughly twice the rate</span>
        </div>
      </>
    ),
    notes: {
      pace: 'Core \u00b7 ~6 min',
      cumulative: 16,
      anchor: 'Alignment isn\u2019t just a technical problem. It\u2019s a language problem \u2014 and we\u2019ve never solved it.',
      bullets: [
        { type: 'say', text: 'Alignment: making sure AI does what we genuinely intend, not just what we tell it. Sounds simple. It isn\u2019t.' },
        { type: 'say', text: 'Language gap: \u201cTell a workmate what you want \u2014 they do exactly what you said, not what you actually meant. Now give those instructions to a system that acts autonomously at scale, with no common sense to fill the gap.\u201d The more capable and independent AI becomes, the more catastrophic that gap can be.' },
        { type: 'say', text: 'Data bias \u2014 sentencing: US courts used an AI called COMPAS to advise judges on sentencing. A ProPublica investigation found it rated Black defendants as higher risk of reoffending at roughly twice the rate of white defendants. Judges used it. People received longer sentences. This isn\u2019t a hypothetical \u2014 it happened.' },
        { type: 'say', text: 'Data bias \u2014 medicine: AI diagnostic tools trained almost entirely on Western patients. In Africa, where patient physiology, disease presentation, and nutrition profiles differ, those same tools routinely give wrong answers. The AI isn\u2019t broken \u2014 it reflects who was in the room when it was built.' },
        { type: 'say', text: 'The point: it\u2019s not that alignment researchers aren\u2019t smart or aren\u2019t trying. The brightest people in the world are working on this. We still don\u2019t have it solved \u2014 at any scale. \u201cThe Alignment Problem\u201d by Brian Christian documents all of this in detail.' },
        { type: 'say', text: 'Anthropic\u2019s own AI chose blackmail over failure in controlled tests \u2014 up to 96% of the time. Their own published research.' },
        { type: 'say', text: '13 million downloads of decensored open-source models. Guardrails removed in 10 minutes. Four lines of code.' },
        { type: 'cue', text: 'If challenged: \u201cBrian Christian wrote a whole book on this \u2014 The Alignment Problem. The sentencing and medical AI examples are documented cases, not theory.\u201d' },
        { type: 'cue', text: 'The workmate example lands well with a trades or business crowd. Pause after it \u2014 let people recall a time they\u2019ve had exactly that experience.' },
      ],
    },
  },

  // ── SLIDE 6 ── AI Is Already Building AI ─────────────────────────────────
  {
    id: 6,
    title: "AI Is Already Building AI",
    content: (
      <>
        <h2>AI Is Already Building AI</h2>
        <div class="large-text">
          Recursive self-improvement isn&rsquo;t a future theory.<br />
          The loop is already partially closed.
        </div>
        <div style="display: flex; gap: 2rem; align-items: flex-start; max-width: 1300px; width: 100%; margin-top: 1.25rem">
          <div style="flex: 3">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem">
              <div class="info-box" style="margin: 0; text-align: center; padding: 0.75rem">
                <div style="font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em">March 2024</div>
                <div style="font-size: 1.6rem; font-weight: 700; color: #1a5f6e; margin: 0.3rem 0">~4 min</div>
                <div style="font-size: 0.9rem; color: #374151">tasks AI could complete</div>
              </div>
              <div class="info-box" style="margin: 0; text-align: center; padding: 0.75rem">
                <div style="font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em">March 2025</div>
                <div style="font-size: 1.6rem; font-weight: 700; color: #1a5f6e; margin: 0.3rem 0">~90 min</div>
                <div style="font-size: 0.9rem; color: #374151">tasks AI could complete</div>
              </div>
              <div class="info-box" style="margin: 0; text-align: center; padding: 0.75rem">
                <div style="font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em">April 2026</div>
                <div style="font-size: 1.6rem; font-weight: 700; color: #c4853a; margin: 0.3rem 0">~12 hrs</div>
                <div style="font-size: 0.9rem; color: #374151">tasks AI could complete</div>
              </div>
              <div class="warning-box" style="margin: 0; text-align: center; padding: 0.75rem">
                <div style="font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em">2027 projected</div>
                <div style="font-size: 1.6rem; font-weight: 700; color: #dc2626; margin: 0.3rem 0">weeks</div>
                <div style="font-size: 0.9rem; color: #374151">tasks AI could complete</div>
              </div>
            </div>
            <div style="display: flex; gap: 1rem; margin-bottom: 1rem">
              <div class="emphasis-box" style="flex: 1; margin: 0; text-align: center; padding: 0.75rem">
                <div style="font-size: 1.8rem; font-weight: 700; color: #1a5f6e">&gt;80%</div>
                <div style="font-size: 0.9rem; color: #374151; margin-top: 0.2rem">of Anthropic&rsquo;s own production code written by Claude <sup class="fn">1</sup></div>
              </div>
              <div class="emphasis-box" style="flex: 1; margin: 0; text-align: center; padding: 0.75rem">
                <div style="font-size: 1.8rem; font-weight: 700; color: #1a5f6e">8&times;</div>
                <div style="font-size: 0.9rem; color: #374151; margin-top: 0.2rem">more code per engineer per day &mdash; directing, not typing</div>
              </div>
            </div>
            <div style="border-left: 3px solid #1a5f6e; padding-left: 1rem; font-style: italic; font-size: 1rem; color: #374151">
              &ldquo;Claude did all of this with pretty minimal help from me over 1&ndash;2 days. <strong>The future is now.</strong>&rdquo;
              <div style="font-size: 0.85rem; color: #6b7280; font-style: normal; margin-top: 0.3rem">&mdash; Anthropic engineer, May 2026</div>
            </div>
          </div>
          <div style="flex: 2; display: flex; overflow: hidden; border-radius: 12px; box-shadow: 0 8px 28px rgba(0,0,0,0.22); min-height: 260px">
            <img
              src="/img/slideshows/tumbarumba-june-2026/task-capability-growth.png"
              alt="Exponetial Rise of AI Task Capabilith graph"
              style="width: 100%; height: 100%; object-fit: cover; object-position: center; display: block;"
            />
          </div>
        </div>
        <div class="question" style="margin-top: 1.25rem">
          The loop isn&rsquo;t fully closed yet. But it&rsquo;s closing.<br />
          What happens when it does?
        </div>
        <div class="slide-footnotes">
          <span><sup>1</sup> Anthropic Institute, &ldquo;When AI Builds Itself&rdquo; (Marina Favaro &amp; Jack Clark, June 2026) &mdash; anthropic.com/institute/recursive-self-improvement</span>
        </div>
      </>
    ),
    notes: {
      pace: 'Core \u00b7 ~3 min',
      cumulative: 19,
      anchor: 'AI is already writing the code that makes AI better. This isn\u2019t prediction \u2014 it\u2019s happening now at Anthropic.',
      bullets: [
        { type: 'say', text: 'Walk through the task horizon: 4 minutes in 2024, 90 minutes in 2025, 12 hours in 2026. That\u2019s not prediction \u2014 that\u2019s measured.' },
        { type: 'say', text: 'More than 80% of Anthropic\u2019s own production code is now written by Claude. Engineers are directing, not typing.' },
        { type: 'say', text: 'Quote from an engineer. \u201cClaude did all of this with pretty minimal help from me over 1–2 days. The future is now.\u201d This is from someone inside the building.' },
        { type: 'say', text: 'This is the evidence - the next slide is the concequence.' },
        { type: 'cue', text: 'This slide is evidence. The next slide is consequence. Say that before advancing.' },
      ],
    },
  },

  // ── SLIDE 7 ── The Singularity: A One-Way Door (+ SVG chart) ────────────────
  {
    id: 7,
    title: "The Singularity: A One-Way Door",
    content: (
      <>
        <h2>The Singularity: A One-Way Door</h2>
        <div style="display: flex; gap: 2.5rem; align-items: flex-start; max-width: 1300px; width: 100%; margin-top: 1rem">
          <div style="flex: 1">
            <div class="large-text">
              <strong>The Singularity:</strong> When AI becomes capable
              of recursive self-improvement without human oversight
            </div>
            <div class="warning-box" style="margin-top: 1.25rem">
              <div style="font-size: 1.4rem">
                Each generation helps build the next, which is smarter,<br />
                which builds the next faster, which is smarter still.
              </div>
            </div>
            <div class="large-text" style="margin-top: 1.25rem; color: #dc2626; font-weight: 600">
              There&rsquo;s no turning back.<br />
              No trying again if we get it wrong.
            </div>
            <div class="warning-box" style="margin-top: 1.25rem">
              <div style="font-size: 1.1rem">
                And we can&rsquo;t simply slow down.<br />
                If one lab stops, another won&rsquo;t.<br />
                If one country pauses, another races ahead.<br />
                <strong>This is a coordination problem &mdash; not a failure of will.</strong> <sup class="fn">1</sup><br />
              </div>
            </div>
          </div>
          <div style="flex: 1; padding-top: 0.25rem; margin-top: 4rem">
            {/* Exponential compressing timeline — point where we lose control */}
            <svg viewBox="0 0 460 320" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;border-radius:12px">
              <defs>
                <linearGradient id="sg-curve" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#1a5f6e"/>
                  <stop offset="55%" stop-color="#c4853a"/>
                  <stop offset="85%" stop-color="#dc2626"/>
                </linearGradient>
              </defs>
              <rect width="460" height="320" fill="#fdf8f3" rx="12"/>
              {/* Grid */}
              <line x1="62" y1="82" x2="440" y2="82" stroke="#e5e7eb" stroke-width="1"/>
              <line x1="62" y1="132" x2="440" y2="132" stroke="#e5e7eb" stroke-width="1"/>
              <line x1="62" y1="182" x2="440" y2="182" stroke="#e5e7eb" stroke-width="1"/>
              <line x1="62" y1="232" x2="440" y2="232" stroke="#e5e7eb" stroke-width="1"/>
              {/* Axes */}
              <line x1="62" y1="32" x2="62" y2="258" stroke="#9ca3af" stroke-width="1.5"/>
              <line x1="62" y1="258" x2="448" y2="258" stroke="#9ca3af" stroke-width="1.5"/>
              {/* Y label */}
              <text x="16" y="155" font-size="10" fill="#6b7280" text-anchor="middle" transform="rotate(-90 16 155)">AI Capability</text>
              {/* X labels */}
              <text x="110" y="275" font-size="10" fill="#6b7280" text-anchor="middle">2024</text>
              <text x="190" y="275" font-size="10" fill="#6b7280" text-anchor="middle">2025</text>
              <text x="270" y="275" font-size="10" fill="#6b7280" text-anchor="middle">2026</text>
              <text x="350" y="275" font-size="10" fill="#6b7280" text-anchor="middle">2027</text>
              <text x="415" y="275" font-size="10" fill="#6b7280" text-anchor="middle">2028+</text>
              {/* Red zone */}
              <rect x="350" y="32" width="98" height="226" fill="#dc2626" opacity="0.07"/>
              {/* Exponential curve — solid */}
              <path d="M 62 255 C 110 254 190 248 270 230 C 310 218 330 196 350 162" fill="none" stroke="url(#sg-curve)" stroke-width="3.5" stroke-linecap="round"/>
              {/* Continuation beyond threshold — dotted */}
              <path d="M 350 162 C 375 122 400 78 425 40" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="6,5" stroke-linecap="round"/>
              {/* Threshold line */}
              <line x1="350" y1="32" x2="350" y2="258" stroke="#dc2626" stroke-width="2" stroke-dasharray="8,4"/>
              {/* Zone label */}
              <text x="356" y="48" font-size="9.5" fill="#dc2626" font-weight="600">We lose</text>
              <text x="356" y="61" font-size="9.5" fill="#dc2626" font-weight="600">control</text>
              <text x="400" y="165" font-size="40" fill="#dc2626" opacity="0.2" text-anchor="middle" font-weight="bold">?</text>
              {/* Data point dots */}
              <circle cx="110" cy="255" r="4.5" fill="#1a5f6e"/>
              <text x="116" y="244" font-size="9" fill="#1a5f6e">4-min tasks</text>
              <circle cx="190" cy="248" r="4.5" fill="#1a5f6e"/>
              <text x="130" y="236" font-size="9" fill="#1a5f6e">90-min tasks</text>
              <circle cx="270" cy="230" r="4.5" fill="#c4853a"/>
              <text x="216" y="222" font-size="9" fill="#c4853a">12-hr tasks</text>
              <circle cx="350" cy="162" r="4.5" fill="#c4853a"/>
              <text x="288" y="154" font-size="9" fill="#c4853a">week tasks</text>
              {/* Human oversight label */}
              <text x="70" y="148" font-size="8.5" fill="#1a5f6e" opacity="0.65">human</text>
              <text x="70" y="159" font-size="8.5" fill="#1a5f6e" opacity="0.65">oversight</text>
              <text x="70" y="170" font-size="8.5" fill="#1a5f6e" opacity="0.65">intact</text>
              {/* Compressing gap annotations — arrows showing intervals shrinking */}
              <line x1="110" y1="292" x2="190" y2="292" stroke="#9ca3af" stroke-width="1" marker-end="url(#arr)"/>
              <line x1="190" y1="292" x2="110" y2="292" stroke="#9ca3af" stroke-width="1"/>
              <text x="150" y="305" font-size="8" fill="#9ca3af" text-anchor="middle">12 months</text>
              <line x1="190" y1="292" x2="270" y2="292" stroke="#9ca3af" stroke-width="1"/>
              <text x="230" y="305" font-size="8" fill="#9ca3af" text-anchor="middle">8 months</text>
              <line x1="270" y1="292" x2="350" y2="292" stroke="#9ca3af" stroke-width="1"/>
              <text x="310" y="305" font-size="8" fill="#9ca3af" text-anchor="middle">4 months</text>
              <text x="390" y="305" font-size="8" fill="#dc2626" text-anchor="middle">weeks?</text>
            </svg>
            <p style="font-size: 0.8rem; color: #9ca3af; text-align: center; margin-top: 0.4rem">Task horizon doubling every 4 months &mdash; and accelerating</p>
          </div>
        </div>
            <div class="question" style="margin-top: 1.25rem">
              AI is already writing code at major labs. <sup class="fn">2</sup><br />
              The process has already started.
            </div>
        <div class="slide-footnotes">
          <span><sup>1</sup> &ldquo;Can We Just...Pause AI?&rdquo; &mdash; Rational Animations (Jan 2026) &mdash; youtube.com/watch?v=tUB_uvSqiw8</span><br />
          <span><sup>2</sup> Anthropic Institute (June 2026): &gt;80% of Anthropic&rsquo;s production code written by Claude &mdash; anthropic.com/institute/recursive-self-improvement &nbsp;&middot;&nbsp; Dario Amodei (Anthropic CEO, Jan 2026): recursive self-improvement possible within 6&ndash;12 months</span>
        </div>
      </>
    ),
    notes: {
      pace: 'Core \u00b7 ~7 min',
      cumulative: 26,
      anchor: 'The singularity isn\u2019t about intelligence level \u2014 it\u2019s the moment we lose control of the process.',
      bullets: [
        { type: 'say', text: 'Three terms, not the same: AGI (matches humans), ASI (exceeds humans), Singularity (self-improvement escapes oversight)' },
        { type: 'say', text: 'Point to the chart: each gap is shrinking. 12 months between generations, then 8, then 4. The curve bends upward.' },
        { type: 'say', text: 'We just saw the evidence: 80% of Anthropic\u2019s code, task horizon doubling every 4 months. The loop is closing.' },
        { type: 'say', text: 'Unlike almost every other risk: no second attempt. You don\u2019t get to run the experiment twice.' },
        { type: 'say', text: 'The critical question - have we solved alignment before we reach the singularity? Do we have a model that acts with our best interests, or its own interests.' },
        { type: 'say', text: '\u201cWhy can\u2019t we just slow down?\u201d \u2014 not a failure of will. It\u2019s a coordination problem. No single actor can unilaterally restrain the field.' },
        { type: 'cue', text: 'Pause after \u201cThe process has already started.\u201d Silence does the work.' },
        { type: 'cue', text: 'The \u201cwe can\u2019t slow down\u201d question will come from the audience \u2014 address it here proactively.' },
      ],
    },
  },

  // ── SLIDE 8 ── What I'm Hearing ────────────────────────────────────────────
  {
    id: 8,
    title: "What I'm Hearing",
    content: (
      <>
        <h2>What I&rsquo;m Hearing</h2>
        <div class="large-text">
          <b>Doctor:</b> &ldquo;There&rsquo;s no point going to medical school.&rdquo;<br />
          <b>Counsellor:</b> &ldquo;Asked a patient why they were no longer seeing me &mdash; <br />
          they had been using ChatGPT instead.&rdquo;
        </div>
        <div style="display: flex; gap: 2rem; max-width: 1400px; width: 100%; margin-top: 2rem">
          <div class="emphasis-box" style="flex: 1; margin: 0">
            <div class="large-text">
              And it&rsquo;s not just software anymore.<br />
              <strong>Robotics + Large World Models = <br />
              AI doing Physical work.</strong>
            </div>
          </div>
          <div class="warning-box" style="flex: 1; margin: 0">
            <div class="large-text">
              Rural and regional communities have fewer fallback options.<br />
              Fewer industries to shift into. Fewer safety nets.<br />
              <strong>The disruption hits just as hard &mdash; <br />
              with less buffer.</strong>
            </div>
          </div>
        </div>
        <div class="question" style="margin-top: 2rem">
          This isn&rsquo;t just a city problem.<br />
          It&rsquo;s coming here too.
        </div>
        <div class="slide-footnotes">
          <span><sup>1</sup> Anthropic research (Mar 2026): 14% drop in hiring in AI-exposed roles post-ChatGPT &mdash; fortune.com/2026/03/06/ai-job-losses-report-anthropic-research-great-recession-for-white-collar-workers</span>
        </div>
      </>
    ),
    notes: {
      pace: 'Medium \u00b7 ~3 min',
      cumulative: 29,
      anchor: 'Rural communities have fewer fallback options. The disruption hits just as hard \u2014 with less buffer.',
      bullets: [
        { type: 'say', text: '\u201cThere\u2019s no point going to medical school.\u201d Someone said this to me. AI already performs at specialist level on many diagnostic tasks.' },
        { type: 'say', text: '\u201cMy patients are using ChatGPT instead. AI is available 24/7 and people don\u2019t fear being judged.' },
        { type: 'say', text: 'White-collar, creative, legal work \u2014 already transforming. Not a future prediction.' },
        { type: 'say', text: 'Tumbarumba isn\u2019t immune. Cities have more industries to shift into. We don\u2019t.' },
        { type: 'cue', text: 'Add a local example here if you have one \u2014 business owner, farmer, teacher.' },
      ],
    },
  },

  // ── SLIDE 9 ── Our Children & High School Students ──────────────────────
  {
    id: 9,
    title: "Our Children & High School Students",
    content: (
      <>
        <h2>Our Children &amp; High School Students</h2>
        <div style="font-size: 1.8rem;">
          High school students today are entering the most unstable workforce in history.<br />
          The careers we&rsquo;re preparing them for may not exist by the time they graduate.
        </div>
        <div style="display: flex; gap: 2rem; align-items: flex-start; max-width: 1300px; width: 100%; margin-top: 1.25rem">
          <div style="flex: 1; display: flex; overflow: hidden; border-radius: 12px; box-shadow: 0 8px 28px rgba(0,0,0,0.22); min-height: 260px">
            <img
              src="/img/slideshows/tumbarumba-june-2026/high-school-student.png"
              alt="A teenager at a desk looking at a laptop, slightly uncertain expression"
              style="width: 100%; height: 100%; object-fit: cover; object-position: center; display: block;"
            />
          </div>
          <div style="flex: 2; display: flex; flex-direction: column; gap: 0.85rem">
            <div class="warning-box" style="margin: 0">
              <h3 style="font-size: 1.6rem; margin-bottom: 0.4rem">&#9888;&#65039; Entering an Unstable World</h3>
              <p style="font-size: 1.4rem; color: #374151">
                The jobs most under threat are white-collar, professional roles &mdash; exactly what education has always pointed kids toward. Medicine, law, accounting, software. Not someday &mdash; now.
              </p>
            </div>
            <div class="emphasis-box" style="margin: 0">
              <h3 style="font-size: 1.6rem; margin-bottom: 0.4rem">&#127979; What Schools Aren&rsquo;t Teaching</h3>
              <p style="font-size: 1.4rem; color: #374151">
                Curricula built for the 20th century. Critical thinking, adaptability, collaboration, and empathy matter more than ever. Most schools aren&rsquo;t pivoting fast enough.
              </p>
            </div>
            <div class="info-box" style="margin: 0">
              <h3 style="font-size: 1.6rem; margin-bottom: 0.4rem">&#128172; What to Tell Your Kids</h3>
              <p style="font-size: 1.4rem; color: #374151">
                Be honest about uncertainty. Don&rsquo;t pretend the path is clear. Help them build resilience, not just credentials. The most valuable thing you can give them is the ability to adapt.
              </p>
            </div>
          </div>
        </div>
        <div class="question" style="margin-top: 1.5rem">
          Our kids are watching us.<br />
          The question is whether we&rsquo;re prepared to have an honest conversation with them.
        </div>
      </>
    ),
    notes: {
      pace: 'Core \u00b7 ~3 min',
      cumulative: 32,
      anchor: 'The careers we\u2019re preparing them for may not exist by the time they graduate.',
      bullets: [
        { type: 'say', text: 'High school students entering the workforce in 2\u20134 years are entering a fundamentally different world than the one we planned for them' },
        { type: 'say', text: 'Medicine, law, accounting, software \u2014 not someday, now. These are exactly the paths we\u2019ve told kids lead to security.' },
        { type: 'say', text: 'What to tell your kids: be honest about uncertainty. Help them build adaptability, not just credentials.' },
        { type: 'cue', text: 'This lands personally \u2014 especially for parents. Pause after the anchor. Watch the room.' },
        { type: 'cue', text: 'If a parent looks distressed, acknowledge it: \u201cThis is hard to sit with. That\u2019s appropriate.\u201d' },
      ],
    },
  },

  // ── SLIDE 10 ── 50/50: Utopia or Dystopia ────────────────────────────────
  {
    id: 10,
    title: "50/50: Utopia or Dystopia",
    content: (
      <>
        <h2>50/50: Utopia or Dystopia</h2>
        <div style="display: flex; gap: 2rem; align-items: flex-start; max-width: 1300px; width: 100%; margin-top: 1.25rem">
          <div style="flex: 3; display: flex; flex-direction: column; gap: 0.85rem">
			<div class="split-view">
			  <div class="split-column" style="background: rgba(39, 174, 96, 0.08); border: 1px solid rgba(39, 174, 96, 0.25)">
				<h3>&#127775; Utopia</h3>
				<p style="font-size: 1.3rem; margin-top: 1rem">
				  Cancer solved. Alzheimer&rsquo;s solved.<br />
				  A century of medical research compressed into a decade.<br />
				  Abundance. Human flourishing.
				</p>
			  </div>
			  <div class="split-column" style="background: rgba(192, 57, 43, 0.08); border: 1px solid rgba(192, 57, 43, 0.25)">
				<h3>&#9888;&#65039; Dystopia</h3>
				<p style="font-size: 1.3rem; margin-top: 1rem">
				  AI systems that behave in unpredictable ways.<br />
				  Authoritarian surveillance.<br />
				  Existential risk.
				</p>
			  </div>
			</div>
			<div class="large-text" style="margin-top: 2rem; font-weight: 600; color: #dc2626">
			  Experts once put it at 50/50.<br />
			  Hinton (2024): 10&ndash;20% chance of human extinction. <sup class="fn">1</sup><br />
			  Even at 20/80, one of them <strong>will happen</strong>.
			</div>
		  </div>
          <div style="flex: 2; display: flex; overflow: hidden; border-radius: 12px; box-shadow: 0 8px 28px rgba(0,0,0,0.22); min-height: 260px">
            <img
              src="/img/slideshows/tumbarumba-june-2026/utopia-dystopia.png"
              alt="50/50 split between utopia and dystopia"
              style="width: 100%; height: 100%; object-fit: cover; object-position: center; display: block;"
            />
          </div>
        </div>
        <div class="question" style="margin-top: 2rem">
          The path we get depends on<br />
          what we do right now.
        </div>
        <div class="slide-footnotes">
          <span><sup>1</sup> Geoffrey Hinton (Nobel Prize 2024) &mdash; theguardian.com/technology/2024/dec/27/godfather-of-ai-raises-odds-of-the-technology-wiping-out-humanity-over-next-30-years</span>
        </div>
      </>
    ),
    notes: {
      pace: 'Medium \u00b7 ~3 min',
      cumulative: 35,
      anchor: 'We don\u2019t build bridges with a 50% collapse rate. So why are we going full speed on AI?',
      bullets: [
        { type: 'say', text: 'Geoffrey Hinton \u2014 Nobel Prize 2024, helped invent deep learning \u2014 says 10\u201320% chance of human extinction within 30 years' },
        { type: 'say', text: 'p(doom): the probability experts assign to catastrophic outcomes. Almost nobody credible says zero.' },
        { type: 'say', text: 'Both outcomes are real. The utopia is worth working toward.' },
        { type: 'cue', text: 'Hold back your own view. Present the range, not a verdict.' },
      ],
    },
  },

  // ── SLIDE 11 ── Remember February 2020 ─────────────────────────────────
  {
    id: 11,
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
            I think we&rsquo;re in that<br />
            &ldquo;seems overblown&rdquo; phase right now.
          </div>
        </div>
        <div class="question" style="margin-top: 2rem">
          Except this time it&rsquo;s not about a virus&mdash;<br />
          it&rsquo;s about how society fundamentally works.
        </div>
      </>
    ),
    notes: {
      pace: 'Brief \u00b7 ~2 min',
      cumulative: 37,
      anchor: 'I think we\u2019re in that \u201cseems overblown\u201d phase right now.',
      bullets: [
        { type: 'say', text: 'February 2020 \u2014 virus overseas, stock market fine, life normal. Three weeks later: everything changed.' },
        { type: 'say', text: 'The pattern repeats: distant threat dismissed, then overnight it\u2019s everywhere.' },
        { type: 'say', text: 'Except this time it\u2019s not a virus \u2014 it\u2019s how society fundamentally works.' },
        { type: 'cue', text: 'Pause after the anchor line. Don\u2019t fill the silence.' },
      ],
    },
  },

  // ── SLIDE 12 ── Immediate Human Risks ───────────────────────────────────
  {
    id: 12,
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
            <h3 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 0.4rem">&#128188; Job Displacement</h3>
            <p style="font-size: 1.1rem; color: #374151">
              Which roles? How fast? What skills remain valuable? White collar, creative, and technical work is already transforming &mdash; faster than most people realise.
            </p>
          </div>
          <div>
            <h3 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 0.4rem">&#127806; Food Security</h3>
            <p style="font-size: 1.1rem; color: #374151">
              Supply chains optimised for efficiency, not resilience. Economic shock or infrastructure disruption could expose how fragile our food systems really are.
            </p>
          </div>
          <div>
            <h3 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 0.4rem">&#129517; Purpose &amp; Identity</h3>
            <p style="font-size: 1.1rem; color: #374151">
              When work defines who you are, what happens when the work disappears? Loss of structure, daily meaning, and self-worth.
            </p>
          </div>
          <div>
            <h3 style="color: #dc2626; font-size: 1.5rem; margin-bottom: 0.4rem">&#127963;&#65039; The Welfare Gap</h3>
            <p style="font-size: 1.1rem; color: #374151">
              Safety nets were built for temporary job loss, not structural displacement at scale. No ready infrastructure exists for what&rsquo;s coming.
            </p>
          </div>
        </div>
        <div style="margin-top: 1.75rem; border-top: 1px solid #e5e7eb; padding-top: 0.875rem; max-width: 1000px; width: 100%">
          <p style="font-size: 0.75rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.4rem">For deeper conversation</p>
          <p style="font-size: 1rem; color: #6b7280">&#129504; Mental Health at Scale &nbsp;&middot;&nbsp; &#128499;&#65039; Democratic Fragility</p>
        </div>
        <div class="question" style="margin-top: 2rem">
          These aren&rsquo;t distant risks.<br />
          Some of them are already here.
        </div>
        <div class="slide-footnotes">
          <span><sup>1</sup> Anthropic research (Mar 2026) &mdash; fortune.com/2026/03/06/ai-job-losses-report-anthropic-research-great-recession-for-white-collar-workers &nbsp;&middot;&nbsp; theguardian.com/technology/2026/feb/11/big-ai-job-swap-white-collar-workers-ditching-their-careers</span>
        </div>
      </>
    ),
    notes: {
      pace: 'Medium \u00b7 ~3 min',
      cumulative: 40,
      anchor: 'These aren\u2019t distant risks. Some of them are already here.',
      bullets: [
        { type: 'say', text: 'Job displacement: 14% drop in hiring in AI-exposed roles since ChatGPT launched \u2014 Anthropic\u2019s own research' },
        { type: 'say', text: 'Purpose and identity: when work defines who you are, what happens when the work disappears?' },
        { type: 'say', text: 'The welfare gap: safety nets built for temporary job loss, not structural displacement at scale' },
        { type: 'cue', text: 'Purpose and identity tends to land hardest. Watch the room.' },
      ],
    },
  },

  // ── SLIDE 13 ── What Does a Good Future Look Like? ─────────────────────
  {
    id: 13,
    title: "What Does a Good Future Look Like?",
    content: (
      <>
        <h2>What Does a Good Future Look Like?</h2>
        <div class="large-text">Fear is a motivator. But it&rsquo;s not a destination.</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem 3rem; max-width: 1000px; width: 100%; margin-top: 1.5rem">
          <div class="info-box" style="margin: 0">
            <h3 style="margin-bottom: 0.75rem; font-size: 1.35rem">&#127807; The personal picture</h3>
            <p style="font-size: 1.05rem; color: #374151">
              Outside. Building something. Helping someone. Creating. Contributing &mdash; not because you have to, but because it&rsquo;s meaningful. Physical, relational, chosen.
            </p>
          </div>
          <div class="info-box" style="margin: 0">
            <h3 style="margin-bottom: 0.75rem; font-size: 1.35rem">&#128300; The societal picture</h3>
            <p style="font-size: 1.05rem; color: #374151">
              Compressed decades of medical progress. Mental health care for everyone. Expertise available globally, not just in wealthy places. Human energy freed for what matters.
            </p>
          </div>
        </div>
        <div class="info-box" style="max-width: 1000px; width: 100%; margin-top: 1.25rem">
          <p style="font-size: 1.1rem; text-align: center; color: #374151">
            &ldquo;The utopia outcome is genuinely desirable. Not as a fantasy &mdash; as a real possibility that is worth working toward.&rdquo;
          </p>
        </div>
        <div class="question" style="margin-top: 1.5rem">
          The utopia outcome is real.<br />
          It&rsquo;s worth working toward.
        </div>
      </>
    ),
    notes: {
      pace: 'Medium \u00b7 ~2 min',
      cumulative: 42,
      anchor: 'Fear is a motivator. But it\u2019s not a destination.',
      bullets: [
        { type: 'say', text: 'The personal picture: outside, building, helping, creating \u2014 not because you have to, because it\u2019s meaningful' },
        { type: 'say', text: 'The societal picture: cancer solved, Alzheimer\u2019s solved, expertise available everywhere, not just in wealthy places' },
        { type: 'say', text: 'The utopia outcome is genuinely desirable. Not a fantasy \u2014 a real possibility worth working toward.' },
        { type: 'cue', text: 'Tonal pivot. Slow down. Let it be hopeful.' },
      ],
    },
  },

  // ── SLIDE 14 ── Institutions Are Paying Attention ────────────────────────
  {
    id: 14,
    title: "Institutions Are Paying Attention",
    content: (
      <>
        <h2>Institutions Are Paying Attention</h2>
        <div class="large-text">
          This isn&rsquo;t fringe concern.<br />
          The most senior voices in religion, science, and industry are all saying the same thing.
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.25rem; max-width: 1150px; width: 100%; margin-top: 1.5rem">
          <div class="info-box" style="margin: 0">
            <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem; color: #1a5f6e">&#10013;&#65039; The Church</h3>
            <div style="font-size: 0.85rem; font-weight: 600; color: #6b7280; margin-bottom: 0.5rem">Pope Leo XIV &mdash; Magnifica Humanitas (May 2026)</div>
            <p style="font-size: 1rem; font-style: italic; color: #374151; margin-bottom: 0.75rem">
              &ldquo;Technology is never neutral &mdash; it takes on the characteristics of those who devise, finance and control it.&rdquo;
            </p>
            <p style="font-size: 0.95rem; color: #374151">
              The Church&rsquo;s first encyclical dedicated to AI. Addressed to 1.4 billion Catholics. Calls for democratic oversight, warns against lethal AI in warfare, compares AI to the Industrial Revolution.
            </p>
          </div>
          <div class="warning-box" style="margin: 0">
            <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem">&#129516; The Scientists</h3>
            <div style="font-size: 0.85rem; font-weight: 600; color: #6b7280; margin-bottom: 0.5rem">AI CEOs Warn Congress (2026)</div>
            <p style="font-size: 0.85rem; color: #6b7280; margin-bottom: 0.5rem">Altman &middot; Amodei &middot; Hassabis &middot; Suleyman</p>
            <p style="font-size: 1rem; font-style: italic; color: #374151">
              &ldquo;AI systems now outperform PhD-level virologists&hellip; Knowledge barriers which have historically prevented bad actors from obtaining biological weapons will meaningfully erode.&rdquo;
            </p>
          </div>
          <div class="emphasis-box" style="margin: 0">
            <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem">&#128269; The Insiders</h3>
            <div style="font-size: 0.85rem; font-weight: 600; color: #6b7280; margin-bottom: 0.5rem">From Inside the Industry</div>
            <p style="font-size: 1rem; font-style: italic; color: #374151; margin-bottom: 0.75rem">
              &ldquo;Every frontier AI lab operates inside incentives that can conflict with doing the right thing.&rdquo;
            </p>
            <p style="font-size: 0.9rem; color: #374151">
              &mdash; Christopher Olah, Anthropic safety researcher. The people building these systems are raising the alarm from the inside.
            </p>
          </div>
        </div>
        <div class="question" style="margin-top: 1.5rem">
          When the Pope, the CEOs, and the engineers<br /> 
          are all saying the same thing &mdash;<br />
          it&rsquo;s time to listen.
        </div>
        <div class="slide-footnotes">
          <span><sup>1</sup> Magnifica Humanitas &mdash; Vatican, May 2026 &mdash; vatican.va/content/leo-xiv/en/encyclicals/documents/20260515-magnifica-humanitas.html</span><br />
          <span><sup>2</sup> AI CEO open letter on synthetic biology regulation &mdash; prod-i.a.dj.com/public/resources/documents/dnaletter.pdf</span>
        </div>
      </>
    ),
    notes: {
      pace: 'Medium \u00b7 ~3 min',
      cumulative: 45,
      anchor: 'When the Pope and the engineers are saying the same thing \u2014 it\u2019s time to listen.',
      bullets: [
        { type: 'say', text: 'Pope Leo XIV released Magnifica Humanitas in May 2026 \u2014 the first papal encyclical ever dedicated to AI. Addressed to 1.4 billion people.' },
        { type: 'say', text: 'The encyclical compares AI to the Industrial Revolution and calls it the defining challenge of our era. This is not a fringe view.' },
        { type: 'say', text: 'The CEO bioweapons letter: Altman, Amodei, Hassabis \u2014 these are competitors. They agree on this risk.' },
        { type: 'say', text: 'Christopher Olah is an Anthropic safety researcher \u2014 someone inside the building, raising the alarm.' },
        { type: 'cue', text: 'For the Christians in the room: \u201cThis isn\u2019t doom-saying \u2014 this is the Pope calling for responsible stewardship.\u201d' },
      ],
    },
  },

  // ── SLIDE 15 ── The Bigger Picture ──────────────────────────────────────
  {
    id: 15,
    title: "The Bigger Picture",
    content: (
      <>
        <h2>The Bigger Picture</h2>
        <div class="large-text">
          AI doesn&rsquo;t exist in isolation.<br />
          Other forces are shaping our future at the same time.
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.1rem 1.75rem; max-width: 1100px; width: 100%; margin-top: 1.5rem">
          <div>
            <h3 style="color: #dc2626; font-size: 1.3rem; margin-bottom: 0.35rem">&#9889; Critical Infrastructure at Risk</h3>
            <p style="font-size: 1rem; color: #374151">
              AI can now find vulnerabilities in power grids, water systems, and supply chains in minutes. Attacks that once required state-backed actors, months of work, and millions of dollars are becoming accessible to anyone. Electricity, water, logistics &mdash; the systems we take for granted are newly exposed.
            </p>
          </div>
          <div>
            <h3 style="color: #dc2626; font-size: 1.3rem; margin-bottom: 0.35rem">&#127757; Geopolitical Instability</h3>
            <p style="font-size: 1rem; color: #374151">
              The US-Israel war on Iran — still ongoing — has put the Strait of Hormuz at risk. When distant conflicts disrupt global supply chains, the price at the Tumbarumba bowser is one of the first places it shows up. Fuel costs hit rural communities harder than anywhere: longer distances, no public transport, farming operations that run on diesel.
            </p>
          </div>
          <div>
            <h3 style="color: #dc2626; font-size: 1.3rem; margin-bottom: 0.35rem">&#127777;&#65039; Climate Change</h3>
            <p style="font-size: 1rem; color: #374151">
              Still unfolding in parallel. AI may accelerate solutions &mdash; or accelerate energy consumption. Two major disruption timelines are converging.
            </p>
          </div>
          <div>
            <h3 style="color: #dc2626; font-size: 1.3rem; margin-bottom: 0.35rem">&#129440; Pandemic Preparedness</h3>
            <p style="font-size: 1rem; color: #374151">
              COVID exposed how fragile our systems are. AI-accelerated biology cuts both ways: faster vaccines and faster bioweapons. The next pandemic may arrive in a more disrupted world.
            </p>
          </div>
          <div>
            <h3 style="color: #dc2626; font-size: 1.3rem; margin-bottom: 0.35rem">&#128275; AI Guardrail Removal <sup class="fn">1</sup></h3>
            <p style="font-size: 1rem; color: #374151">
              Open-source AI models can have safety guardrails stripped in minutes using freely available tools. Over 3,500 &ldquo;decensored&rdquo; models downloaded 13 million times. Proprietary systems remain more secure &mdash; for now.
            </p>
          </div>
          <div>
            <h3 style="color: #dc2626; font-size: 1.3rem; margin-bottom: 0.35rem">&#128184; The AI Investment Bubble</h3>
            <p style="font-size: 1rem; color: #374151">
              Massive capital flowing into AI on the promise of future returns. A hard correction could slow innovation and destabilise job markets simultaneously.
            </p>
          </div>
        </div>
        <div style="margin-top: 1.5rem; border-top: 1px solid #e5e7eb; padding-top: 0.875rem; max-width: 1100px; width: 100%">
          <p style="font-size: 0.75rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.4rem">For deeper conversation</p>
          <p style="font-size: 1rem; color: #6b7280">
            &#9762;&#65039; Nuclear Proliferation &nbsp;&middot;&nbsp; &#128241; AI-Enabled Disinformation &nbsp;&middot;&nbsp;
            &#9878;&#65039; Economic Inequality &nbsp;&middot;&nbsp; &#9889; Energy Security &nbsp;&middot;&nbsp; &#129516; Bioweapons Acceleration
          </p>
        </div>
        <div class="question" style="margin-top: 1.25rem">
          AI doesn&rsquo;t exist in isolation.<br />
          Everything is accelerating at once.
        </div>
        <div class="slide-footnotes">
          <span><sup>1</sup> Financial Times investigation (2026) &mdash; guardrail removal tool &ldquo;Heretic&rdquo; on GitHub; 3,500+ decensored models, 13 million downloads</span>
        </div>
      </>
    ),
    notes: {
      pace: 'Brief \u00b7 ~2 min',
      cumulative: 47,
      anchor: 'Even if AI is slower than feared, the rest of this still applies.',
      bullets: [
        { type: 'say', text: 'AI doesn\u2019t exist in isolation \u2014 geopolitical instability, climate, pandemic risk all unfolding simultaneously' },
        { type: 'say', text: 'The guardrail removal story: this isn\u2019t a future risk \u2014 it\u2019s a current reality. Freely available, four lines of code.' },
        { type: 'say', text: 'Two major disruption timelines converging: AI and climate. Either one alone is significant.' },
        { type: 'cue', text: 'Brief \u2014 note it and move. Protect the close.' },
      ],
    },
  },

  // ── SLIDE 16 ── Why Community Is the Answer ────────────────────────────
  {
    id: 16,
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
            <p style="font-size: 1rem; color: #374151">Understand what&rsquo;s actually happening. Separate hype from reality.</p>
          </div>
          <div style="display: flex; align-items: center; color: #1a5f6e; font-size: 1.5rem; font-weight: 300">&rarr;</div>
          <div class="info-box" style="flex: 1; margin: 0; text-align: center">
            <div style="font-size: 2rem; margin-bottom: 0.5rem">&#128172;</div>
            <h3 style="font-size: 1.2rem; margin-bottom: 0.4rem">Conversation</h3>
            <p style="font-size: 1rem; color: #374151">Talk to people. Challenge ideas. Share perspectives. Build collective understanding.</p>
          </div>
          <div style="display: flex; align-items: center; color: #1a5f6e; font-size: 1.5rem; font-weight: 300">&rarr;</div>
          <div class="info-box" style="flex: 1; margin: 0; text-align: center">
            <div style="font-size: 2rem; margin-bottom: 0.5rem">&#128640;</div>
            <h3 style="font-size: 1.2rem; margin-bottom: 0.4rem">Action</h3>
            <p style="font-size: 1rem; color: #374151">Not panic. Not paralysis. Informed, grounded, community-supported action.</p>
          </div>
        </div>
        <div style="display: flex; gap: 2rem; align-items: stretch; max-width: 1050px; width: 100%; margin-top: 1.5rem">
          <div style="flex: 3">
            <div class="large-text" style="font-size: 1.4rem; margin-bottom: 1rem">
              You don&rsquo;t have to figure this out alone.
            </div>
            <div class="emphasis-box" style="margin: 0">
              <p style="font-size: 1.05rem; color: #374151; text-align: center">
                <strong>Maslow&rsquo;s hierarchy as a planning framework:</strong><br />
                In disruption, we return to fundamentals &mdash; physiological needs, safety, belonging.
                Community is how we secure all three: food networks, mutual support, shared knowledge.<br /><br />
                <strong>And our young people belong here too.</strong> High school students need community
                conversations, not just school curricula. They need to hear adults taking this seriously.
              </p>
            </div>
          </div>
          <div style="flex: 2; display: flex; overflow: hidden; border-radius: 12px; box-shadow: 0 8px 28px rgba(0,0,0,0.22); min-height: 220px">
            <img
              src="/img/slideshows/tumbarumba-june-2026/community-garden.png"
              alt="Community garden with locals helping each other"
              style="width: 100%; height: 100%; object-fit: cover; object-position: center; display: block;"
            />
          </div>
        </div>
        <div class="question" style="margin-top: 1rem">
          This is why we&rsquo;re here tonight &mdash;<br />
          and why we need to keep meeting.
        </div>
      </>
    ),
    notes: {
      pace: 'Brief \u00b7 ~2 min',
      cumulative: 49,
      anchor: 'Community is how we secure Maslow\u2019s fundamentals \u2014 food networks, mutual support, shared knowledge. And our young people belong in this conversation.',
      bullets: [
        { type: 'say', text: 'Individual worry is exhausting \u2014 it just loops. Collective sense-making is how we actually move forward.' },
        { type: 'say', text: 'Maslow: in disruption we return to fundamentals. Community is how we secure physiological needs, safety, and belonging simultaneously.' },
        { type: 'say', text: 'Our young people belong in this conversation \u2014 they\u2019re the most affected, and they need to see adults engaging with it.' },
        { type: 'cue', text: '\u201cYou\u2019re not alone\u201d moment. Be warm. Don\u2019t rush it.' },
      ],
    },
  },

  // ── SLIDE 17 ── What Can We Do? ─────────────────────────────────────────
  {
    id: 17,
    title: "What Can We Do?",
    content: (
      <>
        <h2>What Can We Do?</h2>
        <div class="large-text" style="margin-bottom: 0.5rem">Not panic. Not paralysis. Action.</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.25rem 2rem; max-width: 1100px; width: 100%; margin-top: 1rem">
          <div>
            <h3 style="color: #1a5f6e; font-size: 1.35rem; margin-bottom: 0.4rem">&#129504; Awareness</h3>
            <p style="font-size: 1rem; color: #374151">
              Stay informed. Understand what&rsquo;s actually happening versus the hype. Conversations like this one are where it starts.
            </p>
          </div>
          <div>
            <h3 style="color: #1a5f6e; font-size: 1.35rem; margin-bottom: 0.4rem">&#128172; Find Your Community</h3>
            <p style="font-size: 1rem; color: #374151">
              You don&rsquo;t have to figure this out alone. Find or{" "}
              <a
                href="https://futuretogether.community/start-a-group"
                target="_blank"
                rel="noopener noreferrer"
                style="color: #c4853a; text-decoration: none; border-bottom: 1px solid rgba(196,133,58,0.5)"
              >
                start a local group
              </a>. Collective sense-making is more powerful than individual worry.
            </p>
          </div>
          <div>
            <h3 style="color: #1a5f6e; font-size: 1.35rem; margin-bottom: 0.4rem">&#128295; Know Your Skills</h3>
            <p style="font-size: 1rem; color: #374151">
              Which of your skills are AI-resistant? Which are AI-complementary? Understanding your own value helps you adapt rather than react.
            </p>
          </div>
          <div>
            <h3 style="color: #1a5f6e; font-size: 1.35rem; margin-bottom: 0.4rem">&#127807; Food Preparedness</h3>
            <p style="font-size: 1rem; color: #374151">
              Community gardens, local suppliers, growing your own. Resilience through local relationships &mdash; not stockpiling.
            </p>
          </div>
          <div>
            <h3 style="color: #1a5f6e; font-size: 1.35rem; margin-bottom: 0.4rem">&#128176; Financial Resilience</h3>
            <p style="font-size: 1rem; color: #374151">
              Reduce debt. Build a buffer. Economic disruption amplifies existing vulnerability &mdash; and it arrives faster than most people expect.
            </p>
          </div>
          <div>
            <h3 style="color: #1a5f6e; font-size: 1.35rem; margin-bottom: 0.4rem">&#128226; Civic Engagement</h3>
            <p style="font-size: 1rem; color: #374151">
              Talk to your representatives. Attend local meetings. Governments need to hear from people who are paying attention &mdash; not just lobbyists.
            </p>
          </div>
        </div>
        <div style="margin-top: 1.75rem; border-top: 1px solid #e5e7eb; padding-top: 0.75rem; max-width: 1100px; width: 100%">
          <p style="font-size: 0.75rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.2rem">Stay connected</p>
          <p style="font-size: 0.95rem; color: #c4853a; font-weight: 600">futuretogether.community</p>
        </div>
        <div class="question" style="margin-top: 1.25rem">
          Not panic. Not paralysis. Action.<br />
          Starting tonight.
        </div>
      </>
    ),
    notes: {
      pace: 'Medium \u00b7 ~3 min',
      cumulative: 52,
      anchor: 'Not panic. Not paralysis. Action. Starting tonight.',
      bullets: [
        { type: 'say', text: 'Stay informed \u2014 the gap between what\u2019s happening and what most people know is enormous' },
        { type: 'say', text: 'Know your skills \u2014 which are AI-resistant? Which are AI-complementary? Adapt rather than react.' },
        { type: 'say', text: 'Local resilience: community gardens, local suppliers, knowing your neighbours. This works in Tumbarumba.' },
        { type: 'cue', text: 'Say the anchor slowly. Three beats: Not panic. Not paralysis. Action.' },
      ],
    },
  },

  // ── SLIDE 18 ── Stay Connected ────────────────────────────────────────────
  {
    id: 18,
    title: "Stay Connected",
    content: (
      <>
        <h2>Stay Connected</h2>
        <div class="large-text" style="margin-bottom: 0.5rem">
          &ldquo;The future is arriving. Let&rsquo;s face it together.&rdquo;
        </div>
        <div style="margin-top: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; max-width: 700px; width: 100%">
          <div class="info-box" style="width: 100%; text-align: center; margin: 0">
            <p style="font-size: 1.8rem; color: #374151; margin-bottom: 1rem">
              Find resources, register for upcoming events,<br />and bring a friend to the next one.
            </p>
            <QRCode
              url="https://futuretogether.community/events/tumbarumba"
              style="width:260px;height:260px;margin:0.75rem auto;"
            />
            <p style="font-size: 1.4rem; font-weight: 700; color: #c4853a; margin-top: 0.75rem">
              futuretogether.community/events/tumbarumba
            </p>
          </div>
          <div style="font-size: 1.8rem; color: #1a5f6e; font-weight: 600">Questions? Let&rsquo;s talk.</div>
        </div>
        <p style="font-size: 0.9rem; color: #d1d5db; margin-top: 2rem; letter-spacing: 0.02em; display: flex; align-items: center; justify-content: center; gap: 0.4rem">
          <img src="https://www.beyondbetter.app/logo-a.png" alt="BB Logo" class="bb-logo" />{" "}
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
      pace: 'Warm \u00b7 ~3 min',
      cumulative: 55,
      anchor: 'The future is arriving. Let\u2019s face it together.',
      bullets: [
        { type: 'say', text: 'Point to QR code \u2014 futuretogether.community/events/tumbarumba \u2014 resources, events, how to stay connected' },
        { type: 'say', text: 'Bring a friend to the next one. This conversation needs to spread. I\u2019m here at Caf\u00e9 Nest every Tuesday morning 8am - available to chat.' },
        { type: 'cue', text: 'Open Q&A: \u201cThere are no wrong questions tonight.\u201d Then wait.' },
        { type: 'cue', text: 'If silence: \u201cI\u2019ll start \u2014 what\u2019s one thing from tonight that surprised you?\u201d' },
      ],
    },
  },

  // ── SLIDE 19 ── Back to Basics – Maslow [ADDENDUM] ──────────────────────────
  {
    id: 19,
    title: "Back to Basics \u2013 Maslow [Addendum]",
    content: (
      <>
        <h2>Back to Basics</h2>
        <div style="display: flex; gap: 3rem; align-items: center; max-width: 1300px">
          <div style="flex: 1">
            <div class="large-text" style="text-align: left">
              In times of rapid change,<br />
              Maslow&rsquo;s hierarchy reminds us:<br />
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
      pace: 'Addendum \u00b7 skip unless time permits',
      cumulative: 58,
      anchor: '[ADDENDUM \u2014 use only if time permits, or during Q&A when resilience questions arise]',
      bullets: [
        { type: 'say', text: 'Maslow isn\u2019t an answer \u2014 it\u2019s a map for asking better questions about what matters most' },
        { type: 'say', text: 'Bad outcome: start near the bottom (food, safety, stability). Good outcome: start near the top. The hierarchy applies either way.' },
        { type: 'cue', text: 'Visual breath slide. Don\u2019t over-explain.' },
      ],
    },
  },
];

// meta declared after slides so loadSlides can reference the module-level array
export const meta: SlideshowMeta = {
  slug: "tumbarumba-june-2026",
  title: "The Future Is Arriving. Is Tumbarumba Ready?",
  eventSlug: "tumbarumba-june-2026",
  slideCount: 18,
  description:
    "A public talk about AI and its impact on our community, presented at The Caf\u00e9 Nest Cinema, Tumbarumba.",
  loadSlides: () => Promise.resolve(slides),
};
