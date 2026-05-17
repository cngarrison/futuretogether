import { useEffect } from 'preact/hooks';
import { currentSlide, navigate } from './SlideshowSync.tsx';
import type { SlideshowRole } from '@/types/slideshows.ts';

interface Props {
  role: SlideshowRole;
  slideCount: number;
}

export default function SpeakerNotesSync({ role, slideCount }: Props) {
  // Speaker page is a scrollable card list — undo the overflow:hidden the slideshow
  // layout sets on <body> (needed for the deck scroll-snap, wrong here).
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    // Highlight active card and scroll it into view whenever the slide changes.
    const unsubscribe = currentSlide.subscribe((index) => {
      document.getElementById(`speaker-card-${index}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
      document.querySelectorAll('[data-speaker-card]').forEach((el, i) => {
        const div = el as HTMLElement;
        div.style.opacity = i === index ? '1' : '0.45';
        div.style.borderLeft = i === index
          ? '3px solid #c4853a'
          : '3px solid transparent';
      });
    });

    if (role !== 'controller') return unsubscribe;

    // --- Keyboard: arrows + up/down ---
    const handleKey = (e: KeyboardEvent) => {
      const next = currentSlide.value + 1;
      const prev = currentSlide.value - 1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        navigate(Math.min(next, slideCount - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        navigate(Math.max(prev, 0));
      }
    };
    globalThis.addEventListener('keydown', handleKey);

    // --- Tap a card → navigate to that slide (event delegation) ---
    const handleClick = (e: MouseEvent) => {
      const card = (e.target as Element).closest('[data-speaker-card]');
      if (!card) return;
      const cards = Array.from(document.querySelectorAll('[data-speaker-card]'));
      const index = cards.indexOf(card);
      if (index !== -1) navigate(index);
    };
    globalThis.addEventListener('click', handleClick);

    // --- Swipe left/right → next/prev ---
    let touchStartX = 0;
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      // Only intercept clearly horizontal swipes; let vertical swipes scroll the page.
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) navigate(Math.min(currentSlide.value + 1, slideCount - 1));
        else navigate(Math.max(currentSlide.value - 1, 0));
      }
    };
    globalThis.addEventListener('touchstart', onTouchStart, { passive: true });
    globalThis.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      unsubscribe();
      globalThis.removeEventListener('keydown', handleKey);
      globalThis.removeEventListener('click', handleClick);
      globalThis.removeEventListener('touchstart', onTouchStart);
      globalThis.removeEventListener('touchend', onTouchEnd);
    };
  }, [role, slideCount]);

  return null;
}
