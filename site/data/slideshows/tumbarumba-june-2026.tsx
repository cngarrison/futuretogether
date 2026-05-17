import type { SlideData, SlideshowMeta } from '@/types/slideshows.ts';

// slides must be declared before meta so loadSlides can reference it
export const slides: SlideData[] = [
  {
    id: 1,
    title: 'Opening',
    content: (
      <div>
        <div class="slide-logo">
          <img src="/logo.svg" alt="Future Together" style="height:40px;" />
        </div>
        <h1 style="font-size:2.6rem;font-weight:800;color:#1a5f6e;margin-top:1rem;">The Future Is Arriving.</h1>
        <h2 style="font-size:2rem;font-weight:700;color:#c4853a;margin-top:0;">Is Tumbarumba Ready?</h2>
        <p class="large-text" style="margin-top:1.5rem;">An honest conversation about AI, work, and what it means for communities like ours.</p>
        <p class="subtitle" style="margin-top:2rem;opacity:0.6;">The Café Nest Cinema, Tumbarumba · Supported by Tumbarumba Chamber of Commerce</p>
      </div>
    ),
    notes: {
      anchor: 'Thank you — genuinely — for being here tonight.',
      bullets: [
        { type: 'say', text: 'My name is Charlie Garrison. I run a community called Future Together.' },
        { type: 'say', text: 'This is not a technology talk. It is a community talk.' },
        { type: 'cue', text: 'Pause. Let the room settle.' },
        { type: 'say', text: 'I want to have an honest conversation about something that is already affecting us — whether we notice it or not.' },
      ],
      pace: 'Brief · ~3 min',
      cumulative: 3,
    },
  },
  {
    id: 2,
    title: 'The Gap',
    content: (
      <div>
        <h2>There is a gap.</h2>
        <div class="emphasis-box">
          <p class="large-text">The gap between what is <strong>actually happening</strong> with AI and what <strong>most people think</strong> is happening is enormous.</p>
        </div>
        <p class="large-text" style="margin-top:1.5rem;">This is not about robots or science fiction. It is about the tools that are already changing how work gets done — right now, in every industry.</p>
        <p class="question">When did you last notice something that used to require a person... no longer does?</p>
      </div>
    ),
    notes: {
      anchor: 'Let me start with the thing nobody talks about.',
      bullets: [
        { type: 'say', text: 'There is a gap between reality and perception. And that gap matters.' },
        { type: 'say', text: 'Think about February 2020. Most people thought COVID was a distant problem. Then overnight it wasn\'t.' },
        { type: 'say', text: 'We are in a similar moment with AI right now. The gap is closing. Fast.' },
        { type: 'cue', text: 'Let the question land. Pause 5 seconds.' },
      ],
      pace: 'Moderate · ~4 min',
      cumulative: 7,
    },
  },
  {
    id: 3,
    title: 'Two Paths',
    content: (
      <div>
        <h2>Where this goes is not decided yet.</h2>
        <div class="split-view">
          <div class="split-column utopia">
            <h3 style="color:#166534;margin-top:0;">If we prepare</h3>
            <ul class="large-text" style="padding-left:1.2rem;">
              <li>Communities that adapt together stay together</li>
              <li>New kinds of work emerge</li>
              <li>People with awareness have choices</li>
            </ul>
          </div>
          <div class="split-column dystopia">
            <h3 style="color:#7f1d1d;margin-top:0;">If we don't</h3>
            <ul class="large-text" style="padding-left:1.2rem;">
              <li>Disruption hits without warning</li>
              <li>Rural communities have fewer fallback options</li>
              <li>The gap becomes permanent</li>
            </ul>
          </div>
        </div>
        <div class="info-box" style="margin-top:1rem;">
          <strong>Not panic. Not paralysis. Action.</strong>
        </div>
      </div>
    ),
    notes: {
      anchor: 'This is not inevitable. The future is not written.',
      bullets: [
        { type: 'say', text: 'Every technology transition creates winners and losers. Which side you land on depends heavily on preparation.' },
        { type: 'say', text: 'Rural communities like Tumbarumba face specific challenges — fewer alternative employers, longer supply chains, less access to retraining.' },
        { type: 'say', text: 'But communities that talk about this stuff together — honestly, without panic — are in a much better position than those that don\'t.' },
        { type: 'cue', text: 'Gesture at both sides. Bring focus back to the info-box at the bottom.' },
      ],
      pace: 'Steady · ~5 min',
      cumulative: 12,
    },
  },
];

// meta declared after slides so loadSlides can reference the module-level array
export const meta: SlideshowMeta = {
  slug: 'tumbarumba-june-2026',
  title: 'The Future Is Arriving. Is Tumbarumba Ready?',
  eventSlug: 'tumbarumba-june-2026',
  slideCount: 3,
  description: 'A public talk about AI and its impact on our community, presented at The Café Nest Cinema, Tumbarumba.',
  loadSlides: () => Promise.resolve(slides),
};
