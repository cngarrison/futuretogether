import type { PageProps } from "fresh";

export default function SlideshowLayout({ Component }: PageProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, user-scalable=no"
        />
        <meta name="robots" content="noindex" />
        <title>Future Together — Slideshow</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="slide-deck" style="margin:0;padding:0;overflow:hidden;background:#000;">
        <Component />
      </body>
    </html>
  );
}
