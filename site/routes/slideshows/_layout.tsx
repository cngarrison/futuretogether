import { define } from "@/utils.ts";
import type { LayoutConfig } from "fresh";
import SlideshowLayout from "@/components/SlideshowLayout.tsx";

export const config: LayoutConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

/**
 * Slideshow layout — full-screen HTML shell for all /slideshows/* routes.
 *
 * _app.tsx detects /slideshows routes and returns <Component /> directly,
 * making this layout the outermost wrapper with no duplicate html/head/body
 * and no PageHeader/PageFooter. Same pattern as /staff routes.
 *
 * Note: no <Partial> wrapper — slideshows use hard navigation only.
 */
export default define.layout(({ Component }) => {
  return <SlideshowLayout Component={Component} />;
});
