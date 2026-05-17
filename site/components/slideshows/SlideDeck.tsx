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
            <span>futuretogether.community</span>
            <div class="slide-number">{i + 1} / {slides.length}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
