/**
 * site/utils/blog-transforms.ts
 *
 * Pure HTML/markdown transform helpers for blog content.
 * Extracted from legacy site/utils/blog.ts — no data access here.
 */

// ---------------------------------------------------------------------------
// Markdown splitting
// ---------------------------------------------------------------------------

/** Split markdown into first paragraph and remaining content. */
export function processMarkdownContent(markdown: string): {
  firstParagraph: string;
  remaining: string;
} {
  // Remove leading h1 if it exists, split first paragraph and remaining content
  const contentMatch = markdown.match(/^(?:# .+\n\n)?([^]*?)(?:\n\n([^]*))?$/);

  if (!contentMatch) {
    return { firstParagraph: "", remaining: markdown };
  }

  return {
    firstParagraph: contentMatch[1],
    remaining: (contentMatch[2] || "").trim(),
  };
}

// ---------------------------------------------------------------------------
// HTML transforms
// ---------------------------------------------------------------------------

/** Add proper callout classes to callout divs. */
export function transformCallouts(html: string): string {
  return html.replace(
    /<div class="callout (info|warning|tip|success|quote)">/g,
    (_match, type) => `<div class="callout callout-${type}">`,
  );
}

/** Add f-client-nav="false" to internal links for Fresh client-side navigation. */
export function transformInternalLinks(html: string): string {
  return html.replace(
    /<a([^>]*?)href=["']([^"']*?)["']([^>]*?)>/gi,
    (match, beforeHref, href, afterHref) => {
      if (!href.startsWith("/") || href.startsWith("//")) return match;
      if (match.includes("f-client-nav")) return match;
      return `<a${beforeHref}href="${href}"${afterHref} f-client-nav="false">`;
    },
  );
}

/** Wrap images that have a title attribute in a <figure> with caption. */
export function transformImages(html: string): string {
  return html.replace(
    /<img([^>]*?)>/gi,
    (match) => {
      const srcMatch = match.match(/src=["']([^"']*)[`"']/i);
      const titleMatch = match.match(/title=["']([^"']*)[`"']/i);
      const altMatch = match.match(/alt=["']([^"']*)[`"']/i);

      if (!srcMatch) return match;

      const src = srcMatch[1];
      const caption = titleMatch ? titleMatch[1] : "";
      const altText = altMatch ? altMatch[1] : "";

      if (!caption) return match;

      return `<figure class="blog-image-float"><img src="${src}" alt="${altText}" loading="lazy" /><figcaption>${caption}</figcaption></figure>`;
    },
  );
}

/** Wrap screenshot images in a figure with click-to-zoom support. */
export function transformScreenshots(html: string): string {
  return html.replace(
    /<img([^>]*?)src=["']([^"']*screenshots\/[^"']*?)["']([^>]*?)>/gi,
    (match, _beforeSrc, src, _afterSrc) => {
      const altMatch = match.match(/alt=["']([^"']*)["`']/i);
      const captionMatch = match.match(/data-caption=["']([^"']*)["`']/i);
      const sizeMatch = match.match(
        /data-size=["'](small|medium|large|full)["`']/i,
      );
      const clickableMatch = match.match(/data-clickable=["']false["']/i);

      const altText = altMatch ? altMatch[1] : "";
      const caption = captionMatch ? captionMatch[1] : "";
      const size = sizeMatch ? sizeMatch[1] : "medium";
      const clickable = !clickableMatch;

      const sizeClass = (
        {
          small: "max-w-sm",
          medium: "max-w-2xl",
          large: "max-w-4xl",
          full: "w-full",
        } as Record<string, string>
      )[size];

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

// ---------------------------------------------------------------------------
// Convenience pipeline
// ---------------------------------------------------------------------------

/** Apply all HTML transforms in the standard order. */
export function applyAllTransforms(html: string): string {
  return transformImages(
    transformScreenshots(
      transformInternalLinks(
        transformCallouts(html),
      ),
    ),
  );
}
