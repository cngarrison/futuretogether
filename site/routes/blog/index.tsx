import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { loadBlogPosts } from "@/utils/blog.ts";
import { getSeriesBySlug, series as allSeries } from "@/data/series.ts";

export default define.page(async function Blog() {
  const posts = await loadBlogPosts(); // already newest-first

  // Separate series posts from standalone posts
  const seriesSlugs = new Set(allSeries.map((s) => s.slug));
  const standalonePosts = posts.filter((p) => !p.series || !seriesSlugs.has(p.series));

  // Collect unique series slugs that appear in the post list
  const presentSeriesSlugs = [...new Set(
    posts.filter((p) => p.series && seriesSlugs.has(p.series)).map((p) => p.series!)
  )];

  // For each series, find the earliest post date and total count (for card metadata)
  const seriesCardData = presentSeriesSlugs.map((slug) => {
    const meta = getSeriesBySlug(slug)!;
    const seriesPosts = posts.filter((p) => p.series === slug)
      .sort((a, b) => (a.series_part ?? 0) - (b.series_part ?? 0));
    return {
      meta,
      count: seriesPosts.length,
      startDate: seriesPosts[0]?.date ?? "",
      endDate: seriesPosts[seriesPosts.length - 1]?.date ?? "",
    };
  });

  // Get unique tags from standalone posts only for the tag cloud
  const tags = [...new Set(standalonePosts.flatMap((post) => post.tags || []))].sort();

  return (
    <>
      <Head>
        <title>Blog — Future Together</title>
        <meta
          name="description"
          content="Essays and perspectives on AI, technological change, and what it means for society."
        />
      </Head>

      {/* Hero */}
      <section style="background-color: #1a5f6e; color: white;" class="pt-16">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <h1 class="text-4xl font-bold mb-3">Blog</h1>
          <p class="text-lg" style="color: rgba(255,255,255,0.8);">
            Essays and perspectives on AI, technological change, and what it
            means for all of us.
          </p>
        </div>
      </section>

      <div style="background-color: #f7f4ef;" class="min-h-screen py-14">
        <div class="max-w-4xl mx-auto px-4 sm:px-6">

          {/* Tag cloud — standalone posts only */}
          {tags.length > 0 && (
            <div class="mb-10">
              <h2
                class="text-sm font-semibold uppercase tracking-widest mb-4"
                style="color: rgba(28,26,24,0.45);"
              >
                Topics
              </h2>
              <div class="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    class="text-sm px-3 py-1.5 rounded-full"
                    style={{
                      backgroundColor: "#eef5f7",
                      color: "#1a5f6e",
                      border: "1px solid #d0e4e7",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div class="space-y-10">

            {/* Standalone articles — newest first */}
            {standalonePosts.map((post) => (
              <article
                key={post.id}
                class="bg-white rounded-2xl p-8"
                style="border: 1px solid #d0e4e7;"
              >
                <h2 class="text-2xl font-bold mb-2">
                  <a
                    href={`/blog/${post.slug}`}
                    class="transition-colors hover:opacity-75"
                    style="color: #1c1a18;"
                  >
                    {post.title}
                  </a>
                </h2>
                <div
                  class="flex items-center gap-4 text-sm mb-4"
                  style="color: rgba(28,26,24,0.55);"
                >
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  {post.author && <span>by {post.author}</span>}
                </div>
                {post.excerpt && (
                  <p class="mb-5" style="color: rgba(28,26,24,0.7);">
                    {post.excerpt}
                  </p>
                )}
                <a
                  href={`/blog/${post.slug}`}
                  class="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
                  style="color: #1a5f6e;"
                >
                  Read more
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </article>
            ))}

            {/* Series cards — one per series */}
            {seriesCardData.map(({ meta, count, startDate, endDate }) => (
              <a
                key={meta.slug}
                href={`/blog/series/${meta.slug}`}
                class="block rounded-2xl overflow-hidden transition-shadow hover:shadow-lg"
                style="border: 2px solid #1a5f6e; text-decoration: none;"
              >
                {/* Teal header band */}
                <div
                  class="px-8 py-5 flex items-center justify-between gap-4"
                  style="background-color: #1a5f6e;"
                >
                  <div class="flex items-center gap-3">
                    {/* Book-stack icon */}
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="opacity-80 shrink-0"
                    >
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                    <span
                      class="text-xs font-bold uppercase tracking-widest"
                      style="color: rgba(255,255,255,0.75);"
                    >
                      Series · {count} parts
                    </span>
                  </div>
                  <span
                    class="text-xs"
                    style="color: rgba(255,255,255,0.55);"
                  >
                    {new Date(startDate).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Card body */}
                <div class="bg-white px-8 py-7">
                  <h2
                    class="text-2xl font-bold mb-2"
                    style="color: #1c1a18;"
                  >
                    {meta.name}
                  </h2>
                  <p class="text-base mb-5" style="color: rgba(28,26,24,0.65);">
                    {meta.description}
                  </p>
                  <span
                    class="inline-flex items-center gap-1.5 text-sm font-semibold"
                    style="color: #1a5f6e;"
                  >
                    Read the series
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>

                {/* Amber bottom accent */}
                <div style="height: 4px; background-color: #c4853a;" />
              </a>
            ))}

          </div>

          {(standalonePosts.length === 0 && seriesCardData.length === 0) && (
            <p style="color: rgba(28,26,24,0.5);">No posts yet. Check back soon.</p>
          )}
        </div>
      </div>
    </>
  );
});
