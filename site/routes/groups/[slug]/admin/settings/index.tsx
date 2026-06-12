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
 * /groups/[slug]/admin/settings/ — stub (ft-07i task: group settings)
 * Full implementation: edit name, description, cover image, visibility, tags.
 */
export default define.page<typeof handler>(function SettingsPage({ data }) {
  const { groupName } = data as PageData;
  return (
    <>
      <Head>
        <title>{groupName} — Settings — Future Together</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h1 class="text-2xl sm:text-3xl font-bold text-near-black mb-3">
          Settings
        </h1>
        <p style="color: rgba(28,26,24,0.55);" class="text-sm">
          Group settings are coming soon. You’ll be able to update your group’s
          name, description, cover image, visibility and tags here.
        </p>
      </div>
    </>
  );
});
