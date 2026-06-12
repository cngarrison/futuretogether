import { define } from "@/utils.ts";

/**
 * POST /api/account/update-profile
 * Updates the authenticated user's name_first and name_last in public.profiles.
 * Auth required — returns 401 if session cookie is absent or invalid.
 */
export const handler = define.handlers({
  async POST(ctx) {
    // --- Auth check ---
    const user = ctx.state.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- Parse body ---
    let body: { nameFirst?: unknown; nameLast?: unknown };
    try {
      body = await ctx.req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- Validate ---
    const nameFirst = typeof body.nameFirst === "string"
      ? body.nameFirst.trim()
      : "";
    const nameLast = typeof body.nameLast === "string"
      ? body.nameLast.trim()
      : "";

    if (!nameFirst) {
      return new Response(
        JSON.stringify({ error: "First name is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    if (nameFirst.length > 100) {
      return new Response(
        JSON.stringify({
          error: "First name must be 100 characters or fewer.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    if (nameLast.length > 100) {
      return new Response(
        JSON.stringify({
          error: "Last name must be 100 characters or fewer.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // --- Persist ---
    const { error } = await ctx.state.supabaseClient!
      .from("profiles")
      .update({
        name_first: nameFirst,
        name_last: nameLast || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  },
});
