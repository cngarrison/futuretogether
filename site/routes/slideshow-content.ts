import { define } from "@/utils.ts";

/**
 * Serves the meetup slideshow HTML file directly.
 * The file lives in social-media/ (outside site/) and is read at runtime.
 */
export const handlers = define.handlers({
  async GET(_ctx) {
    try {
      const filePath = new URL(
        "../slideshows/discuss-our-future-slideshow-conversation.html",
        import.meta.url,
      );
      const html = await Deno.readTextFile(filePath);
      return new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    } catch (err) {
      console.error("Slideshow not found:", err);
      return new Response(
        "<html><body><p>Slideshow not currently available.</p><a href='/meetups'>Back to meetups</a></body></html>",
        {
          status: 404,
          headers: { "content-type": "text/html; charset=utf-8" },
        },
      );
    }
  },
});
