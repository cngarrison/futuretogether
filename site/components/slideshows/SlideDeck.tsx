import type { SlideData } from '@/types/slideshows.ts';

interface SlideDeckProps {
  slides: SlideData[];
}

export default function SlideDeck({ slides }: SlideDeckProps) {
  return (
    <div class="deck" id="slide-deck">
      {slides.map((slide, i) => (
        <div class="slide" key={slide.id} id={`slide-${i}`}>
          {slide.content}
          <div class="brand-bar">
            {/* Left: slide counter */}
            <span class="slide-counter">
              {i + 1} / {slides.length}
            </span>
            {/* Centre: logo mark + wordmark + domain */}
            <span class="brand-bar-centre">
              <img
                src="/logo-white.svg"
                alt="Future Together"
                style="height:20px;width:auto;vertical-align:middle;margin-right:0.5rem;opacity:0.9;"
              />
              futuretogether.community
            </span>
            {/* Right: spacer to balance the counter */}
            <span style="min-width:4rem;" />
          </div>
        </div>
      ))}
    </div>
  );
}
