/**
 * Email notifications for group application events.
 *
 * Sends a confirmation email to the applicant after a group application
 * is successfully submitted.
 */

import { buildEmailHtml, sendEmail } from "../email.ts";

const SITE_URL = "https://futuretogether.community";

// ---------------------------------------------------------------------------
// Applicant confirmation
// ---------------------------------------------------------------------------

export async function sendGroupApplicationConfirmation(
  applicantEmail: string,
  applicantName: string,
  groupName: string,
): Promise<void> {
  const firstName = applicantName.split(" ")[0] || applicantName;

  const body = `
    <p style="margin:0 0 20px;font-size:17px;color:#1c1a18;">Hi ${firstName},</p>
    <p style="margin:0 0 16px;color:#374151;">
      Thanks for applying to start a Future Together group —
      <strong>${groupName}</strong>. We've received your application and
      will review it within a few days.
    </p>
    <p style="margin:0 0 16px;color:#374151;">
      We'll be in touch by email with our decision. In the meantime,
      if you have any questions you're welcome to reply to this email.
    </p>

    <div style="margin:28px 0;padding:20px;background:#f0f8fa;border-left:4px solid #1a5f6e;border-radius:4px;">
      <p style="margin:0 0 8px;font-weight:600;color:#1a5f6e;">While you wait</p>
      <ul style="margin:0;padding-left:20px;color:#374151;line-height:1.9;">
        <li>Read our <a href="${SITE_URL}/start-a-group" style="color:#1a5f6e;">Start a Group guide</a> to get a head start on planning</li>
        <li>Browse <a href="${SITE_URL}/groups/" style="color:#1a5f6e;">existing groups</a> to see what others are doing</li>
        <li>Join an upcoming <a href="${SITE_URL}/meetups" style="color:#1a5f6e;">online meetup</a> to connect with the community</li>
      </ul>
    </div>

    <p style="margin:0 0 24px;color:#374151;">
      Starting a local group is one of the most meaningful things you can
      do — helping your community face the future together rather than
      alone. We're glad you're here.
    </p>
    <p style="margin:0;color:#6b7280;font-size:13px;">
      If you didn't submit this application, please reply to let us know.
    </p>`;

  await sendEmail({
    to: applicantEmail,
    subject: `Your group application — ${groupName}`,
    html: buildEmailHtml(
      body,
      `Application received: ${groupName}`,
    ),
  });
}
