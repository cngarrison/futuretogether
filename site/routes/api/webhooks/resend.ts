// ⚠️  SETUP REQUIRED: Register this webhook URL in the Resend dashboard:
// https://resend.com/webhooks → Add endpoint: https://futuretogether.community/api/webhooks/resend
// Events to subscribe: email.bounced, email.complained
// Set FT_RESEND_WEBHOOK_SECRET env var to the signing secret from Resend.

import { define } from "@/utils.ts";
import { createAdminClient } from "@/utils/supabase.ts";

function jsonOk(): Response {
  return Response.json({ ok: true }, { status: 200 });
}

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

interface ResendEventData {
  email_id?: string;
  to?: string | string[];
  url?: string;
  [key: string]: unknown;
}

interface ResendEvent {
  type: string;
  data?: ResendEventData;
}

export const handler = define.handlers({
  async POST(ctx) {
    try {
      // 1. Read raw body text (required for signature verification before parsing)
      const rawBody = await ctx.req.text();

      // 2. Extract Svix headers
      const svixId = ctx.req.headers.get("svix-id");
      const svixTimestamp = ctx.req.headers.get("svix-timestamp");
      const svixSignature = ctx.req.headers.get("svix-signature");

      if (!svixId || !svixTimestamp || !svixSignature) {
        return new Response(
          JSON.stringify({ error: "Missing svix headers" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // 3. Check timestamp is within 5 minutes
      if (Math.abs(Date.now() / 1000 - Number(svixTimestamp)) > 300) {
        return new Response(
          JSON.stringify({ error: "Request too old" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // 4. Verify HMAC-SHA256 signature
      const webhookSecret = Deno.env.get("FT_RESEND_WEBHOOK_SECRET") ?? "";
      const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
      const expectedSig = await computeHmacBase64Url(
        webhookSecret,
        signedContent,
      );

      // svix-signature format: "v1,{sig1} v1,{sig2} ..."
      const sigs = svixSignature
        .split(" ")
        .map((s) => s.split(",")[1])
        .filter(Boolean);
      if (!sigs.some((sig) => sig === expectedSig)) {
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      // 5. Parse body as JSON only after verification
      let event: ResendEvent;
      try {
        event = JSON.parse(rawBody) as ResendEvent;
      } catch {
        console.error("Webhook: failed to parse body as JSON");
        return jsonOk();
      }

      // 6. Route by event type
      switch (event.type) {
        case "email.bounced": {
          console.log(
            "Resend webhook: bounce",
            event.data?.email_id,
            event.data?.to,
          );
          // No DB action for now — bounce handling is Phase C
          break;
        }

        case "email.complained": {
          // Get recipient email — may be string or array
          const toField = event.data?.to;
          const recipientEmail = Array.isArray(toField)
            ? toField[0]
            : (toField ?? "");

          if (!recipientEmail) {
            console.log(
              "Webhook: email.complained — no recipient email in event data",
            );
            break;
          }

          const adminClient = createAdminClient();
          try {
            // Look up profile by email
            const { data: profileRow, error: profileError } = await adminClient
              .from("profiles")
              .select("id")
              .eq("email", recipientEmail)
              .maybeSingle();

            if (profileError) {
              console.error("Webhook: profile lookup error", profileError);
            }

            if (!profileRow) {
              console.log(
                "Webhook: email.complained — no profile found for",
                recipientEmail,
              );
              break;
            }

            const profileId = (profileRow as { id: string }).id;

            // Opt-out all active memberships where email_opt_in = true (idempotent)
            const { error: updateError } = await adminClient
              .from("group_memberships")
              .update({ email_opt_in: false })
              .eq("profile_id", profileId)
              .eq("status", "active")
              .eq("email_opt_in", true);

            if (updateError) {
              console.error(
                "Webhook: group_memberships update error",
                updateError,
              );
            }

            // Fetch all active group memberships to create consent records
            const { data: memberships, error: fetchError } = await adminClient
              .from("group_memberships")
              .select("group_id")
              .eq("profile_id", profileId)
              .eq("status", "active");

            if (fetchError) {
              console.error("Webhook: membership fetch error", fetchError);
            }

            if (memberships && memberships.length > 0) {
              const now = new Date().toISOString();
              // email_consents is append-only — insert one opt-out row per group.
              // source must be one of the CHECK constraint values; 'unsubscribe' covers complaints.
              const consents = (memberships as Array<{ group_id: string }>).map(
                ({ group_id }) => ({
                  profile_id: profileId,
                  group_id,
                  consent_type: "group_email",
                  granted: false,
                  source: "unsubscribe",
                  consented_at: now,
                }),
              );

              const { error: consentError } = await adminClient
                .from("email_consents")
                .insert(consents);

              if (consentError) {
                // Non-fatal: log and continue
                console.error(
                  "Webhook: email_consents insert error (non-fatal)",
                  consentError,
                );
              }

              console.log(
                "Webhook: email.complained — opted out",
                profileId,
                "from",
                memberships.length,
                "groups",
              );
            }
          } catch (err) {
            console.error("Webhook: email.complained handler error", err);
          }
          break;
        }

        case "email.link_clicked": {
          // One-click unsubscribe clicks via RFC 8058 — the GET /unsubscribe handler does the actual opt-out
          const linkUrl = (event.data?.url as string | undefined) ?? "";
          if (
            linkUrl.includes("/api/groups/") &&
            linkUrl.includes("/unsubscribe")
          ) {
            console.log(
              "Resend webhook: link_clicked unsubscribe",
              event.data?.email_id,
            );
          }
          break;
        }

        default:
          // Unknown events are ignored — return 200 to avoid Resend retries
          break;
      }

      return jsonOk();
    } catch (err) {
      // Never return 5xx to Resend — it will retry. Log and return 200.
      console.error("Webhook: unhandled error", err);
      return jsonOk();
    }
  },
});
