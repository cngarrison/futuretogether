import type { SlideData } from "@/types/slideshows.ts";

/**
 * Dynamically loads slide content from a file path.
 * filePath is relative to the site/ root, e.g. 'data/slideshows/tumbarumba-june-2026.tsx'
 * No static .tsx imports — file_path from DB drives everything.
 * Future: accept https:// URLs or temp file paths from bucket downloads.
 */
export async function loadSlides(filePath: string): Promise<SlideData[]> {
  const url = filePath.startsWith("http")
    ? filePath
    : new URL(`../../${filePath}`, import.meta.url).href;
  const mod = await import(url);
  return mod.slides ?? [];
}
