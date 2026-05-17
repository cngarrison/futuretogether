import { useEffect } from 'preact/hooks';
import { currentSlide, navigate } from './SlideshowSync.tsx';
import type { SlideshowRole } from '@/types/slideshows.ts';

interface Props {
  role: SlideshowRole;
  slideCount: number;
}

export default function SpeakerNotesSync({ role, slideCount }: Props) {
  useEffect(() => {
    const unsubscribe = currentSlide.subscribe((index) => {
      // Scroll active card into view
      const card = document.getElementById(`speaker-card-${index}`);
      card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      // Update visual active state
      document.querySelectorAll('[data-speaker-card]').forEach((el, i) => {
        (el as HTMLElement).style.opacity = i === index ? '1' : '0.45';
        (el as HTMLElement).style.borderLeft = i === index ? '3px solid #c4853a' : '3px solid transparent';
      });
    });

    if (role === 'controller') {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          navigate(Math.min(currentSlide.value + 1, slideCount - 1));
        } else if (e.key === 'ArrowLeft') {
          navigate(Math.max(currentSlide.value - 1, 0));
        }
      };
      globalThis.addEventListener('keydown', handleKey);
      return () => { unsubscribe(); globalThis.removeEventListener('keydown', handleKey); };
    }
    return unsubscribe;
  }, [role, slideCount]);

  return null;
}
