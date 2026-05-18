import { define } from "@/utils.ts";

import { createRegistration, getNextAvailableEvent } from "@/utils/events.ts";
import { sendConfirmationEmail } from "@/utils/eventEmail.ts";
import { verifyTurnstileToken } from "@/utils/turnstile.ts";
import { createMember } from "@/utils/members.ts";
import {
  sendMemberAdminNotification,
  sendMemberWelcomeEmail,
} from "@/utils/memberEmail.ts";
//const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const handlers = define.handlers({
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

      // Verify Turnstile token if configured
      const turnstileValid = await verifyTurnstileToken(turnstile_token);
      if (!turnstileValid) {
        console.warn("Turnstile verification failed for event registration");
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
      const event = await getNextAvailableEvent(eventSlug);
      if (!event) {
        return new Response(
          JSON.stringify({
            error: "No available events found",
            code: "NO_AVAILABLE_EVENT",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      // Create registration
      const result = await createRegistration(event.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        interests: interests?.trim(),
        heardFrom: heardFrom?.trim(),
      });

      if (!result.success) {
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

        // 1. Event confirmation — fires immediately
        sendConfirmationEmail(event, reg).catch((err) =>
          console.error("Confirmation email error:", err)
        );

        // 2 & 3. Member emails — only if opt-in checkbox ticked
        if (joinCommunity !== false) {
          createMember({
            email: reg.attendee.email,
            firstName: reg.attendee.firstName,
            lastName: reg.attendee.lastName,
            source: "event_registration",
            interests: [],
            heardFrom: reg.engagement?.heardFrom,
          }).then(async (memberResult) => {
            if (
              memberResult.success && memberResult.created &&
              memberResult.member
            ) {
              const member = memberResult.member;
              // 2. Member welcome — 1.1s after confirmation
              //await delay(1100);
              const joinSlack = body.joinSlack === true;
              sendMemberWelcomeEmail(member, joinSlack).catch((err) =>
                console.error("Member welcome email error:", err)
              );
              // 3. Admin notification — 1.1s after welcome (2.2s total)
              //await delay(1100);
              sendMemberAdminNotification(member).catch((err) =>
                console.error("Admin notification error:", err)
              );
            }
          }).catch((err) => console.error("Auto-member error:", err));
        }
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
