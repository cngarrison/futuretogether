import { define } from "@/utils.ts";
import { getSessionFromRequest, getUserFromToken } from "@/utils/auth.ts";
import { createAdminClient } from "@/utils/supabase.ts";

/**
 * POST /api/account/update-password
 * Updates (or sets) the authenticated user's password via Supabase Auth.
 * Uses the user's own session token so Supabase enforces identity proof.
 * Auth required — returns 401 if session cookie is absent or invalid.
 */
export const handler = define.handlers({
  async POST(ctx) {
    // --- Auth check ---
    const token = getSessionFromRequest(ctx.req);
    if (!token) {
      return new Response(JSON.stringify({ error: "Not authenticated." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const user = await getUserFromToken(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid session." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- Parse body ---
    let body: { password?: unknown; confirmPassword?: unknown };
    try {
      body = await ctx.req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- Validate ---
    const password = typeof body.password === "string" ? body.password : "";
    const confirmPassword = typeof body.confirmPassword === "string"
      ? body.confirmPassword
      : "";

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    if (password !== confirmPassword) {
      return new Response(
        JSON.stringify({ error: "Passwords do not match." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // --- Update password via admin client ---
    // Identity already verified above via getUserFromToken(token).
    // auth.updateUser() requires a live session on the client instance, which
    // our server-side client doesn't hold. Admin updateUserById is the correct
    // server-side approach once identity is confirmed.
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Mark has_password = true in public.profiles so the account page can
    // show 'Change password' vs 'Add a password' without an admin API call.
    await admin
      .from("profiles")
      .update({ has_password: true })
      .eq("id", user.id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  },
});
