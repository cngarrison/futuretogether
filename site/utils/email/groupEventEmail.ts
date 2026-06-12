/**
 * Group-scoped event email functions.
 * All emails sent FROM group-{slug}@futuretogether.community.
 * Uses buildEmailHtml() for the branded template.
 */
import {
  buildEmailHtml,
  //FROM_NAME,
  isEmailAllowed,
  RESEND_API_KEY,
  SITE_URL,
} from "../email.ts";
import { naiveDatetimeToDate } from "../temporal.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupFromAddress(groupSlug: string, groupName: string): string {
  return `${groupName} via Future Together <group-${groupSlug}@futuretogether.community>`;
}

function formatEventDate(date: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  }).format(naiveDatetimeToDate(date, timezone));
}

/**
 * Send via Resend and return the message ID on success.
 * Respects the isEmailAllowed gate (env-based allowlist for non-production).
 */
async function sendEmailWithMessageId(options: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; messageId?: string }> {
  if (!isEmailAllowed(options.to)) {
    console.warn(
      `groupEventEmail: blocked to "${options.to}" — not on FT_EMAIL_ALLOWLIST`,
    );
    return { success: false };
  }
  if (!RESEND_API_KEY) {
    console.error("groupEventEmail: FT_RESEND_API_KEY not configured");
    return { success: false };
  }
  try {
    const body: Record<string, unknown> = {
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };
    if (options.text) body.text = options.text;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error("groupEventEmail: Resend error:", await res.text());
      return { success: false };
    }
    const data = await res.json() as { id?: string };
    return { success: true, messageId: data.id };
  } catch (err) {
    console.error("groupEventEmail: send error:", err);
    return { success: false };
  }
}

// ---------------------------------------------------------------------------
// Confirmation email
// ---------------------------------------------------------------------------

export interface GroupEventConfirmationEmailOptions {
  groupSlug: string;
  groupName: string;
  eventTitle: string;
  eventDate: string; // naive local datetime string
  eventTimezone: string;
  durationMinutes: number;
  meetingLink?: string;
  locationName?: string;
  registrationId: string;
  nameFirst: string;
  email: string;
  cancelUrl: string; // full URL with signed token
}

export async function sendGroupEventConfirmationEmail(
  opts: GroupEventConfirmationEmailOptions,
): Promise<{ success: boolean; messageId?: string }> {
  const formattedDate = formatEventDate(opts.eventDate, opts.eventTimezone);
  const locationLine = opts.locationName
    ? `<tr><td style="padding:8px 0;border-bottom:1px solid #d0e4e7;color:#374151;font-weight:600;width:130px;">Location</td><td style="padding:8px 0 8px 16px;border-bottom:1px solid #d0e4e7;color:#374151;">${opts.locationName}</td></tr>`
    : "";
  const meetingLinkLine = opts.meetingLink
    ? `<tr><td style="padding:8px 0;color:#374151;font-weight:600;width:130px;">Online link</td><td style="padding:8px 0 8px 16px;color:#374151;"><a href="${opts.meetingLink}" style="color:#1a5f6e;">${opts.meetingLink}</a></td></tr>`
    : "";
  const joinButton = opts.meetingLink
    ? `<p style="text-align:center;margin:0 0 24px;"><a href="${opts.meetingLink}" class="btn btn-teal">Join Event</a></p>`
    : "";

  const content = `
    <p style="margin:0 0 20px;font-size:17px;color:#1c1a18;">Hi ${opts.nameFirst},</p>
    <p style="margin:0 0 24px;color:#374151;">
      You're registered for <strong>${opts.eventTitle}</strong> — organised by
      <strong>${opts.groupName}</strong>. We look forward to seeing you there.
    </p>

    <div style="background-color:#eef5f7;border-radius:8px;padding:24px;margin:0 0 24px;">
      <p style="margin:0 0 16px;font-weight:700;font-size:16px;color:#1a5f6e;">Event details</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #d0e4e7;color:#374151;font-weight:600;width:130px;">Date &amp; time</td>
          <td style="padding:8px 0 8px 16px;border-bottom:1px solid #d0e4e7;color:#374151;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #d0e4e7;color:#374151;font-weight:600;">Duration</td>
          <td style="padding:8px 0 8px 16px;border-bottom:1px solid #d0e4e7;color:#374151;">${opts.durationMinutes} minutes</td>
        </tr>
        ${locationLine}
        ${meetingLinkLine}
      </table>
    </div>

    ${joinButton}

    <p style="margin:0 0 24px;color:#374151;">
      We'll send you a reminder 24 hours before the event.
    </p>

    <p style="margin:0;font-size:13px;color:#6b7280;">
      Can't make it? <a href="${opts.cancelUrl}" style="color:#1a5f6e;">Cancel your registration &rarr;</a>
    </p>`;

  const text = `Hi ${opts.nameFirst},

You're registered for ${opts.eventTitle} (organised by ${opts.groupName}).

Date & time: ${formattedDate}
Duration: ${opts.durationMinutes} minutes
${opts.locationName ? `Location: ${opts.locationName}\n` : ""}${
    opts.meetingLink ? `Online link: ${opts.meetingLink}\n` : ""
  }
We'll send a reminder 24 hours before the event.

Can't make it? Cancel here: ${opts.cancelUrl}

Future Together — futuretogether.community`;

  return await sendEmailWithMessageId({
    from: groupFromAddress(opts.groupSlug, opts.groupName),
    to: opts.email,
    subject: `Confirmed: ${opts.eventTitle} — ${formattedDate}`,
    html: buildEmailHtml(
      content,
      `You're registered for ${opts.eventTitle} on ${formattedDate}.`,
    ),
    text,
  });
}

