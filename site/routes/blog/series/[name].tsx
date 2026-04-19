import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { loadSeriesPosts } from "@/utils/blog.ts";
import { getSeriesBySlug } from "@/data/series.ts";

export default define.page(async function SeriesPage(ctx) {
  const slug = ctx.params.name;
  const seriesMeta = getSeriesBySlug(slug);

  if (!seriesMeta) {
    return (
      <div
        class="max-w-4xl mx-auto px-4 py-8"
        style="padding-top: calc(4rem + 2rem);"
      >
        <h1 class="text-4xl font-bold mb-6">Series Not Found</h1>
        <p class="mb-4" style="color: rgba(28,26,24,0.7);">
          We couldn’t find a series called &ldquo;{slug}&rdquo;.
        </p>
        <a
          href="/blog"
          class="font-semibold transition-opacity hover:opacity-70"
          style="color: #1a5f6e;"
        >
          ← Back to blog
        </a>
      </div>
    );
  }

  const posts = await loadSeriesPosts(slug); // ascending by series_part
  const total = posts.length;

  return (
    <>
      <Head>
        <title>{seriesMeta.name} — Series — Future Together</title>
        <meta name="description" content={seriesMeta.description} />
      </Head>

      {/* Hero */}
      <section style="background-color: #1a5f6e; color: white;" class="pt-16">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          {/* Breadcrumb */}
          <div class="mb-4">
            <a
              href="/blog"
              class="text-sm font-medium transition-opacity hover:opacity-75"
              style="color: rgba(255,255,255,0.65);"
            >
              ← Articles
            </a>
          </div>

          <div class="flex items-center gap-2 mb-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="opacity-70 shrink-0"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span
              class="text-xs font-bold uppercase tracking-widest"
              style="color: rgba(255,255,255,0.65);"
            >
              Series · {total} parts
            </span>
          </div>

          <h1 class="text-4xl font-bold mb-4">{seriesMeta.name}</h1>
          <p class="text-lg max-w-2xl" style="color: rgba(255,255,255,0.8);">
            {seriesMeta.description}
          </p>
        </div>
      </section>

      {/* Amber rule under hero */}
      <div style="height: 4px; background-color: #c4853a;" />

      {/* Article list */}
      <div style="background-color: #f7f4ef;" class="min-h-screen py-14">
        <div class="max-w-4xl mx-auto px-4 sm:px-6">

          {posts.length === 0 && (
            <p style="color: rgba(28,26,24,0.5);">No articles in this series yet.</p>
          )}

          <ol class="space-y-8">
            {posts.map((post, idx) => (
              <li key={post.id}>
                <a
                  href={`/blog/${post.slug}`}
                  class="flex gap-5 bg-white rounded-2xl p-7 transition-shadow hover:shadow-md group"
                  style="border: 1px solid #d0e4e7; text-decoration: none;"
                >
                  {/* Part number bubble */}
                  <div
                    class="shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm mt-0.5"
                    style="background-color: #1a5f6e;"
                  >
                    {post.series_part ?? idx + 1}
                  </div>

                  {/* Content */}
                  <div class="flex-1 min-w-0">
                    <div
                      class="text-xs font-semibold uppercase tracking-widest mb-1.5"
                      style="color: rgba(28,26,24,0.45);"
                    >
                      Part {post.series_part ?? idx + 1} of {total}
                    </div>
                    <h2
                      class="text-xl font-bold mb-2 transition-opacity group-hover:opacity-75"
                      style="color: #1c1a18;"
                    >
                      {post.title}
                    </h2>
                    <div
                      class="flex items-center gap-3 text-sm mb-3"
                      style="color: rgba(28,26,24,0.5);"
                    >
                      <time dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                    </div>
                    {post.excerpt && (
                      <p style="color: rgba(28,26,24,0.68);" class="text-sm leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <div
                    class="shrink-0 self-center opacity-30 group-hover:opacity-60 transition-opacity"
                    style="color: #1a5f6e;"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
              </li>
            ))}
          </ol>

          {/* Back link */}
          <div class="mt-14 pt-8 border-t border-gray-200">
            <a
              href="/blog"
              class="font-semibold inline-flex items-center gap-2 transition-opacity hover:opacity-70"
              style="color: #1a5f6e;"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to blog
            </a>
          </div>
        </div>
      </div>
    </>
  );
});
