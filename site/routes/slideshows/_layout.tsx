import { define } from '@/utils.ts';
import { Partial } from 'fresh/runtime';

export default define.page(function SlideshowLayout({ Component }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
        <meta name="robots" content="noindex" />
        <title>Future Together — Slideshow</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body style="margin:0;padding:0;overflow:hidden;background:#000;">
        <Partial name="slideshow-body">
          <Component />
        </Partial>
      </body>
    </html>
  );
});
