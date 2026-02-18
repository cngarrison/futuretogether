import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getPostBySlug, getRelatedPosts } from "@/utils/blog.ts";

export default define.page(async function BlogPost(ctx) {
  const post = await getPostBySlug(ctx.params.slug);

  if (!post) {
    return (
      <div class="max-w-4xl mx-auto px-4 py-8">
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
        <title>{post.title} - Future Together</title>
        <meta
          name="description"
          content={post.excerpt || `Read ${post.title} on Future Together's blog`}
        />
      </Head>
      <div id="title"></div>
      <article class="max-w-3xl mx-auto px-4 py-12">
        <header class="mb-8">
          <div class="-mt-3 mb-4 flex flex-wrap gap-3 items-center text-sm">
            <div class="mb-2 inline-flex rounded-full overflow-hidden">
              {post.author && (
                <span class="px-3 py-1.5 bg-primary text-white font-medium">
                  {post.author}
                </span>
              )}
              <time dateTime={post.date} class="px-3 py-1.5 bg-gray-100 text-gray-600">
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div class="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  class="text-sm px-3 py-1.5 rounded-full"
                  style="background-color: #eef5f7; color: #1a5f6e; border: 1px solid #d0e4e7;"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Divider */}
        <hr class="border-gray-200 mb-10" />

        {/* Lead paragraph */}
        {post.firstParagraphHtml && (
          <div
            class="prose prose-lg max-w-none text-lg mb-10 leading-relaxed"
            style="color: rgba(28,26,24,0.75);"
            dangerouslySetInnerHTML={{ __html: post.firstParagraphHtml }}
          />
        )}

        {/* Main content */}
        {post.remainingHtml && (
          <div
            class="prose prose-lg max-w-none prose-headings:font-bold prose-li:my-1.5 prose-img:rounded-lg prose-img:shadow-md"
            style="color: rgba(28,26,24,0.82);"
            dangerouslySetInnerHTML={{ __html: post.remainingHtml }}
          />
        )}

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <aside class="mt-16 pt-10 border-t border-gray-200" style={{ clear: 'both' }}>
            <h2 class="text-2xl font-bold text-gray-900 mb-6">
              Related Posts
            </h2>
            <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((related) => (
                <div
                  key={related.id}
                  class="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                >
                  <h3 class="font-semibold mb-2 text-gray-900">
                    <a
                      href={`/blog/${related.slug}`}
                      class="transition-opacity hover:opacity-70"
                    style="color: #1c1a18;"
                    >
                      {related.title}
                    </a>
                  </h3>
                  <p class="text-sm text-gray-500 mb-2">
                    {new Date(related.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  {related.tags && related.tags.length > 0 && (
                    <div class="flex flex-wrap gap-1">
                      {related.tags.map((tag) => (
                        <span
                          key={tag}
                          class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700"
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

        <footer class="mt-10 pt-6 border-t border-gray-200">
          <a
            href="/blog"
            class="font-semibold inline-flex items-center transition-opacity hover:opacity-70"
            style="color: #1a5f6e;"
          >
            <svg
              class="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
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

        {/* Screenshot overlay */}
        <div id="screenshot-overlay" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 hidden">
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
            <p id="screenshot-caption" class="text-white text-center mt-4 px-4 hidden"></p>
          </div>
        </div>

        <script>
          {`
            globalThis.openScreenshotOverlay = function(screenshotId, src, alt, caption) {
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
              const overlay = document.getElementById('screenshot-overlay');
              overlay.classList.add('hidden');
              document.body.style.overflow = 'auto';
            };

            document.getElementById('screenshot-overlay').addEventListener('click', function(e) {
              if (e.target === this) {
                closeScreenshotOverlay();
              }
            });

            document.getElementById('screenshot-close').addEventListener('click', closeScreenshotOverlay);

            document.addEventListener('keydown', function(e) {
              if (e.key === 'Escape') {
                closeScreenshotOverlay();
              }
            });
          `}
        </script>
      </article>
      </>
  );
});
