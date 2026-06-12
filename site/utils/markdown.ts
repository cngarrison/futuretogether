/**
 * site/utils/markdown.ts
 *
 * Shared markdown loading and rendering utilities.
 *
 * loadMarkdown() — reads a markdown file (local or https://) and parses
 * frontmatter if present. Returns raw markdown content + optional metadata.
 * Future: pass an https:// URL to load from Supabase bucket storage
 * transparently.
 *
 * renderMarkdown() — converts markdown to HTML using the shared site config
 * (GFM + mangle + heading IDs + smartypants).
 *
 * For blog-specific rendering (image captions, screenshots, callouts,
 * internal link transforms), see site/utils/blog.ts which applies additional
 * post-processing on top of renderMarkdown().
 */

import { Marked } from "marked";
import { mangle } from "marked-mangle";
import { gfmHeadingId } from "marked-gfm-heading-id";
import { markedSmartypants } from "marked-smartypants";
import { parse as parseYaml } from "@std/yaml";

// Isolated instance — avoids plugin double-registration if other modules
// also import marked.
const _marked = new Marked();
_marked
  .use({ async: false, pedantic: false, gfm: true, breaks: true })
  .use(mangle())
  .use(gfmHeadingId({}))
  .use(markedSmartypants());

/**
 * Convert markdown string to HTML.
 * Applies GFM + typographic enhancements shared across all site content.
 * Does NOT apply blog-specific transforms (image captions, callouts, etc.).
 */
export function renderMarkdown(content: string): string {
  return _marked.parse(content) as string;
}

export interface MarkdownFile {
  /** Markdown body text with frontmatter stripped. */
  content: string;
  /** Parsed frontmatter fields, if a YAML front-matter block was present. */
  metadata?: Record<string, unknown>;
}

/**
 * Load a markdown file and parse any frontmatter.
 *
 * filePath is relative to the site/ root (e.g. 'data/blog/my-article.md').
 * Pass an https:// URL to fetch from remote/bucket storage — no call-site
 * changes needed when migrating from local files to bucket hosting.
 */
export async function loadMarkdown(filePath: string): Promise<MarkdownFile> {
  let raw: string;

  if (filePath.startsWith("http")) {
    const res = await fetch(filePath);
    if (!res.ok) {
      throw new Error(`Failed to fetch markdown: ${filePath} (${res.status})`);
    }
    raw = await res.text();
  } else {
    // Resolve relative to this module so CWD doesn't matter.
    const url = new URL(`../${filePath}`, import.meta.url);
    raw = await Deno.readTextFile(url);
  }

  // Parse YAML frontmatter if present.
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { content: raw };

  try {
    const metadata = parseYaml(match[1]) as Record<string, unknown>;
    return { content: match[2].trim(), metadata };
  } catch {
    return { content: raw };
  }
}
