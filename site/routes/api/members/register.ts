/**
 * POST /api/members/register
 *
 * Handles membership signup from the /join page form.
 * Creates or updates a member record in Deno KV, then sends:
 *   - Admin notification (with organiser flag in subject if applicable)
 *   - Welcome email to the new member
 */

import { define } from "@/utils.ts";
import { createMember } from "@/utils/members.ts";
import {
  sendMemberAdminNotification,
  sendMemberWelcomeEmail,
} from "@/utils/memberEmail.ts";
import { verifyTurnstileToken } from "@/utils/turnstile.ts";

export const handlers = define.handlers({
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
        turnstile_token,
      } = body;

      // Turnstile verification (no-op if not configured)
      const turnstileValid = await verifyTurnstileToken(turnstile_token);
      if (!turnstileValid) {
        return new Response("Captcha verification failed", { status: 400 });
      }

      // Validate required fields
      if (!firstName?.trim()) {
        return new Response(
          JSON.stringify({ error: "First name is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      if (!lastName?.trim()) {
        return new Response(
          JSON.stringify({ error: "Last name is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      if (!email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return new Response(
          JSON.stringify({ error: "Valid email address is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const result = await createMember({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role: wantsToOrganise ? "organiser" : "member",
        source: "join_form",
        interests: Array.isArray(interests) ? interests : [],
        heardFrom: heardFrom?.trim() || undefined,
        location: location?.trim() || undefined,
      });

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error ?? "Registration failed" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      // Send emails asynchronously — don't block the response.
      // Fire each independently so a failure in one doesn't suppress the other.
      if (result.member) {
        const member = result.member;

        if (result.created) {
          // Brand-new member: admin notification + welcome email
          sendMemberAdminNotification(member).catch((err) =>
            console.error("Admin notification error:", err)
          );
          sendMemberWelcomeEmail(member).catch((err) =>
            console.error("Welcome email error:", err)
          );
        } else {
          // Existing member — only act if role was upgraded to organiser
          if (member.role === "organiser") {
            sendMemberAdminNotification(member).catch((err) =>
              console.error("Admin notification error:", err)
            );
            // Also send welcome so they get the organiser-specific content
            sendMemberWelcomeEmail(member).catch((err) =>
              console.error("Welcome email error:", err)
            );
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          created: result.created,
          message: result.created
            ? "Welcome to Future Together!"
            : "You're already a member — your details have been updated.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      console.error("Member registration error:", error);
      return new Response("Internal server error", { status: 500 });
    }
  },
});
