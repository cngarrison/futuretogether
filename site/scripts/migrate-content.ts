#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read
/**
 * site/scripts/migrate-content.ts
 *
 * Upserts site data from YAML/MD/TS sources into Supabase.
 * Run from site/ directory: deno task seed
 *
 * Order:
 *   1. blog_series
 *   2. group_events
 *   3. site_resources (external only)
 *   4. blog_articles
 *   5. event_slideshows
 */

import { load as loadDotenv } from "@std/dotenv";
import { parseArgs } from "@std/cli";
import { parse as parseYaml } from "@std/yaml";
import { loadMarkdown } from "../utils/markdown.ts";
import { series } from "../data/series.ts";
import { externalResources } from "../data/resources.ts";
import { meta as tumbarumbaJune2026Meta } from "../data/slideshows/tumbarumba-june-2026.tsx";

// --env <name> loads .env.<name>  (default: local → .env.local)
const { env: envTarget } = parseArgs(Deno.args, {
  string: ["env"],
  default: { env: "local" },
});

await loadDotenv({ export: true, envPath: `.env.${envTarget}` });
console.log(`[env] Using ${envTarget} environment`);

const { createAdminClient } = await import("../utils/supabase.ts");
const { generateRecurringInstancesForProgram } = await import(
  "../utils/cron.ts"
);
const admin = createAdminClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toSlug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

interface EventYaml {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string | Date;
  timezone?: string;
  duration: number;
  capacity: number;
  registrationDeadline?: number;
  meetingLink?: string;
  meetingLocation?: string;
  posterImage?: string;
  slideshowUrl?: string;
  isActive?: boolean;
  presentedBy?: string;
  sponsoredBy?: string;
  moreInfoFile?: string;
  resources?: unknown[];
  topics?: string[];
}

// ---------------------------------------------------------------------------
// 1. blog_series
// ---------------------------------------------------------------------------
console.log("[1/5] Upserting blog_series...");
const seriesRows = series.map((s) => ({
  slug: s.slug,
  title: s.name,
  description: s.description,
  part_count: 9, // facing-the-future is a 9-part series
}));
const { data: seriesData, error: seriesErr } = await admin
  .from("blog_series")
  .upsert(seriesRows, { onConflict: "slug" })
  .select("id, slug");
if (seriesErr) {
  console.error("  blog_series error:", seriesErr.message);
  Deno.exit(1);
}
const seriesIdMap: Record<string, string> = {};
for (const row of seriesData ?? []) seriesIdMap[row.slug] = row.id;
console.log(`  Upserted ${seriesData?.length ?? 0} series`);

// ---------------------------------------------------------------------------
// 2. programs + group_events (two-phase)
// ---------------------------------------------------------------------------
console.log("[2/5] Upserting programs + group_events...");
const { data: group, error: groupErr } = await admin
  .from("groups")
  .select("id")
  .eq("slug", "ft-global")
  .single();
if (groupErr || !group) {
  console.error("  ft-global group not found:", groupErr?.message);
  Deno.exit(1);
}
const groupId: string = group.id;

const eventYamls: EventYaml[] = [];
for await (const entry of Deno.readDir("data/events")) {
  if (!entry.name.endsWith(".yaml")) continue;
  const raw = await Deno.readTextFile(`data/events/${entry.name}`);
  eventYamls.push(parseYaml(raw) as EventYaml);
}
console.log(`  Found ${eventYamls.length} YAML files`);

// ── Phase A: deduplicate YAMLs by programme slug, upsert programs ─────────────
interface ProgramRow {
  slug: string;
  title: string;
  description: string;
  program_type: string;
  sequence: number;
  group_id: string;
  duration_minutes: number | null;
  capacity: number | null;
  registration_deadline_days: number;
  poster_image_path: string | null;
  slideshow_url: string | null;
  presented_by: string | null;
  sponsored_by: string | null;
  more_info_path: string | null;
  topics: string[] | null;
  resources: unknown[];
  visibility: string;
  status: string;
}

