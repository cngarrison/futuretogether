import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";

export default define.page(function GroupCodeOfConduct() {
  return (
    <>
      <Head>
        <title>Code of Conduct — Future Together Groups</title>
        <meta
          name="description"
          content="The principles and commitments that guide how Future Together groups run and how we treat one another."
        />
      </Head>

      {/* Hero */}
      <section class="bg-primary text-white">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h1 class="text-3xl sm:text-4xl font-bold mb-4">Code of Conduct</h1>
          <p class="text-lg" style="color: rgba(255,255,255,0.8);">
            For Future Together group founders and members.
          </p>
        </div>
      </section>

      {/* Placeholder body */}
      <section class="py-16 sm:py-20 bg-warm-white">
        <div class="max-w-3xl mx-auto px-4 sm:px-6">
          <div class="prose prose-teal max-w-none">
            <p
              class="text-base italic"
              style="color: rgba(28,26,24,0.5);"
            >
              The full code of conduct is being finalised and will be published
              here shortly.
            </p>
            <p class="text-base" style="color: rgba(28,26,24,0.7);">
              In the meantime, please review our{" "}
              <a
                f-client-nav={false}
                href="/terms#community-standards"
                class="text-primary underline"
              >
                community standards in our Terms of Service
              </a>
              , which outline the principles that apply to all Future Together
              groups and members.
            </p>
          </div>
        </div>
      </section>
    </>
  );
});
