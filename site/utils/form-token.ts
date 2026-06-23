import { decodeBase64Url, encodeBase64Url } from "@std/encoding/base64url";

/** Minimum age: form must have been open at least this long before submitting */
const MIN_AGE_MS = 4_000; // 4 seconds
/** Maximum age: token expires after 1 hour */
const MAX_AGE_MS = 60 * 60_000;

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/**
 * Generate a signed timing token. Returns null if FT_FORM_SECRET is not set.
 * Token format: `{timestamp_ms}.{base64url_hmac}`
 *
 * Embed this in the page at render time and send it back with form submissions.
 * The server validates the signature and the age of the token to detect
 * automated submissions (bots submit too fast) and replay attacks (expired tokens).
 */
export async function generateFormToken(): Promise<string | null> {
  const secret = Deno.env.get("FT_FORM_SECRET");
  if (!secret) return null;

  const timestamp = Date.now().toString();
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(timestamp),
  );
  return `${timestamp}.${encodeBase64Url(new Uint8Array(sig))}`;
}

/**
 * Verify a timing token.
 *
 * Checks:
 * - HMAC signature is valid (prevents token forgery)
 * - Token is at least MIN_AGE_MS old (catches automated fast-submit)
 * - Token is not older than MAX_AGE_MS (prevents replay of old tokens)
 *
 * Returns true if valid, false otherwise.
 * In local dev (no FT_FORM_SECRET set), always returns true.
 * In a deployed environment without the secret, always returns false.
 */
export async function verifyFormToken(
  token: string | undefined,
): Promise<boolean> {
  const secret = Deno.env.get("FT_FORM_SECRET");
  if (!secret) {
    const isDeployed = !!Deno.env.get("DENO_DEPLOYMENT_ID");
    if (!isDeployed) return true; // skip in local dev
    console.error(
      "Form token: FT_FORM_SECRET not set in deployed environment — rejecting",
    );
    return false;
  }

  if (!token || !token.includes(".")) {
    console.warn("Form token: missing or malformed");
    return false;
  }

  const dotIdx = token.indexOf(".");
  const tsStr = token.slice(0, dotIdx);
  const sigStr = token.slice(dotIdx + 1);

  const ts = parseInt(tsStr, 10);
  if (isNaN(ts)) return false;

  const age = Date.now() - ts;
  if (age < MIN_AGE_MS) {
    console.warn(`Form token: submitted too fast (${age}ms < ${MIN_AGE_MS}ms)`);
    return false;
  }
  if (age > MAX_AGE_MS) {
    console.warn("Form token: expired");
    return false;
  }

  try {
    const key = await getKey(secret);
    const sigBytes = decodeBase64Url(sigStr);
    return await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(tsStr),
    );
  } catch {
    return false;
  }
}
