import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import ResourceSuggestionForm from "@/islands/ResourceSuggestionForm.tsx";

export default define.page(function SuggestResource() {
  return (
    <>
      <Head>
        <title>Suggest a Resource — Future Together</title>
        <meta
          name="description"
          content="Know something worth reading, watching, or using? Suggest it for the Future Together resources list."
        />
      </Head>

      {/* Hero */}
      <section class="text-white pt-16" style="background-color: #1a5f6e;">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <a
            href="/resources"
            class="inline-flex items-center gap-1.5 text-sm font-semibold mb-6"
            style="color: rgba(255,255,255,0.65);"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Resources
          </a>
          <h1 class="text-4xl sm:text-5xl font-bold mb-5">
            Suggest a resource
          </h1>
          <p
            class="text-lg leading-relaxed max-w-xl"
            style="color: rgba(255,255,255,0.8);"
          >
            Found something that helped you understand what’s happening — or
            think seriously about what to do? We’d love to hear about it.
          </p>
        </div>
      </section>

      {/* Form */}
      <section class="py-20 sm:py-28" style="background-color: #f7f4ef;">
        <div class="max-w-2xl mx-auto px-4 sm:px-6">

          {/* What we're looking for */}
          <div
            class="rounded-xl p-6 mb-10"
            style="background-color: #eef5f7; border: 1px solid #d0e4e7;"
          >
            <h2 class="text-sm font-semibold uppercase tracking-widest mb-3" style="color: #c4853a;">
              What we’re looking for
            </h2>
            <ul class="space-y-2 text-sm" style="color: rgba(28,26,24,0.75);">
              {([
                "Honest perspectives on AI, automation, and societal change — not hype, not panic",
                "Frameworks for thinking about the future (not predictions)",
                "Practical guides to community resilience, local preparedness, or organising",
                "Newsletters or ongoing sources worth following",
                "Videos or talks that explain complex ideas clearly",
              ]).map((item) => (
                <li key={item} class="flex items-start gap-2.5">
                  <span
                    class="mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white"
                    style="background-color: #1a5f6e; font-size: 10px;"
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p class="mt-4 text-xs" style="color: rgba(28,26,24,0.5);">
              We review every suggestion personally. Not everything will make the cut, but everything will be read.
            </p>
          </div>

          {/* The form */}
          <div
            class="bg-white rounded-2xl p-8"
            style="border: 1px solid #d0e4e7;"
          >
            <ResourceSuggestionForm />
          </div>
        </div>
      </section>

      {/* Bottom strip */}
      <section
        class="py-16 text-center"
        style="background-color: #eef5f7; border-top: 1px solid #d0e4e7;"
      >
        <div class="max-w-xl mx-auto px-4 sm:px-6">
          <p class="font-semibold mb-2" style="color: #1c1a18;">
            The list is curated, not crowdsourced.
          </p>
          <p class="text-sm leading-relaxed" style="color: rgba(28,26,24,0.65);">
            We keep the resources page short and useful on purpose. Every link
            earns its place. Your suggestion genuinely helps — even if not
            everything makes it onto the page.
          </p>
        </div>
      </section>
    </>
  );
});
