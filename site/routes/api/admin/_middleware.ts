import { define } from "@/utils.ts";
import { isSiteAdmin } from "@/utils/auth.ts";

/**
 * Admin API middleware — Fresh v2
 * Protects all /api/admin/* routes.
 * Returns 401 JSON for unauthenticated or unauthorised requests.
 */
export const handler = define.middleware(async (ctx) => {
  if (ctx.state.user && await isSiteAdmin(ctx.state.user.id)) {
    return ctx.next();
  }
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
});
