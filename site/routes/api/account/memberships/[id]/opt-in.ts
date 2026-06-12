import { define } from "@/utils.ts";

/**
 * PATCH /api/account/memberships/[id]/opt-in
 *
 * Toggle email_opt_in for a membership the caller owns.
 * Body: { emailOptIn: boolean }
 * Also reflects the change in email_consents (non-fatal).
 */
export const handler = define.handlers({
  async PATCH(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return Response.json({ error: "Unauthorised" }, { status: 401 });
    }

    const membershipId = ctx.params.id;

    let body: { emailOptIn?: unknown };
    try {
      body = await ctx.req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (typeof body.emailOptIn !== "boolean") {
      return Response.json({ error: "emailOptIn must be a boolean" }, {
        status: 400,
      });
    }
    const emailOptIn = body.emailOptIn;

    const db = ctx.state.supabaseClient!;

    // Fetch membership — verify ownership
    const { data: membership, error: fetchError } = await db
      .from("group_memberships")
      .select("id, profile_id, group_id")
      .eq("id", membershipId)
      .maybeSingle();

    if (fetchError) {
      console.error("opt-in: fetch error", fetchError);
      return Response.json({ error: "Server error" }, { status: 500 });
    }
    if (!membership) {
      return Response.json({ error: "Membership not found" }, { status: 404 });
    }

    const row = membership as {
      id: string;
      profile_id: string;
      group_id: string;
    };
    if (row.profile_id !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update email_opt_in
    const { error: updateError } = await db
      .from("group_memberships")
      .update({ email_opt_in: emailOptIn })
      .eq("id", membershipId);

    if (updateError) {
      console.error("opt-in: update error", updateError);
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    // Reflect change in email_consents (non-fatal)
    try {
      // email_consents is append-only — insert a new row for each consent change.
      await db
        .from("email_consents")
        .insert({
          group_id: row.group_id,
          profile_id: user.id,
          consent_type: "group_email",
          granted: emailOptIn,
          source: emailOptIn ? "join-group" : "unsubscribe",
          consented_at: new Date().toISOString(),
        });
    } catch (err) {
      console.error("opt-in: email_consents update (non-fatal)", err);
    }

    return Response.json({ ok: true });
  },
});
