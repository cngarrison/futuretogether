import type { SlideData } from "@/types/slideshows.ts";

/**
 * Lazy glob — Vite compiles each .tsx into its own chunk (same Preact instance
 * as the app) but only loads the chunk when requested. This is necessary because
 * slideshow files contain JSX; a runtime file:// import uses Deno's compiler and
 * creates a separate Preact instance, causing VNodes to silently fail to render.
 *
 * Use .tsx for slideshows that need JSX / variable interpolation.
 */
const tsxModules = import.meta.glob<{ slides: SlideData[] }>(
  "../../data/slideshows/*.tsx",
);

/**
 * Lazy glob for pre-compiled JSON slideshows (contentHtml strings, no JSX).
 * { import: "default" } returns the parsed JSON object directly.
 *
 * Use .json for static pre-compiled slideshows (local only).
 * For remote/bucket hosting, prefer .ts — see ft-v8s.
 */
const jsonModules = import.meta.glob<{ slides: SlideData[] }>(
  "../../data/slideshows/*.json",
  { import: "default" },
);

/**
 * Loads slide content for a given file_path from the DB.
 *
 * Supported sources:
 *   - 'data/slideshows/my-talk.tsx'   — local JSX (Vite glob, lazy, same Preact instance)
 *   - 'data/slideshows/my-talk.json'  — local pre-compiled JSON (Vite glob, lazy)
 *   - 'https://...'                   — remote .ts pre-compiled (Deno native import)
 *
 * Remote files must be pre-compiled .ts with no JSX — plain `export const slides`
 * with contentHtml strings. Deno handles remote TypeScript natively, and without
 * JSX there is no Preact instance conflict. See ft-v8s for the pre-compile script.
 *
 * NOTE: Do not upload raw .tsx to a bucket for remote import — JSX creates a
 * separate Preact instance, causing VNodes to silently fail to render.
 */
export async function loadSlides(filePath: string): Promise<SlideData[]> {
  // Remote .ts — Deno imports and compiles natively, no Preact instance conflict
  // (pre-compiled files contain no JSX or Preact imports).
  if (filePath.startsWith("http")) {
    const mod = await import(filePath);
    return mod.slides ?? [];
  }

  // Local file — match by filename against the appropriate glob map.
  const basename = filePath.split("/").pop() ?? "";
  const modules = basename.endsWith(".json") ? jsonModules : tsxModules;
  const key = Object.keys(modules).find((k) => k.endsWith(`/${basename}`));
  if (!key) return [];
  const mod = await modules[key]();
  return mod.slides ?? [];
}
