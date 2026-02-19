import { define } from "@/utils.ts";
import { getCookies } from "@std/http";
import { logStaffAccess } from "@/utils/staff-log.ts";

/**
 * Staff area middleware — Fresh v2
 * Protects all /staff/* routes except /staff/login.
 * Reads a session cookie set by the login page and validates it against
 * the hashed password stored in the BB_STAFF_PASSWORD_HASH env var.
 */
export const handler = define.middleware(async (ctx) => {
  const url = new URL(ctx.req.url);
  const cookies = getCookies(ctx.req.headers);
  const staffSession = cookies.bb_staff_session;
  const expectedHash = Deno.env.get("BB_STAFF_PASSWORD_HASH");

  // Allow unauthenticated access to the login page
  if (url.pathname === "/staff/login") {
    return ctx.next();
  }

  // Reject if session is missing or doesn't match
  if (!staffSession || !expectedHash || staffSession !== expectedHash) {
    const ip = ctx.req.headers.get("x-forwarded-for") || "unknown";
    await logStaffAccess(
      `[${new Date().toISOString()}] Unauthorized access attempt: ${url.pathname} from ${ip}`,
    );
    const originalUrl = url.pathname + url.search;
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/staff/login?redirect=${encodeURIComponent(originalUrl)}`,
      },
    });
  }

  // Log successful access
  const ip = ctx.req.headers.get("x-forwarded-for") || "unknown";
  await logStaffAccess(
    `[${new Date().toISOString()}] Staff access: ${url.pathname} from ${ip}`,
  );

  return ctx.next();
});
