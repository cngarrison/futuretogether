import { define } from "@/utils.ts";
import { page } from "fresh";
import { getCookies, setCookie } from "@std/http";
import { logStaffAccess } from "@/utils/staff-log.ts";

/**
 * Staff login page — Fresh v2
 * POST handler validates a password against BB_STAFF_PASSWORD_HASH (SHA-256 hex).
 * On success, sets an httpOnly session cookie and redirects to the dashboard.
 */

interface LoginData {
  error?: string;
}

// In-memory rate limiting
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 1000 * 60 * 15; // 15 minutes
const attempts = new Map<string, { count: number; lastAttempt: number }>();

async function sha256(input: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempt = attempts.get(ip);
  if (attempt && now - attempt.lastAttempt > BLOCK_DURATION) {
    attempts.delete(ip);
    return false;
  }
  return attempt ? attempt.count >= MAX_ATTEMPTS : false;
}

export const handler = define.handlers<LoginData>({
  GET(ctx) {
    const ip = ctx.req.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(ip)) {
      return page({ error: "Too many attempts. Please try again later." });
    }
    return page({});
  },

  async POST(ctx) {
    const ip = ctx.req.headers.get("x-forwarded-for") || "unknown";
    const timestamp = new Date().toISOString();

    if (isRateLimited(ip)) {
      await logStaffAccess(`[${timestamp}] Login blocked (rate limited) from ${ip}`);
      return page({ error: "Too many attempts. Please try again later." });
    }

    const form = await ctx.req.formData();
    const password = form.get("password")?.toString();

    if (!password) {
      return page({ error: "Password is required." });
    }

    const hashedPassword = await sha256(password);
    const expectedHash = Deno.env.get("BB_STAFF_PASSWORD_HASH");

    if (!expectedHash || hashedPassword !== expectedHash) {
      const attempt = attempts.get(ip) || { count: 0, lastAttempt: 0 };
      attempt.count++;
      attempt.lastAttempt = Date.now();
      attempts.set(ip, attempt);
      await logStaffAccess(`[${timestamp}] Login FAILURE from ${ip}`);
      return page({ error: "Invalid password." });
    }

    // Success
    await logStaffAccess(`[${timestamp}] Login SUCCESS from ${ip}`);
    attempts.delete(ip);

    const headers = new Headers();
    const isLocalDev = new URL(ctx.req.url).hostname === "localhost" ||
      new URL(ctx.req.url).hostname === "127.0.0.1";

    setCookie(headers, {
      name: "bb_staff_session",
      value: hashedPassword,
      path: "/",
      secure: !isLocalDev,
      httpOnly: true,
      maxAge: 60 * 60 * 24, // 24 hours
    });

    const redirectTo = new URL(ctx.req.url).searchParams.get("redirect") ||
      "/staff/events";
    headers.set("location", redirectTo);
    return new Response(null, { status: 303, headers });
  },
});

export default define.page<typeof handler>(function LoginPage({ data }) {
  const error = data?.error;

  return (
    <div class="min-h-screen bg-gray-100 flex items-center justify-center">
      <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 class="text-2xl font-bold text-center mb-2 text-gray-900">
          Future Together
        </h1>
        <p class="text-center text-sm text-gray-500 mb-8">Staff Portal</p>

        {error && (
          <div class="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form method="POST" class="space-y-6">
          <div>
            <label
              class="block text-sm font-medium text-gray-700 mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style="focus-ring-color: #1a5f6e;"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            class="w-full text-white font-bold py-2 px-4 rounded-lg transition-opacity hover:opacity-90"
            style="background-color: #1a5f6e;"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
});
