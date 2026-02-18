import { FreshContext } from "$fresh/server.ts";
import { getCookies } from "@std/http";
import { logStaffAccess } from "@/utils/staff-log.ts";

export async function handler(
  ctx: FreshContext,
) {
  const url = new URL(ctx.req.url);
  const cookies = getCookies(ctx.req.headers);
  const staffSession = cookies.bb_staff_session;
  const expectedHash = Deno.env.get("FT_STAFF_PASSWORD_HASH");

  // Verify staff session
  if (!staffSession || !expectedHash || staffSession !== expectedHash) {
    const ip = ctx.req.headers.get("x-forwarded-for") || "unknown";
    await logStaffAccess(
      `[${
        new Date().toISOString()
      }] Unauthorized API access attempt: ${url.pathname} from ${ip}`,
    );

    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Log successful access
  const ip = ctx.req.headers.get("x-forwarded-for") || "unknown";
  await logStaffAccess(
    `[${
      new Date().toISOString()
    }] Staff API access: ${url.pathname} from ${ip}`,
  );

  return await ctx.next();
}
