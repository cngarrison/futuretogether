import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getSlideshowMeta } from "@/utils/db/content.ts";
import { loadSlides } from "@/utils/slideshows/registry.ts";
import SlideDeck from "@/components/slideshows/SlideDeck.tsx";
import SlideshowSync from "@/islands/slideshows/SlideshowSync.tsx";
import SlideDeckSync from "@/islands/slideshows/SlideDeckSync.tsx";
import ConnectionStatus from "@/islands/slideshows/ConnectionStatus.tsx";

export default define.page(
  async function SlideshowPage({ params, url, state }) {
    const { slug } = params;
    const meta = await getSlideshowMeta(slug, state);

    if (!meta) {
      return (
        <div style="padding:2rem;color:white;background:#0f1923;min-height:100vh;font-family:system-ui,sans-serif;">
          <p>Slideshow not found.</p>
          <a href="/slideshows" style="color:#7dd3fc;">Back to slideshows</a>
        </div>
      );
    }

    const slides = await loadSlides(meta.file_path);

    // ?mode=control makes the slideshow itself the controller — arrow keys drive all receivers.
    // Default is receiver (audience view).
    const role = url.searchParams.get("mode") === "control"
      ? "controller"
      : "receiver";

    return (
      <>
        <Head>
          <title>{meta.title} — Future Together</title>
          <meta name="robots" content="noindex" />
        </Head>
        <SlideshowSync room={slug} role={role} />
        <SlideDeck slides={slides} />
        <SlideDeckSync role={role} slideCount={slides.length} />
        <ConnectionStatus />
      </>
    );
  },
);
