import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import {
  CATEGORIES,
  externalResources,
  internalResources,
} from "@/data/resources.ts";

const ExternalLinkIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export default define.page(function Resources() {
  return (
    <>
      <Head>
        <title>Resources — Future Together</title>
        <meta
          name="description"
          content="Curated reading, watching, and tools for understanding what AI is doing to the world — and how we prepare. Honest perspectives, not hype."
        />
      </Head>

      {/* Hero */}
      <section class="text-white pt-16" style="background-color: #1a5f6e;">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <p
            class="text-sm font-semibold uppercase tracking-widest mb-4"
            style="color: rgba(255,255,255,0.6);"
          >
            Curated reading &amp; watching
          </p>
          <h1 class="text-4xl sm:text-5xl font-bold mb-5">
            Resources
          </h1>
          <p
            class="text-lg leading-relaxed"
            style="color: rgba(255,255,255,0.8);"
          >
            A small, carefully chosen collection of writing, video, and tools
            for people trying to understand what’s actually happening — and what
            it means for how we live and work.
          </p>
        </div>
      </section>

      {/* External resources */}
      <section class="py-20 sm:py-28" style="background-color: #f7f4ef;">
        <div class="max-w-3xl mx-auto px-4 sm:px-6">
          {CATEGORIES.map((category) => {
            const items = externalResources.filter(
              (r) => r.category === category,
            );
            if (items.length === 0) return null;
            return (
              <div key={category} class="mb-16 last:mb-0">
                <h2
                  class="text-xs font-semibold uppercase tracking-widest mb-6"
                  style="color: #c4853a;"
                >
                  {category}
                </h2>
                <div class="flex flex-col gap-5">
                  {items.map((resource) => (
                    <a
                      key={resource.url}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="block bg-white rounded-xl p-6 transition-shadow hover:shadow-md group"
                      style="border: 1px solid #d0e4e7;"
                    >
                      <div class="flex items-start justify-between gap-4">
                        <h3
                          class="font-semibold text-base leading-snug group-hover:underline"
                          style="color: #1a5f6e;"
                        >
                          {resource.title}
                        </h3>
                        <span
                          class="flex-shrink-0 mt-0.5"
                          style="color: rgba(28,26,24,0.35);"
                        >
                          <ExternalLinkIcon />
                        </span>
                      </div>
                      <p
                        class="mt-2 text-sm leading-relaxed"
                        style="color: rgba(28,26,24,0.7);"
                      >
                        {resource.description}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Internal / community resources */}
      <section
        class="py-16 sm:py-20"
        style="background-color: #eef5f7; border-top: 1px solid #d0e4e7;"
      >
        <div class="max-w-3xl mx-auto px-4 sm:px-6">
          <h2
            class="text-xs font-semibold uppercase tracking-widest mb-6"
            style="color: #c4853a;"
          >
            From Future Together
          </h2>
          <div class="flex flex-col gap-5">
            {internalResources.map((resource) => (
              <a
                key={resource.href}
                href={resource.href}
                class="block bg-white rounded-xl p-6 transition-shadow hover:shadow-md group"
                style="border: 1px solid #d0e4e7;"
              >
                <div class="flex items-start justify-between gap-4">
                  <h3
                    class="font-semibold text-base leading-snug group-hover:underline"
                    style="color: #1a5f6e;"
                  >
                    {resource.title}
                  </h3>
                  <span
                    class="flex-shrink-0 mt-0.5"
                    style="color: rgba(28,26,24,0.35);"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </div>
                <p
                  class="mt-2 text-sm leading-relaxed"
                  style="color: rgba(28,26,24,0.7);"
                >
                  {resource.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Suggest a resource */}
      <section
        class="py-12 text-center"
        style="background-color: #f7f4ef; border-top: 1px solid #d0e4e7;"
      >
        <div class="max-w-xl mx-auto px-4 sm:px-6">
          <p class="text-sm" style="color: rgba(28,26,24,0.55);">
            Know something that should be on this list?{" "}
            <a
              href="/resources/suggest"
              class="ml-2 font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
              style="color: #1a5f6e;"
            >
              Suggest a resource &rarr;
            </a>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section
        class="py-20 text-center"
        style="background-color: #1a5f6e; color: white;"
      >
        <div class="max-w-xl mx-auto px-4 sm:px-6">
          <h2 class="text-3xl font-bold mb-4">Come to a meetup</h2>
          <p class="mb-8 text-lg" style="color: rgba(255,255,255,0.8);">
            Resources are a starting point. The real work happens in
            conversation — with other people who are paying attention.
          </p>
          <a
            href="/events/discuss-our-future"
            class="inline-block px-8 py-3.5 text-white font-semibold rounded-xl transition-opacity hover:opacity-90"
            style="background-color: #c4853a;"
          >
            Register for the next meetup &rarr;
          </a>
        </div>
      </section>
    </>
  );
});
