import { define } from "@/utils.ts";
import { Head } from "fresh/runtime";

export default define.page(function Slideshow() {
  return (
    <>
      <Head>
        <title>Meetup Slideshow — Future Together</title>
        <style>
          {`
          body { margin: 0; overflow: hidden; }
          .slideshow-frame {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            border: none;
          }
          .back-link {
            position: fixed;
            top: 12px;
            left: 12px;
            z-index: 100;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            background: rgba(26, 95, 110, 0.92);
            color: white;
            font-size: 13px;
            font-weight: 600;
            border-radius: 8px;
            text-decoration: none;
            backdrop-filter: blur(4px);
            transition: opacity 0.15s;
          }
          .back-link:hover { opacity: 0.8; }
        `}
        </style>
      </Head>

      <a href="/meetups" class="back-link">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Meetups
      </a>

      <iframe
        src="/slideshow-content"
        class="slideshow-frame"
        title="Discuss Our Future — Meetup Slideshow"
      />
    </>
  );
});
