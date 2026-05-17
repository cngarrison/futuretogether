import { Head } from 'fresh/runtime';
import { define } from '@/utils.ts';
import { getSlideshowMeta } from '@/utils/slideshows/registry.ts';
import SlideController from '@/islands/slideshows/SlideController.tsx';
import SlideshowSync from '@/islands/slideshows/SlideshowSync.tsx';
import ConnectionStatus from '@/islands/slideshows/ConnectionStatus.tsx';
export default define.page(async function ControllerPage({ params }) {
  const { slug } = params;
  const meta = getSlideshowMeta(slug);
  if (!meta) {
    return <div style="padding:2rem;color:white;background:#0f1923;min-height:100vh;">Slideshow not found.</div>;
  }

  const slides = await meta.loadSlides();

  return (
    <>
      <Head><title>Controller \u2014 {meta.title}</title></Head>
      <SlideshowSync room={slug} role="controller" />
      <SlideController slides={slides} totalDurationMinutes={45} />
      <ConnectionStatus />
    </>
  );
});
