import { define } from "@/utils.ts";
import { isSiteAdmin } from "@/utils/auth.ts";

/**
 * Admin area middleware — Fresh v2
 * Protects all /admin/* routes.
 * Root middleware has already populated ctx.state.user.
 */
export const handler = define.middleware(async (ctx) => {
  if (ctx.state.user && await isSiteAdmin(ctx.state.user.id)) {
    return ctx.next();
  }
  const url = new URL(ctx.req.url);
  const originalUrl = url.pathname + url.search;
  return new Response(null, {
    status: 302,
    headers: { Location: `/login?redirect=${encodeURIComponent(originalUrl)}` },
  });
});
