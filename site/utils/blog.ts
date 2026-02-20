import { parse as parseYaml } from "@std/yaml";
import { marked } from "marked";
import { mangle } from "marked-mangle";
import { gfmHeadingId } from "marked-gfm-heading-id";
import { markedSmartypants } from "marked-smartypants";

// Configure marked
marked.use({
  async: false,
  pedantic: false,
  gfm: true,
  breaks: true,
})
  .use(mangle())
  .use(gfmHeadingId({}))
  .use(markedSmartypants());

// Types for blog post metadata
export interface BlogPostMeta {
  id: number;
  title: string;
  date: string;
  excerpt?: string;
  author?: string;
  tags?: string[];
}

export interface BlogPost extends BlogPostMeta {
  slug: string;
  content: string;
  html: string;
  firstParagraphHtml?: string;
  remainingHtml?: string;
}

const BLOG_DIR = "./blog";

// Parse frontmatter from markdown content
function parseFrontmatter(content: string): [BlogPostMeta | null, string] {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return [null, content];

  try {
    const [_, frontmatter, markdown] = match;
    const meta = parseYaml(frontmatter) as BlogPostMeta;

    // Validate required fields
    if (!meta.id || !meta.title) {
      return [null, content];
    }

    return [meta, markdown.trim()];
  } catch {
    return [null, content];
  }
}

