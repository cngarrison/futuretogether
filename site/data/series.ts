/**
 * Article series data — Future Together
 *
 * To add a new series:
 *   - Add an entry to the `series` array below.
 *   - The `slug` must match the `series` frontmatter field in blog posts.
 *   - Run `deno task check` to confirm no type errors.
 */

export interface SeriesMeta {
  slug: string;
  name: string;
  description: string;
  tagline: string;
}

export const series: SeriesMeta[] = [
  {
    slug: "facing-the-future",
    name: "Facing the Future",
    description:
      "A nine-part series written in February 2026 exploring the biggest questions around AI and societal change — from alignment and the Singularity, to work, community, and what you can do right now.",
    tagline: "A 9-part series on AI, society, and what comes next.",
  },
];

export function getSeriesBySlug(slug: string): SeriesMeta | undefined {
  return series.find((s) => s.slug === slug);
}
