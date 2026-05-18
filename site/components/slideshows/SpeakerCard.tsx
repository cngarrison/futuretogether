import type { SlideData } from "@/types/slideshows.ts";

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
      class="speaker-card"
    >
      <div class="speaker-card-heading">
        <span class="speaker-card-number">
          Slide {index + 1} / {total}
        </span>
        {notes?.pace && (
          <span class="speaker-card-pace">
            {notes.pace}
            {notes.cumulative ? ` → ${notes.cumulative} min` : ""}
          </span>
        )}
      </div>
      <p class="speaker-card-anchor">
        {notes?.anchor ?? slide.title}
      </p>
      {notes?.bullets && notes.bullets.length > 0 && (
        <ul class="speaker-card-bullets">
          {notes.bullets.map((b, i) => (
            <li
              key={i}
              class={`speaker-card-bullet-item ${
                b.type === "say" ? "say" : b.type === "cue" ? "cue" : "default"
              }`}
            >
              {b.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
