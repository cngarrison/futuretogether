import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { currentSlide, navigate } from './SlideshowSync.tsx';
import type { SlideControllerInfo } from '@/types/slideshows.ts';

// Timer signals — seconds elapsed
const elapsed = signal(0);
const timerRunning = signal(false);

interface Props {
  slides: SlideControllerInfo[];
  totalDurationMinutes?: number;
}

function fmtTime(m: number, s: number): string {
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SlideController({ slides, totalDurationMinutes = 45 }: Props) {
  const totalSeconds = totalDurationMinutes * 60;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const unsubscribe = timerRunning.subscribe((running) => {
      if (running) {
        interval = setInterval(() => { elapsed.value += 1; }, 1000);
      } else {
        if (interval) clearInterval(interval);
      }
    });
    return () => { unsubscribe(); if (interval) clearInterval(interval); };
  }, []);

  const index = currentSlide.value;
  const slide = slides[index];
  const remaining = totalSeconds - elapsed.value;
  const mins = Math.floor(Math.abs(remaining) / 60);
  const secs = Math.abs(remaining) % 60;
  const overTime = remaining < 0;
  const timerColour = remaining <= 300 ? '#ef4444' : '#22c55e';

  // Pre-compute opacity to avoid template literals inside JSX style strings
  const prevOpacity = index === 0 ? '0.3' : '1';
  const nextOpacity = index === slides.length - 1 ? '0.3' : '1';

  return (
    <div style="background:#0f1923;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;color:white;font-family:system-ui,sans-serif;">
      {/* Timer */}
      <div style={`font-size:3.5rem;font-weight:700;font-variant-numeric:tabular-nums;color:${timerColour};letter-spacing:-0.02em;margin-bottom:0.25rem;`}>
        {overTime ? '-' : ''}{fmtTime(mins, secs)}
      </div>
      <div style="display:flex;gap:0.75rem;margin-bottom:2rem;">
        <button
          onClick={() => { timerRunning.value = !timerRunning.value; }}
          style="font-size:0.75rem;padding:0.3rem 0.8rem;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:transparent;color:white;cursor:pointer;"
        >
          {timerRunning.value ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={() => { elapsed.value = 0; timerRunning.value = false; }}
          style="font-size:0.75rem;padding:0.3rem 0.8rem;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:transparent;color:white;cursor:pointer;"
        >
          Reset
        </button>
      </div>

      {/* Slide info */}
      <div style="text-align:center;margin-bottom:2rem;max-width:320px;">
        <div style="font-size:0.65rem;opacity:0.4;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem;">Slide {index + 1} / {slides.length}</div>
        <div style="font-size:1.1rem;font-weight:600;line-height:1.35;">{slide?.title ?? '…'}</div>
        {slide?.notes?.anchor && (
          <div style="font-size:0.8rem;color:#7dd3fc;margin-top:0.4rem;opacity:0.8;">{slide.notes.anchor}</div>
        )}
        {slide?.notes && (
          <div style="font-size:0.7rem;opacity:0.35;margin-top:0.35rem;">
            {slide.notes.bullets.length} note{slide.notes.bullets.length !== 1 ? 's' : ''}
            {slide.notes.cumulative ? ` · ${slide.notes.cumulative} min` : ''}
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div style="display:flex;gap:1.5rem;">
        <button
          onClick={() => navigate(Math.max(index - 1, 0))}
          disabled={index === 0}
          style={`width:64px;height:64px;border-radius:50%;border:2px solid rgba(255,255,255,0.2);background:transparent;color:white;font-size:1.5rem;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:${prevOpacity};`}
        >
          ←
        </button>
        <button
          onClick={() => navigate(Math.min(index + 1, slides.length - 1))}
          disabled={index === slides.length - 1}
          style={`width:64px;height:64px;border-radius:50%;border:2px solid rgba(255,255,255,0.2);background:rgba(196,133,58,0.3);color:white;font-size:1.5rem;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:${nextOpacity};`}
        >
          →
        </button>
      </div>
    </div>
  );
}
