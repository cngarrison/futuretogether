import type { SlideshowMeta } from '@/types/slideshows.ts';
import { meta as tumbarumbaJune2026 } from '@/data/slideshows/tumbarumba-june-2026.tsx';

export const registry: SlideshowMeta[] = [
  tumbarumbaJune2026,
];

export function getSlideshowMeta(slug: string): SlideshowMeta | undefined {
  return registry.find((s) => s.slug === slug);
}

export function getAllSlideshows(): SlideshowMeta[] {
  return [...registry];
}
