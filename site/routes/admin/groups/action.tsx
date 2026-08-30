/**
 * /admin/groups/action
 *
 * Token-validated approve/decline route for email action links.
 * Protected by admin/_middleware.ts (applies to all /admin/ routes).
 *
 * GET  /admin/groups/action?action=approve&id=groupId&expires=timestamp&token=token
 *   — Validates token; shows confirmation page (group name + action).
 *
 * POST /admin/groups/action
 *   — Re-validates token from hidden fields; executes approve or decline.
 *   — Redirects to /admin/groups/[slug] on success.
 */

import { page } from "fresh";
import { define } from "@/utils.ts";
import {
  approveGroupAdmin,
  declineGroupAdmin,
  verifyGroupActionToken,
} from "@/utils/db/groups.ts";
import { logAdminAction, resolvePlatformRole } from "@/utils/db/audit-log.ts";
interface PageData {
  valid: boolean;
  expired: boolean;
  action: string;
  groupId: string;
  groupName: string;
  slug: string;
  expiresAt: number;
  token: string;
}

export const handler = define.handlers({
  async GET(ctx) {
    const url = new URL(ctx.req.url);
    const action = url.searchParams.get("action") ?? "";
    const groupId = url.searchParams.get("id") ?? "";
    const expiresAt = parseInt(url.searchParams.get("expires") ?? "0", 10);
    const token = url.searchParams.get("token") ?? "";

    if (!action || !groupId || !expiresAt || !token) {
      return page<PageData>({
        valid: false,
        expired: false,
        action,
        groupId,
        groupName: "",
        slug: "",
        expiresAt,
        token,
      });
    }

    if (Date.now() > expiresAt) {
      return page<PageData>({
        valid: false,
        expired: true,
        action,
        groupId,
        groupName: "",
        slug: "",
        expiresAt,
        token,
      });
    }

    const valid = await verifyGroupActionToken(
      action,
      groupId,
      expiresAt,
      token,
    );
    if (!valid) {
      return page<PageData>({
        valid: false,
        expired: false,
        action,
        groupId,
        groupName: "",
        slug: "",
        expiresAt,
        token,
      });
    }

    let group: { name: string; slug: string } | null = null;
    try {
      const { data, error } = await ctx.state.supabaseClient!
        .from("groups")
        .select("name, slug")
        .eq("id", groupId)
        .maybeSingle();
      if (!error && data) group = data as { name: string; slug: string };
    } catch { /* non-fatal */ }
    return page<PageData>({
      valid: true,
      expired: false,
      action,
      groupId,
      groupName: group?.name ?? groupId,
      slug: group?.slug ?? "",
      expiresAt,
      token,
    });
  },

  async POST(ctx) {
    const form = await ctx.req.formData();
    const action = (form.get("action") as string) ?? "";
    const groupId = (form.get("groupId") as string) ?? "";
    const expiresAt = parseInt((form.get("expiresAt") as string) ?? "0", 10);
    const token = (form.get("token") as string) ?? "";
    const slug = (form.get("slug") as string) ?? "";

    // Re-validate token before executing action
    const valid = await verifyGroupActionToken(
      action,
      groupId,
      expiresAt,
      token,
    );
    if (!valid || Date.now() > expiresAt) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/admin/groups/?error=invalid-token" },
      });
    }

    const approverId = ctx.state.user?.id ?? "";

    if (action === "approve" && approverId) {
      await approveGroupAdmin(groupId, approverId);
      await logAdminAction(ctx.state, {
        actor_id: approverId,
        actor_role: await resolvePlatformRole(approverId),
        action: "group.approved",
        resource_type: "group",
        resource_id: groupId,
        resource_slug: slug || undefined,
      });
    } else if (action === "decline") {
      await declineGroupAdmin(groupId, "declined-via-email");
      if (approverId) {
        await logAdminAction(ctx.state, {
          actor_id: approverId,
          actor_role: await resolvePlatformRole(approverId),
          action: "group.rejected",
          resource_type: "group",
          resource_id: groupId,
          resource_slug: slug || undefined,
        });
      }
    }

    const destination = slug ? `/admin/groups/${slug}` : "/admin/groups/";

    return new Response(null, {
      status: 302,
      headers: { Location: destination },
    });
  },
});

export default define.page<typeof handler>(function GroupActionPage({ data }) {
  const { valid, expired, action, groupName, groupId, expiresAt, token, slug } =
    data as PageData;

  // Error states
  if (expired) {
    return (
      <div class="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div class="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div class="text-4xl mb-4">⏱️</div>
          <h1 class="text-xl font-bold text-gray-900 mb-2">Link expired</h1>
          <p class="text-gray-600 mb-6">
            This action link has expired (links are valid for 7 days). Please
            visit the admin panel to take action manually.
          </p>
          <a
            f-client-nav={false}
            href="/admin/groups/"
            class="inline-block px-5 py-2.5 bg-primary rounded-lg text-sm font-semibold text-white"
          >
            Go to groups admin
          </a>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div class="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div class="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div class="text-4xl mb-4">⚠️</div>
          <h1 class="text-xl font-bold text-gray-900 mb-2">Invalid link</h1>
          <p class="text-gray-600 mb-6">
            This action link is invalid or has already been used. Please review
            the group directly in the admin panel.
          </p>
          <a
            f-client-nav={false}
            href="/admin/groups/"
            class="inline-block px-5 py-2.5 bg-primary rounded-lg text-sm font-semibold text-white"
          >
            Go to groups admin
          </a>
        </div>
      </div>
    );
  }

  // Valid token — show confirmation page
  const isApprove = action === "approve";

  return (
    <div class="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div class="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div class="text-center mb-6">
          <div class="text-4xl mb-3">{isApprove ? "✅" : "❌"}</div>
          <h1 class="text-xl font-bold text-gray-900 mb-2">
            {isApprove ? "Approve group" : "Decline group"}
          </h1>
          <p class="text-gray-600 text-sm mb-2">
            You're about to <strong>{isApprove ? "approve" : "decline"}</strong>
            {" "}
            the application for:
          </p>
          <p class="text-lg text-primary font-bold mb-4">
            {groupName}
          </p>
          <p class="text-sm text-gray-500">
            {isApprove
              ? "The group will be made active and the applicant will receive a welcome email with their admin dashboard link."
              : "The application will be archived and the applicant will be notified by email."}
          </p>
        </div>

        <form method="POST" class="space-y-3">
          <input type="hidden" name="action" value={action} />
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="expiresAt" value={String(expiresAt)} />
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="slug" value={slug} />
          <button
            type="submit"
            class="w-full px-5 py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={isApprove ? "background:#155724;" : "background:#721c24;"}
          >
            Confirm {isApprove ? "approval" : "decline"}
          </button>
        </form>

        <div class="mt-4 text-center">
          <a
            f-client-nav={false}
            href={slug ? `/admin/groups/${slug}` : "/admin/groups/"}
            class="text-sm text-gray-500 hover:underline"
          >
            Cancel — back to group
          </a>
        </div>
      </div>
    </div>
  );
});