// ---------------------------------------------------------------------------
// Cancellation confirmation email
// ---------------------------------------------------------------------------

export interface GroupEventCancellationEmailOptions {
  groupSlug: string;
  groupName: string;
  eventTitle: string;
  eventDate: string;
  eventTimezone: string;
  nameFirst: string;
  email: string;
}

export async function sendGroupEventCancellationEmail(
  opts: GroupEventCancellationEmailOptions,
): Promise<boolean> {
  const formattedDate = formatEventDate(opts.eventDate, opts.eventTimezone);

  const content = `
    <p style="margin:0 0 20px;font-size:17px;color:#1c1a18;">Hi ${opts.nameFirst},</p>
    <p style="margin:0 0 24px;color:#374151;">
      Your registration for <strong>${opts.eventTitle}</strong> on ${formattedDate}
      has been cancelled. We hope to see you at a future event.
    </p>
    <p style="margin:0;color:#374151;">
      <a href="${SITE_URL}/groups" style="color:#1a5f6e;">Find another event &rarr;</a>
    </p>`;

  const text = `Hi ${opts.nameFirst},

Your registration for ${opts.eventTitle} on ${formattedDate} has been cancelled.

We hope to see you at a future event: ${SITE_URL}/groups

Future Together — futuretogether.community`;

  const result = await sendEmailWithMessageId({
    from: groupFromAddress(opts.groupSlug, opts.groupName),
    to: opts.email,
    subject: `Registration cancelled: ${opts.eventTitle}`,
    html: buildEmailHtml(
      content,
      `Your registration for ${opts.eventTitle} has been cancelled.`,
    ),
    text,
  });
  return result.success;
}

// ---------------------------------------------------------------------------
// Reminder email
// ---------------------------------------------------------------------------

export interface GroupEventReminderEmailOptions {
  groupSlug: string;
  groupName: string;
  eventTitle: string;
  eventDate: string;
  eventTimezone: string;
  durationMinutes: number;
  meetingLink?: string;
  locationName?: string;
  nameFirst: string;
  email: string;
  reminderType: "1-day" | "1-hour";
}

export async function sendGroupEventReminderEmail(
  opts: GroupEventReminderEmailOptions,
): Promise<{ success: boolean; messageId?: string }> {
  const formattedDate = formatEventDate(opts.eventDate, opts.eventTimezone);
  const timeUntil = opts.reminderType === "1-day" ? "tomorrow" : "in 1 hour";
  const subjectPrefix = opts.reminderType === "1-day"
    ? "Tomorrow:"
    : "Starting soon:";
  const locationLine = opts.locationName
    ? `<p style="margin:4px 0 0;font-size:14px;color:#374151;">📍 ${opts.locationName}</p>`
    : "";
  const joinButton = opts.meetingLink
    ? `<p style="text-align:center;margin:0 0 24px;"><a href="${opts.meetingLink}" class="btn btn-teal">Join Event</a></p>`
    : "";

  const content = `
    <p style="margin:0 0 20px;font-size:17px;color:#1c1a18;">Hi ${opts.nameFirst},</p>
    <p style="margin:0 0 24px;color:#374151;">
      A quick reminder — <strong>${opts.eventTitle}</strong> is starting
      <strong>${timeUntil}</strong>.
    </p>

    <div style="background-color:#eef5f7;border-radius:8px;padding:24px;margin:0 0 28px;">
      <p style="margin:0 0 4px;font-weight:700;color:#1a5f6e;">${formattedDate}</p>
      <p style="margin:0;font-size:14px;color:#374151;">${
    opts.meetingLink && opts.locationName
      ? "Online + In Person"
      : opts.meetingLink
      ? "Online"
      : "In Person"
  }</p>
      ${locationLine}
    </div>

    ${joinButton}

    <p style="margin:0;font-size:13px;color:#6b7280;">See you there!</p>`;

  const text = `Hi ${opts.nameFirst},

Reminder: ${opts.eventTitle} is starting ${timeUntil}.

Date & time: ${formattedDate}
${opts.locationName ? `Location: ${opts.locationName}\n` : ""}${
    opts.meetingLink ? `Link: ${opts.meetingLink}\n` : ""
  }
See you there!

Future Together — futuretogether.community`;

  return await sendEmailWithMessageId({
    from: groupFromAddress(opts.groupSlug, opts.groupName),
    to: opts.email,
    subject: `${subjectPrefix} ${opts.eventTitle}`,
    html: buildEmailHtml(
      content,
      `${opts.eventTitle} is starting ${timeUntil}.`,
    ),
    text,
  });
}
