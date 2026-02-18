import { define } from "@/utils.ts";

/**
 * Redirects to the slideshow HTML served as a static asset.
 * The file lives in site/static/slideshows/ and is served directly by Fresh.
 */
export const handlers = define.handlers({
  GET(_ctx) {
    return new Response(null, {
      status: 302,
      headers: {
        location: "/slideshows/discuss-our-future-slideshow-conversation.html",
      },
    });
  },
});
