import type { SlideData } from "@/types/slideshows.ts";

/**
 * Dynamically loads slide content from a file path.
 * filePath is relative to the site/ root, e.g. 'data/slideshows/tumbarumba-june-2026.tsx'
 *
 * Uses Deno.cwd() for path resolution — always the site/ root in both dev
 * (deno task dev) and production (deno serve -A _fresh/server.js).
 *
 * NOTE: Do NOT use import.meta.url here. After Vite bundling it points to
 * _fresh/server/server-entry.mjs, so any relative path resolves inside _fresh/
 * instead of site/.
 *
 * Pass an https:// URL to load from remote storage instead.
 */
export async function loadSlides(filePath: string): Promise<SlideData[]> {
  const url = filePath.startsWith("http")
    ? filePath
    : `file://${Deno.cwd()}/${filePath}`;
  const mod = await import(url);
  return mod.slides ?? [];
}
