/**
 * Email notifications for member signup events.
 *
 * Sends two emails on new member creation:
 *   1. Admin notification — full details, subject flags organisers
 *   2. Welcome email to the new member
 */

import { buildEmailHtml, FROM_NAME, sendEmail } from "./email.ts";
import type { Member } from "./members.ts";

const SITE_URL = "https://futuretogether.community";
const SLACK_INVITE_URL =
  "https://join.slack.com/t/future-together-group/shared_invite/zt-3ssaug5th-1JI5b86jGesX8B77RojgBQ";

// ---------------------------------------------------------------------------
// Admin notification
// ---------------------------------------------------------------------------

export async function sendMemberAdminNotification(
  member: Member,
): Promise<void> {
  const contactEmail = Deno.env.get("FT_CONTACT_EMAIL") ??
    Deno.env.get("FROM_EMAIL") ?? "";
  if (!contactEmail) return;

  const isOrganiser = member.role === "organiser";
  const subject = isOrganiser
    ? `⭐ New organiser signup: ${member.firstName} ${member.lastName}`
    : `New member: ${member.firstName} ${member.lastName}`;

  const interestsList = member.interests.length > 0
    ? member.interests.map((i) => `<li>${i}</li>`).join("")
    : "<li><em>None selected</em></li>";

  const html = `
    <h2 style="margin:0 0 20px;color:#1c1a18;font-size:20px;">
      ${isOrganiser ? "⭐ New Organiser Signup" : "New Community Member"}
    </h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e8e3db;"><strong>Name</strong></td>
        <td style="padding:10px 0 10px 16px;border-bottom:1px solid #e8e3db;">${member.firstName} ${member.lastName}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e8e3db;"><strong>Email</strong></td>
        <td style="padding:10px 0 10px 16px;border-bottom:1px solid #e8e3db;"><a href="mailto:${member.email}">${member.email}</a></td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e8e3db;"><strong>Role</strong></td>
        <td style="padding:10px 0 10px 16px;border-bottom:1px solid #e8e3db;">${
    isOrganiser ? "⭐ Organiser" : "Member"
  }</td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e8e3db;"><strong>Source</strong></td>
        <td style="padding:10px 0 10px 16px;border-bottom:1px solid #e8e3db;">${
    member.source === "join_form" ? "Join page" : "Event registration"
  }</td>
      </tr>
      ${
    member.location
      ? `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e8e3db;"><strong>Location</strong></td>
        <td style="padding:10px 0 10px 16px;border-bottom:1px solid #e8e3db;">${member.location}</td>
      </tr>`
      : ""
  }
      ${
    member.heardFrom
      ? `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e8e3db;"><strong>Found us via</strong></td>
        <td style="padding:10px 0 10px 16px;border-bottom:1px solid #e8e3db;">${member.heardFrom}</td>
      </tr>`
      : ""
  }
    </table>
    <h3 style="margin:24px 0 8px;color:#1c1a18;">Interests</h3>
    <ul style="margin:0;padding-left:20px;color:#374151;line-height:1.8;">${interestsList}</ul>
    ${
    isOrganiser
      ? `
    <div style="margin-top:24px;padding:16px;background:#fef9ec;border-left:4px solid #c4853a;border-radius:4px;">
      <strong style="color:#c4853a;">Action needed:</strong> This person wants to run a local group.
      Consider reaching out to welcome them and share organiser resources.
    </div>`
      : ""
  }`;

  await sendEmail({
    to: contactEmail,
    subject,
    html: buildEmailHtml(html, subject),
    replyTo: member.email,
  });
}

// ---------------------------------------------------------------------------
// Welcome email to the new member
// ---------------------------------------------------------------------------

export async function sendMemberWelcomeEmail(
  member: Member,
  slackInvite = false,
): Promise<void> {
  const isOrganiser = member.role === "organiser";

  const body = `
    <p style="margin:0 0 20px;font-size:17px;color:#1c1a18;">Hi ${member.firstName},</p>
    <p style="margin:0 0 16px;color:#374151;">
      Welcome to Future Together. You're now part of a community of people
      paying attention to AI-driven change — and thinking seriously about
      what to do about it.
    </p>
    <p style="margin:0 0 16px;color:#374151;">
      You don't have to have the answers. Neither do we. That's exactly why
      this community exists.
    </p>

    ${
    isOrganiser
      ? `
    <div style="margin:24px 0;padding:20px;background:#f0f8fa;border-left:4px solid #1a5f6e;border-radius:4px;">
      <p style="margin:0 0 8px;font-weight:600;color:#1a5f6e;">You mentioned wanting to run a local group — brilliant.</p>
      <p style="margin:0;color:#374151;">
        We'll be in touch with resources to help you get started. In the meantime,
        our <a href="${SITE_URL}/start-a-group" style="color:#1a5f6e;">Start a Group guide</a>
        covers everything from finding your first attendees to running your first session.
      </p>
    </div>`
      : ""
  }

    <h3 style="margin:28px 0 12px;color:#1c1a18;font-size:16px;">What happens next</h3>
    <ul style="margin:0 0 24px;padding-left:20px;color:#374151;line-height:1.8;">
      <li>Our monthly online meetup — <a href="${SITE_URL}/meetups" style="color:#1a5f6e;">see upcoming dates</a></li>
      <li>New blog posts as they're published</li>
      <li>Community updates when there's something worth sharing</li>
    </ul>
    <p style="margin:0 0 24px;color:#374151;">
      No spam. No sales pitches. No political agenda. Just honest conversation
      with people who are paying attention.
    </p>
    ${
    slackInvite
      ? `
    <div style="margin:0 0 28px;padding:20px 24px;background:#f0f9fa;border-left:4px solid #1a5f6e;border-radius:4px;">
      <p style="margin:0 0 8px;font-weight:700;color:#1a5f6e;font-size:15px;">&#x1F4AC; Join us on Slack</p>
      <p style="margin:0 0 14px;color:#374151;font-size:14px;">
        Our Slack workspace is where the conversation continues between meetups.
        Ask questions, share what you're reading, and connect with others
        thinking seriously about the same things you are.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0;">
        <tr>
          <td style="border-radius:8px;background:#1a5f6e;">
            <a href="${SLACK_INVITE_URL}" target="_blank" rel="noopener noreferrer"
              style="display:inline-block;padding:10px 20px;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;border-radius:8px;">
              Join the Future Together Slack &rarr;
            </a>
          </td>
        </tr>
      </table>
    </div>`
      : ""
  }
    <p style="text-align:center;margin:0 0 32px;">
      <a href="${SITE_URL}/meetups" class="btn">See upcoming meetups</a>
    </p>
    <p style="margin:0;color:#6b7280;font-size:13px;">
      If you didn't sign up for this, you can safely ignore this email.
      We won't contact you again.
    </p>`;

  await sendEmail({
    to: member.email,
    subject: `Welcome to Future Together`,
    html: buildEmailHtml(
      body,
      `Welcome to the Future Together community, ${member.firstName}.`,
    ),
  });
}