const programMap = new Map<string, ProgramRow>();
for (const e of eventYamls) {
  if (e.slug === "discuss-our-future") continue; // seeded by migration; program fetched below
  if (!programMap.has(e.slug)) {
    programMap.set(e.slug, {
      slug: e.slug,
      title: e.title,
      description: e.description,
      program_type: "one-off",
      sequence: 1,
      group_id: groupId,
      duration_minutes: e.duration ?? null,
      capacity: e.capacity ?? null,
      registration_deadline_days: e.registrationDeadline ?? 1,
      poster_image_path: e.posterImage ?? null,
      slideshow_url: e.slideshowUrl ?? null,
      presented_by: e.presentedBy ?? null,
      sponsored_by: e.sponsoredBy ?? null,
      more_info_path: e.moreInfoFile
        ? `data/events/more-info/${e.moreInfoFile}.md`
        : null,
      topics: e.topics ?? null,
      resources: e.resources ?? [],
      visibility: "public",
      status: "published",
    });
  }
}
const programRows = [...programMap.values()];

const { data: programData, error: programErr } = await admin
  .from("group_programs")
  .upsert(programRows, { onConflict: "group_id,slug,sequence" })
  .select("id, slug");
if (programErr) {
  console.error("  programs error:", programErr.message);
  Deno.exit(1);
}
console.log(`  Upserted ${programData?.length ?? 0} programs`);

const programIdMap: Record<string, string> = {};
for (const row of programData ?? []) programIdMap[row.slug] = row.id;

// Fetch the two 'discuss-our-future' programs seeded by migration (not managed here).
// Keyed by slug_suffix: 'morning' | 'evening'.
const { data: dofPrograms, error: dofErr } = await admin
  .from("group_programs")
  .select("id, slug_suffix")
  .eq("group_id", groupId)
  .eq("slug", "discuss-our-future");
if (dofErr) {
  console.error("  discuss-our-future programs fetch error:", dofErr.message);
  Deno.exit(1);
}
const dofProgramIdMap: Record<string, string> = {};
for (const p of dofPrograms ?? []) {
  if (p.slug_suffix) dofProgramIdMap[p.slug_suffix] = p.id;
}
console.log(
  `  Found ${
    Object.keys(dofProgramIdMap).length
  } discuss-our-future programs (morning/evening)`,
);

// ── Phase B: upsert group_events with program_id ────────────────────────────
const now = new Date();
const eventRows = eventYamls.map((e) => {
  const tz = e.timezone ?? "Australia/Sydney";
  // YAML event.date is a UTC ISO string (e.g. "2026-06-22T09:00:00Z").
  // Convert to naive local datetime for storage (ft-07i.15):
  //   Temporal.Instant.from(utcStr).toZonedDateTimeISO(tz).toPlainDateTime()
  //   gives the wall-clock local time, e.g. "2026-06-22T19:00:00" (AEST).
  const dateStr = e.date instanceof Date
    ? e.date.toISOString()
    : String(e.date);
  const naiveLocalDate = Temporal.Instant.from(dateStr)
    .toZonedDateTimeISO(tz)
    .toPlainDateTime()
    .toString();
  return {
    slug: e.id, // date-suffixed, unique per group
    group_id: groupId,
    program_id: e.slug === "discuss-our-future"
      ? (() => {
        // Route to morning or evening program by local hour of the event.
        // Morning sessions run at ~10:00 AEDT; evening at ~18:00 AEDT.
        const localHour = parseInt(
          naiveLocalDate.split("T")[1].split(":")[0],
          10,
        );
        const suffix = localHour < 14 ? "morning" : "evening";
        return dofProgramIdMap[suffix];
      })()
      : programIdMap[e.slug], // links to programs table
    event_date: naiveLocalDate,
    timezone: tz,
    duration_minutes: null, // use program default
    capacity: null, // use program default
    registration_deadline_days: null, // use program default
    title: null, // use program title
    location_type: e.meetingLink
      ? "online"
      : e.meetingLocation
      ? "physical"
      : null,
    location_name: e.meetingLocation ?? null,
    meeting_link: e.meetingLink ?? null,
    is_registration_required: true,
    visibility: "public",
    // Compare the original UTC date (from YAML) against now for status.
    status: new Date(e.date) >= now ? "published" : "completed",
  };
});

const { data: eventData, error: eventErr } = await admin
  .from("group_events")
  .upsert(eventRows, { onConflict: "group_id,slug" })
  .select("id, slug, program_id");
