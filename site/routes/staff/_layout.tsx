import type { LayoutConfig, PageProps } from "fresh";

export const config: LayoutConfig = {
  skipInheritedLayouts: true,
};

/**
 * Staff area layout — Fresh v2
 * Provides a minimal HTML shell for all /staff/* routes.
 *
 * _app.tsx detects /staff routes and returns <Component /> directly,
 * making this layout the outermost wrapper with no duplicate html/head/body.
 * `skipInheritedLayouts: true` prevents the root _layout.tsx (PageLayout) from wrapping
 * staff routes. The _app.tsx bypass prevents a duplicate html/head/body shell.
 */
export default function StaffLayout({ Component }: PageProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Future Together Staff</title>
        <link rel="stylesheet" href="/styles.css" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body class="bg-gray-100">
        <Component />
      </body>
    </html>
  );
}