// Process markdown content to handle headings and paragraphs
function processMarkdownContent(markdown: string): {
  firstParagraph: string;
  remaining: string;
} {
  // Remove leading h1 if it exists, split first paragraph and remaining content
  const contentMatch = markdown.match(/^(?:# .+\n\n)?([^]*?)(?:\n\n([^]*))?$/);

  if (!contentMatch) {
    return {
      firstParagraph: "",
      remaining: markdown,
    };
  }

  return {
    firstParagraph: contentMatch[1],
    remaining: (contentMatch[2] || "").trim(),
  };
}

// Transform HTML to add proper callout classes
function transformCallouts(html: string): string {
  return html.replace(
    /<div class="callout (info|warning|tip|success)">/g,
    (match, type) => `<div class="callout callout-${type}">`,
  );
}

// Transform internal links for Fresh client-side navigation
function transformInternalLinks(html: string): string {
  return html.replace(
    /<a([^>]*?)href=["']([^"']*?)["']([^>]*?)>/gi,
    (match, beforeHref, href, afterHref) => {
      // Only process internal links (start with / but not //)
      if (!href.startsWith("/") || href.startsWith("//")) {
        return match;
      }

      // Skip if f-client-nav already exists
      if (match.includes("f-client-nav")) {
        return match;
      }

      // Add f-client-nav={false} for internal links
      return `<a${beforeHref}href="${href}"${afterHref} f-client-nav="false">`;
    },
  );
}

// Transform regular images to add captions and styling
function transformImages(html: string): string {
  return html.replace(
    /<img([^>]*?)>/gi,
    (match) => {
      // Extract attributes
      const srcMatch = match.match(/src=["']([^"']*)["`']/i);
      const titleMatch = match.match(/title=["']([^"']*)["`']/i);
      const altMatch = match.match(/alt=["']([^"']*)["`']/i);

      if (!srcMatch) return match;

      const src = srcMatch[1];
      const caption = titleMatch ? titleMatch[1] : "";
      const altText = altMatch ? altMatch[1] : "";

      if (!caption) {
        // No caption, return original img
        return match;
      }

      // Wrap in figure with caption (no classes on img, they're in CSS)
      return `<figure class="blog-image-float"><img src="${src}" alt="${altText}" loading="lazy" /><figcaption>${caption}</figcaption></figure>`;
    },
  );
}

// Transform screenshots to add click-to-zoom functionality
function transformScreenshots(html: string): string {
  return html.replace(
    /<img([^>]*?)src=["']([^"']*screenshots\/[^"']*?)["']([^>]*?)>/gi,
    (match, beforeSrc, src, afterSrc) => {
      const altMatch = match.match(/alt=["']([^"']*)["']/i);
      const captionMatch = match.match(/data-caption=["']([^"']*)["']/i);
      const sizeMatch = match.match(
        /data-size=["'](small|medium|large|full)["']/i,
      );
      const clickableMatch = match.match(/data-clickable=["']false["']/i);

      const altText = altMatch ? altMatch[1] : "";
      const caption = captionMatch ? captionMatch[1] : "";
      const size = sizeMatch ? sizeMatch[1] : "medium";
      const clickable = !clickableMatch;

      const sizeClass = {
        "small": "max-w-sm",
        "medium": "max-w-2xl",
        "large": "max-w-4xl",
        "full": "w-full",
      }[size];

      const classes =
        `rounded-lg shadow-sm border border-gray-200 ${sizeClass} h-auto${
          clickable ? " hover:shadow-md cursor-pointer transition-shadow" : ""
        }`;

      const id = Math.random().toString(36).substr(2, 6);

      return `<figure class="mb-4" data-ss="${id}"><img src="${src}" alt="${altText}" class="${classes}" loading="lazy"${
        clickable
          ? ` onclick="openScreenshotOverlay('${id}','${src}','${altText}','${caption}')"`
          : ""
      }>${
        caption
          ? `<figcaption class="text-sm text-gray-500 mt-2 italic text-center">${caption}</figcaption>`
          : ""
      }</figure>`;
    },
  );
}

// Load and parse a single blog post
export async function loadBlogPost(filename: string): Promise<BlogPost | null> {
  try {
    const content = await Deno.readTextFile(`${BLOG_DIR}/${filename}`);
    const [meta, markdown] = parseFrontmatter(content);

    if (!meta) return null;

    const slug = filename.replace(/\.md$/, "");

    // Process the markdown content
    const { firstParagraph, remaining } = processMarkdownContent(markdown);

    // Convert to HTML and transform
    const firstParagraphHtml = firstParagraph
      ? transformImages(
        transformScreenshots(
          transformInternalLinks(
            transformCallouts(marked.parse(firstParagraph) as string),
          ),
        ),
      )
      : undefined;
    const remainingHtml = remaining
      ? transformImages(
        transformScreenshots(
          transformInternalLinks(
            transformCallouts(marked.parse(remaining) as string),
          ),
        ),
      )
      : undefined;
    const fullHtml = transformImages(
      transformScreenshots(
        transformInternalLinks(
          transformCallouts(marked.parse(markdown) as string),
        ),
      ),
    );

    return {
      ...meta,
      slug,
      content: markdown,
      html: fullHtml,
      firstParagraphHtml,
      remainingHtml,
    };
  } catch (e) {
    console.error(`Error loading blog post ${filename}:`, e);
    return null;
  }
}

// Load all valid blog posts
export async function loadBlogPosts(): Promise<BlogPost[]> {
  const posts: BlogPost[] = [];

  try {
    for await (const entry of Deno.readDir(BLOG_DIR)) {
      if (!entry.isFile || !entry.name.endsWith(".md")) continue;

      const post = await loadBlogPost(entry.name);
      if (post) posts.push(post);
    }

    // Sort by date ascending - descending is normal, there is a logical progression to the posts
    return posts.sort((a, b) =>
      // new Date(a.date).getTime() - new Date(b.date).getTime() // descending
      new Date(a.date).getTime() - new Date(b.date).getTime() // ascending
    );
  } catch (error) {
    console.error("Error loading blog posts:", error);
    return [];
  }
}

// Get post by slug
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  return await loadBlogPost(`${slug}.md`);
}

// Get related posts based on tags
export async function getRelatedPosts(
  post: BlogPost,
  limit: number = 3,
): Promise<BlogPost[]> {
  if (!post.tags || post.tags.length === 0) return [];

  const allPosts = await loadBlogPosts();
  const related = allPosts
    .filter((p) => p.id !== post.id)
    .map((p) => {
      const commonTags = p.tags?.filter((tag) =>
        post.tags?.includes(tag)
      ).length || 0;
      return { post: p, score: commonTags };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post);

  return related;
}
