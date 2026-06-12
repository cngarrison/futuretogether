import { define } from "@/utils.ts";
import { createAdminClient } from "@/utils/supabase.ts";
import { buildEmailHtml, SITE_URL } from "@/utils/email.ts";

// ---------------------------------------------------------------------------
// HMAC helper (same pattern as groups.ts generateGroupActionToken)
// ---------------------------------------------------------------------------

async function computeHmacBase64Url(
  secret: string,
  message: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// ---------------------------------------------------------------------------
// Token format: {profileId}.{groupId}.{expiresAt}.{sig}
// ---------------------------------------------------------------------------

interface TokenVerifyResult {
  valid: boolean;
  profileId: string;
  groupId: string;
}

async function verifyUnsubToken(token: string): Promise<TokenVerifyResult> {
  const parts = token.split(".");
  // profileId and groupId are UUIDs (contain hyphens, not dots), so we expect exactly 4 parts
  if (parts.length !== 4) return { valid: false, profileId: "", groupId: "" };

  const [profileId, groupId, expiresAtStr, sig] = parts;
  const expiresAt = Number(expiresAtStr);

  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return { valid: false, profileId: "", groupId: "" };
  }

  const secret = Deno.env.get("FT_TOKEN_SECRET") ?? "ft-dev-secret";
  const expected = await computeHmacBase64Url(
    secret,
    `${profileId}.${groupId}.${expiresAtStr}`,
  );

  if (expected !== sig) return { valid: false, profileId: "", groupId: "" };
  return { valid: true, profileId, groupId };
}

// ---------------------------------------------------------------------------
// HTML response helper
// ---------------------------------------------------------------------------

function htmlPage(title: string, content: string, status = 200): Response {
  return new Response(buildEmailHtml(content, title), {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// ---------------------------------------------------------------------------
// Shared opt-out logic (idempotent)
// ---------------------------------------------------------------------------

async function doUnsubscribe(
  profileId: string,
  groupId: string,
): Promise<string | null> {
  // Admin client is REQUIRED here — not merely convenient.
  // This route authenticates via HMAC token embedded in the unsubscribe link
  // in group emails, with no user session. There is no auth.uid() in the request
  // context, so the session client cannot satisfy RLS. Service role is needed for:
  //   - group_memberships: UPDATE email_opt_in = false (RLS: profile_id = auth.uid())
  //   - email_consents: INSERT consent withdrawal record (RLS: same)
  //   - groups: SELECT group name for the confirmation page (public read is fine,
  //     but we reuse the same admin client for consistency in this token-only path)
  const adminClient = createAdminClient();

  // 1. Set email_opt_in = false (idempotent — update always runs)
  const { error: updateError } = await adminClient
    .from("group_memberships")
    .update({ email_opt_in: false })
    .eq("profile_id", profileId)
    .eq("group_id", groupId);

  if (updateError) {
    console.error("Unsubscribe: group_memberships update error", updateError);
  }

  // 2. Record consent withdrawal — email_consents is append-only, insert a new row.
  const { error: consentError } = await adminClient
    .from("email_consents")
    .insert({
      profile_id: profileId,
      group_id: groupId,
      consent_type: "group_email",
      granted: false,
      source: "unsubscribe",
      consented_at: new Date().toISOString(),
    });

  if (consentError) {
    console.error(
      "Unsubscribe: email_consents insert error (non-fatal)",
      consentError,
    );
  }

  // 3. Fetch group name for confirmation message
  const { data: groupRow } = await adminClient
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .maybeSingle();

  return (groupRow as { name: string } | null)?.name ?? null;
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

export const handler = define.handlers({
  /**
   * GET — token-based unsubscribe landing page.
   * Visited by members clicking the unsubscribe link in their email.
   * No auth required — the token is the proof of identity.
   */
  async GET(ctx) {
    const token = ctx.url.searchParams.get("token") ?? "";
    const { valid, profileId, groupId } = await verifyUnsubToken(token);

    if (!valid) {
      const errorContent = `
        <h2 style="margin:0 0 16px;font-size:22px;color:#1c1a18;">Invalid or expired link</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#4b5563;">
          This unsubscribe link is invalid or has expired.
          Please visit your account to manage your email preferences.
        </p>
        <p style="text-align:center;margin:0 0 24px;">
          <a href="${SITE_URL}/account/" class="btn btn-teal">Manage preferences &rarr;</a>
        </p>
      `;
      return htmlPage("Invalid unsubscribe link", errorContent, 400);
    }

    const groupName = await doUnsubscribe(profileId, groupId);
    const groupDisplay = groupName
      ? `<strong>${groupName}</strong>`
      : "this group";

    const successContent = `
      <h2 style="margin:0 0 16px;font-size:22px;color:#1c1a18;">You've been unsubscribed</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#4b5563;">
        You've been unsubscribed from ${groupDisplay} emails.
        You can update your preferences in your account at any time.
      </p>
      <p style="text-align:center;margin:0 0 24px;">
        <a href="${SITE_URL}/account/" class="btn btn-teal">Update preferences &rarr;</a>
      </p>
    `;
    return htmlPage("Unsubscribed", successContent);
  },

  /**
   * POST — RFC 8058 one-click unsubscribe.
   * Called by email clients that support List-Unsubscribe-Post.
   * Returns JSON (no HTML needed).
   */
  async POST(ctx) {
    const token = ctx.url.searchParams.get("token") ?? "";
    const { valid, profileId, groupId } = await verifyUnsubToken(token);

    if (!valid) {
      return Response.json(
        { error: "Invalid or expired token" },
        { status: 400 },
      );
    }

    await doUnsubscribe(profileId, groupId);
    return Response.json({ ok: true }, { status: 200 });
  },
});
