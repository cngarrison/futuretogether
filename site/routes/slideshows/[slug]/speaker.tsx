import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getSlideshowMeta } from "@/utils/slideshows/registry.ts";
import SpeakerCard from "@/components/slideshows/SpeakerCard.tsx";
import SlideshowSync from "@/islands/slideshows/SlideshowSync.tsx";
import SpeakerNotesSync from "@/islands/slideshows/SpeakerNotesSync.tsx";
import ConnectionStatus from "@/islands/slideshows/ConnectionStatus.tsx";
import SpeakerControls from "@/islands/slideshows/SpeakerControls.tsx";
import SpeakerTimer from "@/islands/slideshows/SpeakerTimer.tsx";
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
      <div class="speaker-notes">
		<SpeakerControls title={meta.title} slug={slug} />
		{slides.map((slide: SlideData, i: number) => (
		  <SpeakerCard
			key={slide.id}
			slide={slide}
			index={i}
			total={slides.length}
		  />
		))}
      </div>
      <SpeakerNotesSync role="controller" slideCount={slides.length} />
      <SpeakerTimer totalDurationMinutes={45} />
      <ConnectionStatus />
    </>
  );
});
