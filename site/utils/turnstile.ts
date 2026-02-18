/**
 * Cloudflare Turnstile verification utility
 *
 * This module provides server-side verification of Turnstile tokens.
 * It's designed to be optional - if no secret key is configured, verification is skipped.
 */

/**
 * Verify a Cloudflare Turnstile token
 *
 * @param token - The Turnstile token to verify
 * @returns Promise<boolean> - True if verification passed or no secret key configured, false otherwise
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = Deno.env.get("FT_TURNSTILE_SECRET_KEY");

  // If no secret key configured, skip verification (optional mode)
  if (!secretKey) {
    console.log("Turnstile: No secret key configured - skipping verification");
    return true;
  }

  // If secret key exists but no token provided, fail
  if (!token) {
    console.warn("Turnstile: Secret key configured but no token provided");
    return false;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
        }),
      },
    );

    if (!response.ok) {
      console.error(
        "Turnstile: Verification API returned error:",
        response.status,
      );
      return false;
    }

    const data = await response.json();

    if (data.success) {
      console.log("Turnstile: Token verification successful");
      return true;
    } else {
      console.warn(
        "Turnstile: Token verification failed:",
        data["error-codes"] || "unknown error",
      );
      return false;
    }
  } catch (error) {
    console.error("Turnstile: Verification error:", error);
    return false;
  }
}

/**
 * Check if Turnstile is configured (has a site key)
 *
 * @returns boolean - True if site key is configured
 */
export function isTurnstileConfigured(): boolean {
  const siteKey = Deno.env.get("FT_TURNSTILE_SITE_KEY");
  return !!siteKey;
}

/**
 * Get the Turnstile site key (public key for client-side)
 *
 * @returns string | undefined - The site key if configured
 */
export function getTurnstileSiteKey(): string | undefined {
  return Deno.env.get("FT_TURNSTILE_SITE_KEY");
}
