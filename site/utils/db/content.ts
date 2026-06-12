/**
 * site/utils/db/content.ts
 *
 * Supabase-backed data access for blog series, site resources, and slideshows.
 * Moved from site/utils/content.ts — no logic changes.
 */

import type { State } from "@/utils.ts";
import type { SlideshowRecord } from "@/types/slideshows.ts";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface SiteResource {
  slug: string;
  title: string;
  resource_type: string;
  url: string;
  description: string;
  category: string;
  tags: string[];
  is_featured: boolean;
  sort_order?: number;
}

// ---------------------------------------------------------------------------
// Site resources
// ---------------------------------------------------------------------------

/** Get all site resources ordered by sort_order. */
export async function getSiteResources(state: State): Promise<SiteResource[]> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("site_resources")
      .select(
        "slug, title, resource_type, url, description, category, tags, is_featured, sort_order",
      )
      .order("sort_order", { ascending: true });
    if (error || !data) return [];
    return data as SiteResource[];
  } catch {
    return [];
  }
}

const SLIDESHOW_SELECT =
  "id, slug, title, event_id, file_path, is_published, slide_count, duration_minutes, description";

// ---------------------------------------------------------------------------
// Slideshows
// ---------------------------------------------------------------------------

/** Get all published slideshows. */
export async function getAllSlideshows(
  state: State,
): Promise<SlideshowRecord[]> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("event_slideshows")
      .select(SLIDESHOW_SELECT)
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data as SlideshowRecord[];
  } catch {
    return [];
  }
}

/** Get slideshow metadata by slug. Returns null if not found. */
export async function getSlideshowMeta(
  slug: string,
  state: State,
): Promise<SlideshowRecord | null> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("event_slideshows")
      .select(SLIDESHOW_SELECT)
      .eq("slug", slug)
      .single();
    if (error || !data) return null;
    return data as SlideshowRecord;
  } catch {
    return null;
  }
}