if (eventErr) {
  console.error("  group_events error:", eventErr.message);
  Deno.exit(1);
}
console.log(`  Upserted ${eventData?.length ?? 0} events`);

// ── Generate recurring instances for the two discuss-our-future programs ────
console.log(
  "  Generating recurring instances for discuss-our-future programs...",
);
for (const [suffix, programId] of Object.entries(dofProgramIdMap)) {
  const { created, error: cronErr } =
    await generateRecurringInstancesForProgram(programId);
  if (cronErr) {
    console.warn(
      `  discuss-our-future (${suffix}): recurring instance error: ${cronErr}`,
    );
  } else {
    console.log(
      `  discuss-our-future (${suffix}): created ${created} recurring instance(s)`,
    );
  }
}

// ---------------------------------------------------------------------------
// 3. site_resources (external only)
// ---------------------------------------------------------------------------
console.log("[3/5] Upserting site_resources...");
const resourceRows = externalResources.map((r, i) => ({
  slug: toSlug(r.title),
  title: r.title,
  resource_type: "article",
  url: r.url,
  description: r.description,
  tags: [] as string[],
  is_featured: false,
  sort_order: i + 1,
  category: r.category,
}));
const { data: resourceData, error: resourceErr } = await admin
  .from("site_resources")
  .upsert(resourceRows, { onConflict: "slug" })
  .select("id");
if (resourceErr) {
  console.error("  site_resources error:", resourceErr.message);
  Deno.exit(1);
}
console.log(`  Upserted ${resourceData?.length ?? 0} resources`);

// ---------------------------------------------------------------------------
// 4. blog_articles
// ---------------------------------------------------------------------------
console.log("[4/5] Upserting blog_articles...");
const blogRows: object[] = [];
for await (const entry of Deno.readDir("data/blog")) {
  if (!entry.name.endsWith(".md")) continue;
  const slug = entry.name.replace(/\.md$/, "");
  const { metadata: fm } = await loadMarkdown(`data/blog/${entry.name}`);
  if (!fm) {
    console.warn(`  No frontmatter in ${entry.name}, skipping`);
    continue;
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
    series_id: fm.series ? (seriesIdMap[String(fm.series)] ?? null) : null,
    series_part: fm.series_part != null ? Number(fm.series_part) : null,
  });
}
const { data: articleData, error: articleErr } = await admin
  .from("blog_articles")
  .upsert(blogRows, { onConflict: "slug" })
  .select("id");
if (articleErr) {
  console.error("  blog_articles error:", articleErr.message);
  Deno.exit(1);
}
console.log(`  Upserted ${articleData?.length ?? 0} articles`);

// ---------------------------------------------------------------------------
// 5. event_slideshows
// Registry: one entry — tumbarumba-june-2026
// eventSlug in meta is "tumbarumba-june-2026"; matched via event.slideshow_url
// (avoids importing JSX slideshow data file into a non-browser script).
// ---------------------------------------------------------------------------
console.log("[5/5] Upserting event_slideshows...");
const slideshows = [tumbarumbaJune2026Meta];
const slideshowRows = slideshows.map((s) => {
  // slideshow_url moved to programs — match via programRows then look up event
  const matchedProg = programRows.find((p) =>
    p.slideshow_url?.includes(s.slug)
  );
  const matchedEvent = matchedProg
    ? (eventData ?? []).find(
      (e: { id: string; program_id: string }) =>
        e.program_id === programIdMap[matchedProg.slug],
    )
    : undefined;
  return {
    slug: s.slug,
    title: s.title,
    event_id: matchedEvent?.id ?? null,
    file_path: `data/slideshows/${s.slug}.tsx`,
    slide_count: s.slideCount,
    duration_minutes: s.durationMinutes,
    description: s.description ?? null,
    is_published: true,
  };
});
const { data: slideshowData, error: slideshowErr } = await admin
  .from("event_slideshows")
  .upsert(slideshowRows, { onConflict: "slug" })
  .select("id");
if (slideshowErr) {
  console.error("  event_slideshows error:", slideshowErr.message);
  Deno.exit(1);
}
console.log(`  Upserted ${slideshowData?.length ?? 0} slideshows`);

// ---------------------------------------------------------------------------
console.log("\n✓ Migration complete.");
