import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getSlideshowMeta } from "@/utils/slideshows/registry.ts";
import SpeakerCard from "@/components/slideshows/SpeakerCard.tsx";
import SlideshowSync from "@/islands/slideshows/SlideshowSync.tsx";
import SpeakerNotesSync from "@/islands/slideshows/SpeakerNotesSync.tsx";
import ConnectionStatus from "@/islands/slideshows/ConnectionStatus.tsx";
import type { SlideData } from "@/types/slideshows.ts";

export default define.page(async function SpeakerPage({ params }) {
  const { slug } = params;
  const meta = getSlideshowMeta(slug);
  if (!meta) {
    return (
      <div style="padding:2rem;color:white;background:#0d1117;min-height:100vh;">
        Slideshow not found.
      </div>
    );
  }

  const slides = await meta.loadSlides();

  return (
    <>
      <Head>
        <title>Speaker Notes — {meta.title}</title>
      </Head>
      {/* Speaker page is always the controller — navigating here drives all receivers */}
      <SlideshowSync room={slug} role="controller" />
      <div style="background:#0d1117;min-height:100dvh;padding:1rem;overflow-y:auto;">
        <div style="max-width:480px;margin:0 auto;padding-bottom:4rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;padding-bottom:0.75rem;border-bottom:1px solid rgba(255,255,255,0.1);">
            <span style="font-size:0.75rem;color:rgba(255,255,255,0.5);">
              {meta.title}
            </span>
            <a
              href={`/slideshows/${slug}`}
              style="font-size:0.7rem;color:rgba(255,255,255,0.35);"
              target="_blank"
              rel="noopener noreferrer"
            >
              Slideshow ↗
            </a>
          </div>
          {slides.map((slide: SlideData, i: number) => (
            <SpeakerCard
              key={slide.id}
              slide={slide}
              index={i}
              total={slides.length}
            />
          ))}
        </div>
      </div>
      <SpeakerNotesSync role="controller" slideCount={slides.length} />
      <ConnectionStatus />
    </>
  );
});
