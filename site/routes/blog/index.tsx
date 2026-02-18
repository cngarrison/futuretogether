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
      <div class="max-w-4xl mx-auto px-4 py-12">
        <p class="text-xl mb-8" style="color: rgba(28,26,24,0.65);">
          Essays and perspectives on AI, technological change, and preparing for
          the future together.
        </p>

        {/* Tag cloud */}
        {tags.length > 0 && (
          <div class="mb-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Topics</h2>
            <div class="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  class="text-sm px-3 py-1.5 rounded-full border"
                  style={{
                    backgroundColor: "#FFF8DC",
                    color: "#B8860B",
                    borderColor: "#FFA500",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Blog posts */}
        <div class="space-y-8">
          {posts.map((post) => (
            <article
              key={post.id}
              class="border-b border-gray-200 pb-8 last:border-b-0"
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
                class="flex items-center gap-4 text-sm mb-3"
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
                <p class="mb-4" style="color: rgba(28,26,24,0.7);">
                  {post.excerpt}
                </p>
              )}
              {post.tags && post.tags.length > 0 && (
                <div class="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </>
  );
});
