import { define } from "@/utils.ts";
import { getCookies } from "@std/http";
import { logStaffAccess } from "@/utils/staff-log.ts";

/**
 * API staff middleware — Fresh v2
 * Protects all /api/staff/* routes using the same session cookie
 * set by the /staff/login page.
 */
export const handler = define.middleware(async (ctx) => {
  const url = new URL(ctx.req.url);
  const cookies = getCookies(ctx.req.headers);
  const staffSession = cookies.bb_staff_session;
  const expectedHash = Deno.env.get("FT_STAFF_PASSWORD_HASH");

  if (!staffSession || !expectedHash || staffSession !== expectedHash) {
    const ip = ctx.req.headers.get("x-forwarded-for") || "unknown";
    await logStaffAccess(
      `[${new Date().toISOString()}] Unauthorized API attempt: ${url.pathname} from ${ip}`,
    );
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return ctx.next();
});
