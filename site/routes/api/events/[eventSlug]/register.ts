import { define } from "../../../../../utils.ts";
import {
  createRegistration,
  getNextAvailableEvent,
} from "../../../../../utils/events.ts";
import { sendConfirmationEmail } from "../../../../../utils/eventEmail.ts";
import { verifyTurnstileToken } from "../../../../../utils/turnstile.ts";

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

      // Send confirmation email asynchronously
      if (result.registration) {
        sendConfirmationEmail(event, result.registration).catch((error) => {
          console.error("Error sending confirmation email:", error);
        });
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
