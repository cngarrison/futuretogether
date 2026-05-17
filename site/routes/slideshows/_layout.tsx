import type { PageProps } from 'fresh';

/**
 * Slideshow layout — full-screen HTML shell for all /slideshows/* routes.
 *
 * _app.tsx detects /slideshows routes and returns <Component /> directly,
 * making this layout the outermost wrapper with no duplicate html/head/body
 * and no PageHeader/PageFooter. Same pattern as /staff routes.
 *
 * Note: no <Partial> wrapper — slideshows use hard navigation only.
 */
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
        {/* Loads Tailwind output + slideshows.css (imported at end of styles.css) */}
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body style="margin:0;padding:0;overflow:hidden;background:#000;">
        <Component />
      </body>
    </html>
  );
}
