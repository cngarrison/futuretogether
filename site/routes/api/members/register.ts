/**
 * POST /api/members/register
 *
 * Handles membership signup from the /join page.
 * Uses Supabase signInWithOtp — creates a new user (if they don't exist) and sends
 * a magic-link confirmation email. Existing users receive a sign-in link instead.
 * Both cases look identical to the caller (privacy by design).
 *
 * Extra profile fields (location, interests, etc.) are stored in user_metadata
 * on account creation. Global group membership is created in /auth/callback on
 * first confirmation (requires ft-o1k.8 seed data to be in place).
 */

import { define } from "@/utils.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";
import { verifyTurnstileToken } from "@/utils/turnstile.ts";
import { verifyFormToken } from "@/utils/form-token.ts";
import { checkRateLimit, getClientIp } from "@/utils/rate-limit.ts";

export const handler = define.handlers({
  async POST(ctx) {
    try {
      const body = await ctx.req.json();

      const {
        firstName,
        lastName,
        email,
        location,
        heardFrom,
        interests,
        wantsToOrganise,
        ageConfirmed,
        hp_website,
        form_token,
        turnstile_token,
        group_id,
        next: nextUrl,
      } = body;

      // Honeypot check — real users never fill this field; bots usually do.
      // Return a fake success so bots don’t know they’ve been caught.
      if (hp_website) {
        console.warn("Honeypot triggered — discarding signup from bot");
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      // IP rate limit — max 3 signup attempts per hour per IP
      const clientIp = getClientIp(ctx.req);
      const allowed = await checkRateLimit(clientIp);
      if (!allowed) {
        return new Response(
          JSON.stringify({
            error: "Too many signup attempts. Please try again later.",
          }),
          { status: 429, headers: { "Content-Type": "application/json" } },
        );
      }

      // Timing token — verifies the form was rendered normally and not submitted
      // by automation that skips the page load entirely
      const tokenValid = await verifyFormToken(form_token);
      if (!tokenValid) {
        return new Response(
          JSON.stringify({
            error: "Form verification failed. Please refresh the page and try again.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Turnstile verification (no-op if FT_TURNSTILE_SECRET_KEY is not set)
      const turnstileValid = await verifyTurnstileToken(turnstile_token ?? "");
      if (!turnstileValid) {
        return new Response(
          JSON.stringify({
            error: "Captcha verification failed. Please try again.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Validate required fields
      if (!firstName?.trim()) {
        return new Response(
          JSON.stringify({ error: "First name is required." }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      if (!lastName?.trim()) {
        return new Response(
          JSON.stringify({ error: "Last name is required." }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      if (!email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return new Response(
          JSON.stringify({ error: "A valid email address is required." }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      if (!ageConfirmed) {
        return new Response(
          JSON.stringify({
            error: "You must confirm that you are 16 years of age or older.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Thread ?next= through emailRedirectTo so the magic link lands the
      // user back on the page they came from (e.g. /groups/tumbarumba/).
      const callbackUrl = new URL("/auth/callback", ctx.req.url);
      if (nextUrl && typeof nextUrl === "string" && nextUrl.startsWith("/")) {
        callbackUrl.searchParams.set("next", nextUrl);
      }
      const emailRedirectTo = callbackUrl.href;

      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo,
          shouldCreateUser: true,
          data: {
            name_first: firstName.trim(),
            name_last: lastName.trim(),
            age_confirmed: true,
            location: location?.trim() || null,
            heard_from: heardFrom || null,
            interests: Array.isArray(interests) ? interests : [],
            wants_to_organise: !!wantsToOrganise,
            source_form: "join-form",
            // group_id is read by handle_new_auth_user() to auto-join the user
            // to a secondary group on account creation. Omit if not provided.
            ...(group_id && typeof group_id === "string" ? { group_id } : {}),
          },
        },
      });

      if (error) {
        console.error("Supabase signInWithOtp error:", error.message);
        return new Response(
          JSON.stringify({ error: "Something went wrong. Please try again." }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      // Admin notification for organiser requests (fire-and-forget)
      if (wantsToOrganise) {
        const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
        notifyOrganiserRequest({ displayName, email: email.trim() }).catch((
          err,
        ) => console.error("Organiser notification error:", err));
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      console.error("Member registration error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
});

async function notifyOrganiserRequest(
  { displayName, email }: { displayName: string; email: string },
): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Future Together <notifications@futuretogether.community>",
      to: Deno.env.get("FT_SITE_OWNER_EMAIL") ??
        "charlie@futuretogether.community",
      subject: `[FT] New organiser request: ${displayName}`,
      text:
        `${displayName} (${email}) has signed up and wants to run a local group.\n\nReview their account in the admin dashboard once they confirm their email.`,
    }),
  });
}
