import type { SlideData } from "@/types/slideshows.ts";

interface SlideDeckProps {
  slides: SlideData[];
}

export default function SlideDeck({ slides }: SlideDeckProps) {
  const showNavHint = false; // fade animation in slideshow.css isn't working
  return (
    <div class="deck" id="slide-deck">
      {slides.map((slide, i) => (
        <div class="slide" key={slide.id} id={`slide-${i}`}>
          {showNavHint && i === 1 && (
            <div class="nav-hint">&larr; &rarr; Navigate or scroll right</div>
          )}
          {slide.content}
          <div class="brand-bar">
            {/* Left: slide counter */}
            <span class="slide-counter">
              {i + 1}/{slides.length}
            </span>
            {/* Centre: logo mark + wordmark + domain */}
            <span class="brand-bar-centre">
              <img
                src="/logo-mark-white.svg"
                alt="Future Together"
                style="height:34px;width:auto;vertical-align:middle;margin-right:0.5rem;opacity:0.9;"
              />
              <span class="brand-bar-name">Future Together</span>
              <span class="brand-bar-sep">&middot;</span>
              <span class="brand-bar-url">futuretogether.community</span>
            </span>
            {/* Right: spacer to balance the counter */}
            <span style="min-width:4rem;" />
          </div>
        </div>
      ))}
    </div>
  );
}
