import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { redeemInviteToken } from "@/utils/db/groups.ts";
import { joinGroup } from "@/utils/db/group-members.ts";

interface PageData {
  error: string;
  groupSlug: string;
}

export const handler = define.handlers<PageData>({
  async GET(ctx) {
    const { slug } = ctx.params;
    const token = ctx.url.searchParams.get("token") ?? "";
    const user = ctx.state.user;

    if (!token) {
      return page({ error: "Invalid invite link.", groupSlug: slug });
    }

    // If not authenticated, redirect to /join with next param
    if (!user) {
      const next = encodeURIComponent(`/groups/${slug}/join?token=${token}`);
      return new Response(null, {
        status: 302,
        headers: { Location: `/join?next=${next}` },
      });
    }

    // Redeem the token
    const { groupId, error: tokenError } = await redeemInviteToken(
      token,
      user.id,
      ctx.state,
    );
    if (tokenError || !groupId) {
      return page({
        error: tokenError ?? "Invalid invite link.",
        groupSlug: slug,
      });
    }

    // Join the group
    const { error: joinError } = await joinGroup(
      groupId,
      user.id,
      "invited",
      ctx.state,
    );
    if (joinError) {
      return page({ error: joinError, groupSlug: slug });
    }

    // Success: redirect to group page
    return new Response(null, {
      status: 302,
      headers: { Location: `/groups/${slug}/` },
    });
  },
});

export default define.page<typeof handler>(function JoinInvitePage({ data }) {
  const { error, groupSlug } = data as PageData;
  return (
    <>
      <Head>
        <title>Invite link — Future Together</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div class="max-w-md mx-auto px-4 py-16 text-center">
        <p class="text-lg font-semibold text-near-black mb-4">{error}</p>
        <a
          f-client-nav={false}
          href={`/groups/${groupSlug}/`}
          class="text-sm text-primary"
        >
          ← Back to group
        </a>
      </div>
    </>
  );
});
