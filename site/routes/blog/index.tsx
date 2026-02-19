import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { loadBlogPosts } from "@/utils/blog.ts";
import type { BlogPost } from "@/utils/blog.ts";

export default define.page(async function Blog() {
  const posts = await loadBlogPosts();

  // Get unique tags for the tag cloud
  const tags = [...new Set(posts.flatMap((post) => post.tags || []))].sort();

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

      <div
        style="background-color: #f7f4ef;"
        class="min-h-screen py-14"
      >
        <div class="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Tag cloud */}
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

          {/* Blog posts */}
          <div class="space-y-10">
            {posts.map((post) => (
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </article>
            ))}
          </div>

          {posts.length === 0 && (
            <p style="color: rgba(28,26,24,0.5);">
              No posts yet. Check back soon.
            </p>
          )}
        </div>
      </div>
    </>
  );
});
