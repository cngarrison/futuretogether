import type { SlideData } from '@/types/slideshows.ts';

interface SpeakerCardProps {
  slide: SlideData;
  index: number;
  total: number;
}

export default function SpeakerCard({ slide, index, total }: SpeakerCardProps) {
  const { notes } = slide;
  return (
    <div
      id={`speaker-card-${index}`}
      data-speaker-card="true"
      style="background:#1a2830;color:white;border-radius:12px;padding:1.25rem 1.5rem;margin-bottom:0.75rem;border-left:3px solid transparent;transition:opacity 0.2s,border-left 0.2s;"
    >
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem;">
        <span style="font-size:0.7rem;opacity:0.5;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Slide {index + 1} / {total}</span>
        {notes?.pace && <span style="font-size:0.7rem;opacity:0.5;">{notes.pace}{notes.cumulative ? ` → ${notes.cumulative} min` : ''}</span>}
      </div>
      <p style="font-size:1.1rem;font-weight:600;color:#7dd3fc;margin-bottom:0.75rem;line-height:1.4;margin-top:0;">
        {notes?.anchor ?? slide.title}
      </p>
      {notes?.bullets && notes.bullets.length > 0 && (
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.35rem;">
          {notes.bullets.map((b, i) => (
            <li
              key={i}
              style={`font-size:0.85rem;padding-left:1rem;border-left:2px solid ${b.type === 'say' ? '#c4853a' : b.type === 'cue' ? '#22c55e' : '#6b7280'};opacity:0.9;`}
            >
              {b.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
