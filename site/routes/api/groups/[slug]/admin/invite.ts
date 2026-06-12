import { define } from "@/utils.ts";
import { generateInviteLink, sendInviteEmail } from "@/utils/db/groups.ts";
import {
  logAdminAction,
  resolvePlatformRole,
  type AuditActorRole,
} from "@/utils/db/audit-log.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const group = ctx.state.group!;
    const profile = ctx.state.profile!;
    const body = await ctx.req.json() as { email?: string };
    const recipientEmail = (body.email ?? "").trim() || undefined;

    const { url, error } = await generateInviteLink(
      group.id,
      group.slug,
      profile.id,
      recipientEmail,
      ctx.state,
    );
    if (error || !url) {
      return Response.json({ error: error ?? "Failed to generate invite" }, {
        status: 500,
      });
    }

    // If an email was provided, send the invite email (fire-and-forget)
    if (recipientEmail) {
      const senderName =
        [profile.name_first, profile.name_last].filter(Boolean).join(" ") ||
        "A group admin";
      sendInviteEmail(url, recipientEmail, group.name, senderName);
    }

    const actorRole: AuditActorRole = ctx.state.isSiteAdminBypass
      ? await resolvePlatformRole(ctx.state.user!.id)
      : (ctx.state.membership?.role ?? "group_admin") as AuditActorRole;
    await logAdminAction(ctx.state, {
      actor_id: ctx.state.user!.id,
      actor_role: actorRole,
      action: "member.invited",
      resource_type: "member",
      group_id: group.id,
      resource_slug: group.slug,
      metadata: { recipient_email: recipientEmail },
    });

    return Response.json({ url });
  },
});
