import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getAllSlideshows } from "@/utils/db/content.ts";

export default define.page(async function SlideshowsIndex(ctx) {
  const shows = await getAllSlideshows(ctx.state);
  return (
    <>
      <Head>
        <title>Slideshows — Future Together</title>
      </Head>
      <div style="padding:2rem;color:white;font-family:system-ui,sans-serif;background:#0f1923;min-height:100vh;">
        <h1 style="font-size:1.5rem;margin-bottom:1.5rem;">Slideshows</h1>
        {shows.length === 0
          ? <p style="opacity:0.5;">No slideshows available.</p>
          : (
            <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:0.75rem;">
              {shows.map((s) => (
                <li key={s.slug}>
                  <a
                    href={`/slideshows/${s.slug}`}
                    style="color:#7dd3fc;text-decoration:none;font-size:1rem;"
                  >
                    {s.title}
                  </a>
                  <span style="font-size:0.75rem;opacity:0.4;margin-left:0.75rem;">
                    {s.slide_count} slides
                  </span>
                </li>
              ))}
            </ul>
          )}
      </div>
    </>
  );
});
