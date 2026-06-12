/**
 * site/utils/db/blog.ts
 *
 * Supabase-backed data access for blog articles.
 * Replaces legacy YAML-walking code in site/utils/blog.ts.
 * Content (HTML) is loaded from markdown files referenced by file_path.
 */

import type { State } from "@/utils.ts";
import { loadMarkdown, renderMarkdown } from "@/utils/markdown.ts";
import {
  applyAllTransforms,
  processMarkdownContent,
} from "@/utils/blog-transforms.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A blog article — metadata from DB, HTML content populated on demand. */
export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  /** ISO date string — mapped from published_at. */
  date: string;
  excerpt?: string;
  author?: string;
  tags?: string[];
  /** Series slug (joined from blog_series). */
  series?: string;
  series_part?: number;
  file_path: string;
  // Populated by getBlogArticleBySlug only
  content?: string;
  html?: string;
  firstParagraphHtml?: string;
  remainingHtml?: string;
}

/** Series metadata — compatible with @/data/series.ts shape. */
export interface SeriesMeta {
  id: string;
  slug: string;
  /** Mapped from blog_series.title — kept as 'name' for backward compat. */
  name: string;
  title: string; // same value; use either
  description?: string;
}

const ARTICLE_SELECT =
  "id, slug, title, published_at, excerpt, author, tags, series_part, file_path, blog_series(slug)";

function rowToArticle(row: Record<string, unknown>): BlogArticle {
  const seriesRow = row.blog_series as { slug: string } | null;
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    date: (row.published_at as string) ?? "",
    excerpt: (row.excerpt ?? undefined) as string | undefined,
    author: (row.author ?? undefined) as string | undefined,
    tags: (row.tags ?? undefined) as string[] | undefined,
    series: seriesRow?.slug ?? undefined,
    series_part: (row.series_part ?? undefined) as number | undefined,
    file_path: row.file_path as string,
  };
}

function rowToSeriesMeta(row: Record<string, unknown>): SeriesMeta {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.title as string,
    title: row.title as string,
    description: (row.description ?? undefined) as string | undefined,
  };
}

/** Read a markdown file and build HTML fields on an article. */
async function populateContent(
  article: BlogArticle,
): Promise<BlogArticle> {
  try {
    const { content: markdown } = await loadMarkdown(article.file_path);
    const { firstParagraph, remaining } = processMarkdownContent(markdown);

    return {
      ...article,
      content: markdown,
      html: applyAllTransforms(renderMarkdown(markdown)),
      firstParagraphHtml: firstParagraph
        ? applyAllTransforms(renderMarkdown(firstParagraph))
        : undefined,
      remainingHtml: remaining
        ? applyAllTransforms(renderMarkdown(remaining))
        : undefined,
    };
  } catch (e) {
    console.error(`Error loading blog content from ${article.file_path}:`, e);
    return article;
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Get all published articles, newest first (no HTML content). */
export async function getAllBlogArticles(
  state: State,
): Promise<BlogArticle[]> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("blog_articles")
      .select(ARTICLE_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false });
    //console.log(`DbBlog: getAllBlogArticles`, { data, error });
    if (error || !data) return [];
    return data.map((r) => rowToArticle(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

/** Get a single published article by slug, with HTML content populated. */
export async function getBlogArticleBySlug(
  slug: string,
  state: State,
): Promise<BlogArticle | null> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("blog_articles")
      .select(ARTICLE_SELECT)
      .eq("slug", slug)
      .eq("status", "published")
      .single();
    if (error || !data) return null;
    const article = rowToArticle(data as Record<string, unknown>);
    return await populateContent(article);
  } catch {
    return null;
  }
}

/** Get all published articles belonging to a series, ordered by series_part. */
export async function getSeriesArticles(
  seriesId: string,
  state: State,
): Promise<BlogArticle[]> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("blog_articles")
      .select(ARTICLE_SELECT)
      .eq("series_id", seriesId)
      .eq("status", "published")
      .order("series_part", { ascending: true });
    if (error || !data) return [];
    return data.map((r) => rowToArticle(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

/** Get related published articles by tag overlap, excluding the source article. */
export async function getRelatedArticles(
  articleId: string,
  tags: string[],
  state: State,
  limit = 3,
): Promise<BlogArticle[]> {
  if (tags.length === 0) return [];
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("blog_articles")
      .select(ARTICLE_SELECT)
      .eq("status", "published")
      .neq("id", articleId)
      .overlaps("tags", tags)
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((r) => rowToArticle(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Series
// ---------------------------------------------------------------------------

/** Get all blog series. */
export async function getAllSeries(state: State): Promise<SeriesMeta[]> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("blog_series")
      .select("id, slug, title, description");
    if (error || !data) return [];
    return data.map((r) => rowToSeriesMeta(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

/** Get series metadata by slug. Returns null if not found. */
export async function getSeriesMeta(
  slug: string,
  state: State,
): Promise<SeriesMeta | null> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("blog_series")
      .select("id, slug, title, description")
      .eq("slug", slug)
      .single();
    if (error || !data) return null;
    return rowToSeriesMeta(data as Record<string, unknown>);
  } catch {
    return null;
  }
}
