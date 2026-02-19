import { define } from "@/utils.ts";
import { Head } from "fresh/runtime";

const SLIDESHOW_URL =
  "/slideshows/discuss-our-future-slideshow-conversation.html";

export default define.page(function Slideshow() {
  return (
     <>
     <Head>
        <title>Meetup Slideshow — Future Together</title>
        <meta
          name="description"
          content="The Future Together meetup slideshow — Discuss Our Future."
        />
      </Head>

      <div class="max-w-6xl mx-auto px-4 py-8">
        <div class="mb-4">
          <a
            href="/meetups"
            class="text-sm font-medium"
            style="color: #1a5f6e;"
          >
            ← Back to Meetups
          </a>
          <h1
            class="text-2xl font-bold mt-2"
            style="color: #1a5f6e;"
          >
            Discuss Our Future — Meetup Slideshow
          </h1>
        </div>

        {/* Iframe wrapper with floating presentation-mode link */}
        <div class="relative rounded-xl overflow-hidden shadow-lg border border-gray-200">
          <a
            href={SLIDESHOW_URL}
            target="_blank"
            rel="noopener noreferrer"
            class="absolute top-3 right-3 z-10 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
            style="background: rgba(26, 95, 110, 0.85); backdrop-filter: blur(4px);"
          >
            Open in presentation mode
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>

          <iframe
            src={SLIDESHOW_URL}
            title="Discuss Our Future — Meetup Slideshow"
            class="w-full"
            style="height: 82vh; border: none; display: block;"
          />
        </div>
      </div>
      </>
  );
});
