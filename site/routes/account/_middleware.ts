import { define } from "@/utils.ts";

/**
 * Account area middleware — Fresh v2
 * Protects all /account/* routes.
 * Root middleware has already populated ctx.state.user — just check it.
 */
export const handler = define.middleware((ctx) => {
  if (ctx.state.user) return ctx.next();
  const url = new URL(ctx.req.url);
  const originalUrl = url.pathname + url.search;
  return new Response(null, {
    status: 302,
    headers: { Location: `/login?redirect=${encodeURIComponent(originalUrl)}` },
  });
});
