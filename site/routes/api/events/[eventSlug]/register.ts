import { define } from "@/utils.ts";

import { getNextAvailableEvent } from "@/utils/db/group-events.ts";
import { createRegistration } from "@/utils/db/group-registrations.ts";
import { sendConfirmationEmail } from "@/utils/email/eventEmail.ts";
import { generateCancelRegistrationToken } from "@/utils/db/group-registrations.ts";
import { verifyTurnstileToken } from "@/utils/turnstile.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";

export const handler = define.handlers({
  async POST(ctx) {
    try {
      const { eventSlug } = ctx.params;
      const formData = await ctx.req.json();

      const {
        firstName,
        lastName,
        email,
        interests,
        heardFrom,
        joinCommunity,
        turnstile_token,
      } = formData;
      //console.warn("RouteApiEventsRegister: formData", formData);

      // Verify Turnstile token if configured
      const turnstileValid = await verifyTurnstileToken(turnstile_token);
      if (!turnstileValid) {
        console.warn(
          "RouteApiEventsRegister: Turnstile verification failed for event registration",
        );
        return new Response("Captcha verification failed", { status: 400 });
      }

      // Validate required fields
      if (!firstName?.trim()) {
        return new Response("First name is required", { status: 400 });
      }
      if (!lastName?.trim()) {
        return new Response("Last name is required", { status: 400 });
      }
      if (!email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return new Response("Valid email address is required", { status: 400 });
      }

      // Get the next available event for this slug
      const event = await getNextAvailableEvent(eventSlug, ctx.state);
      if (!event) {
        return new Response(
          JSON.stringify({
            error: "No available events found",
            code: "NO_AVAILABLE_EVENT",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      // Community opt-in: create/sign-in the Supabase auth user BEFORE creating the
      // registration so that the profiles trigger has already fired by the time
      // createRegistration does its admin profile lookup — linking profile_id in one pass.
      // Skip if already logged in — no magic-link needed, profile already exists.
      // `!== false` rather than truthy check: treats undefined (field omitted from payload)
      // as opt-in. Opt-out requires an explicit false.
      if (joinCommunity !== false && !ctx.state.user) {
        try {
          const supabase = createSupabaseClient();
          const { error: otpError } = await supabase.auth.signInWithOtp({
            email: email.toLowerCase().trim(),
            options: {
              emailRedirectTo: new URL("/auth/callback", ctx.req.url).href,
              shouldCreateUser: true,
              data: {
                name_first: firstName.trim(),
                name_last: lastName.trim(),
                heard_from: heardFrom?.trim() ?? null,
                age_confirmed: true,
                interests: [],
                wants_to_organise: false,
                location: null,
              },
            },
          });
          if (otpError) {
            console.error(
              "[register] Community signup OTP error:",
              otpError.message,
            );
          }
        } catch (err) {
          console.error("[register] Community signup error:", err);
        }
      }

      // Create registration — admin profile lookup inside will now find the profile
      // for all cases: logged-in, existing member (not logged in), or just-created user.
      const result = await createRegistration(event.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        interests: interests?.trim(),
        heardFrom: heardFrom?.trim(),
      }, ctx.state);

      if (result.error) {
        console.warn(
          "RouteApiEventsRegister: createRegistration-error",
          result,
        );
        let code = "REGISTRATION_FAILED";
        if (result.error?.includes("capacity")) code = "EVENT_FULL";
        else if (result.error?.includes("deadline")) code = "DEADLINE_PASSED";
        else if (result.error?.includes("already registered")) {
          code = "DUPLICATE_EMAIL";
        }
        return new Response(
          JSON.stringify({ error: result.error, code }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Send emails staggered to stay within Resend's 2 req/s rate limit.
      // All run async after the response is returned — no effect on response time.
      if (result.registration) {
        const reg = result.registration;

        // 1. Event confirmation — fires immediately.
        // Meetup events are standard group events (ft-global / discuss-our-future program).
        // Look up the group_events UUID + group slug so the cancel link points to the
        // canonical /groups/[slug]/events/[id]/cancel-registration route.
        // Falls back to no cancel link gracefully if the lookup fails.
        void (async () => {
          try {
            const origin = new URL(ctx.req.url).origin;

            let cancelUrl: string | undefined;
            const { data: evRow } = await ctx.state.supabaseClient!
              .from("group_events")
              .select("group:groups!group_id(slug)")
              .eq("id", event.id)
              .maybeSingle();

            const groupSlug = evRow
              ? (
                (evRow as Record<string, unknown>).group as Record<
                  string,
                  unknown
                >
              )?.slug as string | undefined
              : undefined;

            if (groupSlug && event.id) {
              const cancelToken = await generateCancelRegistrationToken(
                reg.id,
                event.id,
              );
              cancelUrl =
                `${origin}/groups/${groupSlug}/events/${event.id}/cancel-registration?token=${cancelToken}`;
            }

            await sendConfirmationEmail(event, reg, false, cancelUrl);
          } catch (err) {
            console.error("Confirmation email error:", err);
          }
        })();
      }

      return new Response(
        JSON.stringify({ success: true, message: "Registration successful" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      console.error("Event registration error:", error);
      return new Response("Internal server error", { status: 500 });
    }
  },
});
