import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";

interface PageData {
  groupName: string;
}

export const handler = define.handlers<PageData>({
  GET(ctx) {
    return page({ groupName: ctx.state.group?.name ?? "Group" });
  },
});

/**
 * /groups/[slug]/admin/support/ — stub (ft-07i.8: admin support materials)
 *
 * Full implementation (ft-07i.8):
 * - Lists support PDFs from admin/templates/support/ (Supabase Storage)
 * - Sections: Getting Started, Running Events, Communication, Promoting FT
 * - Download buttons with signed Storage URLs
 * - On group approval: automated welcome email links here
 */
export default define.page<typeof handler>(function SupportPage({ data }) {
  const { groupName } = data as PageData;
  return (
    <>
      <Head>
        <title>{groupName} — Support — Future Together</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h1 class="text-2xl sm:text-3xl font-bold text-near-black mb-3">
          Support &amp; resources
        </h1>
        <p style="color: rgba(28,26,24,0.55);" class="text-sm">
          Support materials are coming soon. You’ll find guides on running your
          group, facilitating discussions, using the slideshow system, and
          promoting Future Together in your community.
        </p>
      </div>
    </>
  );
});
