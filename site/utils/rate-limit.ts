import { getKv } from "@/utils/kv.ts";

/** Maximum signups allowed from a single IP within the time window */
const MAX_ATTEMPTS = 3;
/** Rolling window duration */
const WINDOW_MS = 60 * 60_000; // 1 hour

/**
 * Extract the real client IP from request headers.
 * Checks CF-Connecting-IP (set by Cloudflare), then X-Forwarded-For,
 * then falls back to "unknown".
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      "unknown"
  );
}

/**
 * Check and record a rate-limited action for the given IP.
 *
 * Uses a rolling window stored in Deno KV: all timestamps within the last
 * WINDOW_MS are retained; if the count reaches MAX_ATTEMPTS the request
 * is blocked. The new timestamp is appended atomically only when allowed.
 *
 * Returns true if the request is allowed, false if rate limited.
 * Fails open (returns true) if KV is unavailable, to avoid blocking
 * legitimate users during infrastructure issues.
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
  if (ip === "unknown") return true; // can’t meaningfully rate-limit unknown IPs

  try {
    const kv = await getKv();
    const key = ["rate_limit", "register", ip];
    const entry = await kv.get<number[]>(key);
    const now = Date.now();
    const recent = (entry.value ?? []).filter((t) => now - t < WINDOW_MS);

    if (recent.length >= MAX_ATTEMPTS) {
      console.warn(
        `Rate limit exceeded for IP ${ip} (${recent.length} attempts in window)`,
      );
      return false;
    }

    await kv.set(key, [...recent, now], { expireIn: WINDOW_MS });
    return true;
  } catch (err) {
    console.error("Rate limit KV error:", err);
    return true; // fail open — don’t block legitimate users if KV is unavailable
  }
}
