import { define } from "@/utils.ts";
import type { PageProps } from "fresh";

/**
 * Staff area layout — Fresh v2
 * Skips the main _app.tsx wrapper so the staff portal has its own
 * minimal shell (no public nav/footer).
 */
export const config = define.config({
  skipAppWrapper: true,
  skipInheritedLayouts: true,
});

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
