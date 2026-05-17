import { Head } from 'fresh/runtime';
import { define } from '@/utils.ts';
import { getSlideshowMeta } from '@/utils/slideshows/registry.ts';
import SlideDeck from '@/components/slideshows/SlideDeck.tsx';
import SlideshowSync from '@/islands/slideshows/SlideshowSync.tsx';
import SlideDeckSync from '@/islands/slideshows/SlideDeckSync.tsx';
import ConnectionStatus from '@/islands/slideshows/ConnectionStatus.tsx';
export default define.page(async function SlideshowPage({ params }) {
  const { slug } = params;
  const meta = getSlideshowMeta(slug);

  if (!meta) {
    return (
      <div style="padding:2rem;color:white;background:#0f1923;min-height:100vh;font-family:system-ui,sans-serif;">
        <p>Slideshow not found.</p>
        <a href="/slideshows" style="color:#7dd3fc;">Back to slideshows</a>
      </div>
    );
  }

  const slides = await meta.loadSlides();

  return (
    <>
      <Head>
        <title>{meta.title} \u2014 Future Together</title>
        <meta name="robots" content="noindex" />
      </Head>
      <SlideshowSync room={slug} role="receiver" />
      <SlideDeck slides={slides} />
      <SlideDeckSync role="receiver" slideCount={slides.length} />
      <ConnectionStatus />
    </>
  );
});
