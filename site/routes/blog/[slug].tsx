import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getPostBySlug, getRelatedPosts } from "@/utils/blog.ts";

export default define.page(async function BlogPost(ctx) {
  const post = await getPostBySlug(ctx.params.slug);

  if (!post) {
    return (
      <div
        class="max-w-4xl mx-auto px-4 py-8"
        style="padding-top: calc(4rem + 2rem);"
      >
        <h1 class="text-4xl font-bold mb-6">Post Not Found</h1>
        <p>The blog post you're looking for doesn't exist.</p>
        <a
          href="/blog"
          class="font-semibold transition-opacity hover:opacity-70"
          style="color: #1a5f6e;"
        >
          Return to blog
        </a>
      </div>
    );
  }

  const relatedPosts = await getRelatedPosts(post);

  return (
    <>
      <Head>
        <title>{post.title} — Future Together</title>
        <meta
          name="description"
          content={post.excerpt ||
            `Read ${post.title} on Future Together's blog`}
        />
      </Head>

      {/* Hero — teal band with title */}
      <section style="background-color: #1a5f6e; color: white;" class="pt-16">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-14">
          {/* Author + date pill */}
          <div class="mb-5 inline-flex rounded-full overflow-hidden text-sm">
            {post.author && (
              <span class="px-3 py-1.5 bg-white/20 font-medium">
                {post.author}
              </span>
            )}
            <time
              dateTime={post.date}
              class="px-3 py-1.5"
              style="background-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.75);"
            >
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>

          {/* Post title */}
          <h1 class="text-3xl sm:text-4xl font-bold leading-snug mb-4">
            {post.title}
          </h1>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div class="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  class="text-xs px-3 py-1 rounded-full font-medium"
                  style="background-color: rgba(255,255,255,0.15); color: rgba(255,255,255,0.85);"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Article body */}
      <div style="background-color: #f7f4ef;" class="py-14">
        <article class="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Lead paragraph */}
          {post.firstParagraphHtml && (
            <div
              class="prose prose-lg max-w-none text-lg mb-10 leading-relaxed"
              style="color: rgba(28,26,24,0.75);"
              dangerouslySetInnerHTML={{ __html: post.firstParagraphHtml }}
            />
          )}

          {/* Divider */}
          <hr class="border-gray-200 mb-10" />

          {/* Main content */}
          {post.remainingHtml && (
            <div
              class="prose prose-lg max-w-none prose-headings:font-bold prose-li:my-1.5 prose-img:rounded-lg prose-img:shadow-md"
              style="color: rgba(28,26,24,0.82);"
              dangerouslySetInnerHTML={{ __html: post.remainingHtml }}
            />
          )}

          {/* Clear floated images before related posts / footer */}
          <div style={{ clear: "both" }} />

          {/* Related posts */}
          {relatedPosts.length > 0 && (
            <aside
              class="mt-16 pt-10 border-t border-gray-200"
              style={{ clear: "both" }}
            >
              <h2 class="text-2xl font-bold mb-6" style="color: #1c1a18;">
                Related Posts
              </h2>
              <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((related) => (
                  <div
                    key={related.id}
                    class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                    style="border: 1px solid #d0e4e7;"
                  >
                    <h3 class="font-semibold mb-2" style="color: #1c1a18;">
                      <a
                        href={`/blog/${related.slug}`}
                        class="transition-opacity hover:opacity-70"
                      >
                        {related.title}
                      </a>
                    </h3>
                    <p
                      class="text-sm mb-2"
                      style="color: rgba(28,26,24,0.5);"
                    >
                      {new Date(related.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    {related.tags && related.tags.length > 0 && (
                      <div class="flex flex-wrap gap-1">
                        {related.tags.map((tag) => (
                          <span
                            key={tag}
                            class="text-xs px-2 py-1 rounded-full"
                            style="background-color: #eef5f7; color: #1a5f6e;"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </aside>
          )}

          {/* Back link */}
          <footer class="mt-10 pt-6 border-t border-gray-200">
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
          </footer>
        </article>
      </div>

      {/* Screenshot overlay (for blog images with click-to-zoom) */}
      <div
        id="screenshot-overlay"
        class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 hidden"
      >
        <div class="relative max-w-7xl max-h-full overflow-auto">
          <button
            id="screenshot-close"
            class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75 transition-all z-10"
            aria-label="Close image overlay"
          >
            ✕
          </button>
          <img
            id="screenshot-image"
            class="max-w-full max-h-full object-contain rounded-lg"
            alt=""
          />
          <p
            id="screenshot-caption"
            class="text-white text-center mt-4 px-4 hidden"
          />
        </div>
      </div>

      <script>
        {`
          globalThis.openScreenshotOverlay = function(id, src, alt, caption) {
            const overlay = document.getElementById('screenshot-overlay');
            const image = document.getElementById('screenshot-image');
            const captionEl = document.getElementById('screenshot-caption');
            image.src = src;
            image.alt = alt;
            if (caption) {
              captionEl.textContent = caption;
              captionEl.classList.remove('hidden');
            } else {
              captionEl.classList.add('hidden');
            }
            overlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
          };
          globalThis.closeScreenshotOverlay = function() {
            document.getElementById('screenshot-overlay').classList.add('hidden');
            document.body.style.overflow = 'auto';
          };
          document.getElementById('screenshot-overlay').addEventListener('click', function(e) {
            if (e.target === this) closeScreenshotOverlay();
          });
          document.getElementById('screenshot-close').addEventListener('click', closeScreenshotOverlay);
          document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeScreenshotOverlay();
          });
        `}
      </script>
    </>
  );
});
