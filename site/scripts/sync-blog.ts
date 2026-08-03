#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read
/**
 * site/scripts/sync-blog.ts
 *
 * Upserts ONLY blog_articles from data/blog/*.md into Supabase.
 * Safe to run any time you add or edit a blog article — unlike
 * migrate-content.ts (the full seed script), this touches no other
 * tables (events, resources, slideshows, series rows are left alone).
 *
 * Run from site/ directory: deno task sync-blog
 * Against production:       deno task sync-blog --env production
 *
 * Reads blog_series only (to resolve series_id for frontmatter `series:`
 * values) — never writes to blog_series.
 */

import { load as loadDotenv } from "@std/dotenv";
import { parseArgs } from "@std/cli";
import { loadMarkdown } from "../utils/markdown.ts";

// --env <name> loads .env.<name>  (default: local → .env.local)
const { env: envTarget } = parseArgs(Deno.args, {
  string: ["env"],
  default: { env: "local" },
});

await loadDotenv({ export: true, envPath: `.env.${envTarget}` });
console.log(`[env] Using ${envTarget} environment`);

const { createAdminClient } = await import("../utils/supabase.ts");
const admin = createAdminClient();

// ---------------------------------------------------------------------------
// Resolve series slugs -> ids (read-only; blog_series is never written here)
// ---------------------------------------------------------------------------
console.log("[1/2] Resolving blog_series (read-only)...");
const { data: seriesData, error: seriesErr } = await admin
  .from("blog_series")
  .select("id, slug");
if (seriesErr) {
  console.error("  blog_series lookup error:", seriesErr.message);
  Deno.exit(1);
}
const seriesIdMap: Record<string, string> = {};
for (const row of seriesData ?? []) seriesIdMap[row.slug] = row.id;
console.log(`  Found ${seriesData?.length ?? 0} existing series`);

// ---------------------------------------------------------------------------
// Upsert blog_articles only
// ---------------------------------------------------------------------------
console.log("[2/2] Upserting blog_articles from data/blog/*.md...");
const blogRows: object[] = [];
const skipped: string[] = [];

for await (const entry of Deno.readDir("data/blog")) {
  if (!entry.name.endsWith(".md")) continue;
  const slug = entry.name.replace(/\.md$/, "");
  const { metadata: fm } = await loadMarkdown(`data/blog/${entry.name}`);
  if (!fm) {
    skipped.push(entry.name);
    console.warn(`  No frontmatter in ${entry.name}, skipping`);
    continue;
  }

  const seriesSlug = fm.series ? String(fm.series) : null;
  if (seriesSlug && !seriesIdMap[seriesSlug]) {
    console.warn(
      `  ${entry.name}: series "${seriesSlug}" not found in blog_series — ` +
        `leaving series_id null. Add the series via migrate-content.ts first ` +
        `if this is intentional.`,
    );
  }

  blogRows.push({
    slug,
    title: String(fm.title ?? slug),
    author: String(
      fm.author ?? Deno.env.get("FT_SITE_OWNER_NAME") ?? "Charlie Garrison",
    ),
    excerpt: String(fm.excerpt ?? ""),
    published_at: fm.date
      ? new Date(String(fm.date)).toISOString()
      : new Date().toISOString(),
    status: "published",
    tags: Array.isArray(fm.tags) ? fm.tags : [],
    og_image: fm.og_image ? String(fm.og_image) : null,
    file_path: `data/blog/${slug}.md`,
    series_id: seriesSlug ? (seriesIdMap[seriesSlug] ?? null) : null,
    series_part: fm.series_part != null ? Number(fm.series_part) : null,
  });
}

if (blogRows.length === 0) {
  console.log("  No markdown files found in data/blog/ — nothing to do.");
  Deno.exit(0);
}

const { data: articleData, error: articleErr } = await admin
  .from("blog_articles")
  .upsert(blogRows, { onConflict: "slug" })
  .select("id, slug");
if (articleErr) {
  console.error("  blog_articles error:", articleErr.message);
  Deno.exit(1);
}

console.log(`  Upserted ${articleData?.length ?? 0} article(s):`);
for (const row of articleData ?? []) console.log(`    - ${row.slug}`);
if (skipped.length > 0) {
  console.log(`  Skipped ${skipped.length} file(s) with no frontmatter:`);
  for (const name of skipped) console.log(`    - ${name}`);
}

console.log("\n✓ Blog sync complete. No other tables were touched.");
