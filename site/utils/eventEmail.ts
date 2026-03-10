import ical from "ical-generator";
import type { EventConfig, Registration } from "./events.ts";
import { buildEmailHtml, FROM_EMAIL, FROM_NAME, sendEmail } from "./email.ts";

// ---------------------------------------------------------------------------
// iCalendar
// ---------------------------------------------------------------------------

export function generateICalendar(
  event: EventConfig,
  attendee: { firstName: string; lastName: string; email: string },
): string {
  const calendar = ical({ name: event.title, production: true });
  const startDate = new Date(event.date);
  const endDate = new Date(startDate.getTime() + event.duration * 60 * 1000);

  calendar.createEvent({
    start: startDate,
    end: endDate,
    summary: event.title,
    description: event.description,
    location: event.meetingLink,
    url: event.meetingLink,
    organizer: { name: FROM_NAME, email: FROM_EMAIL },
    attendees: [{
      name: `${attendee.firstName} ${attendee.lastName}`,
      email: attendee.email,
      rsvp: true,
      status: "ACCEPTED",
    }],
  });

  return calendar.toString();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  }).format(new Date(date));
}

// ---------------------------------------------------------------------------
// Confirmation email
// ---------------------------------------------------------------------------

export async function sendConfirmationEmail(
  event: EventConfig,
  registration: Registration,
): Promise<boolean> {
  const { attendee } = registration;
  const formattedDate = formatEventDate(event.date, event.timezone);
  const icalContent = generateICalendar(event, attendee);

  const topicsHtml = event.topics && event.topics.length > 0
    ? `<p style="margin:24px 0 8px;font-weight:600;color:#1c1a18;">What we'll discuss</p>
       <ul style="margin:0 0 24px;padding-left:20px;color:#374151;line-height:1.8;">
         ${event.topics.map((t) => `<li>${t}</li>`).join("")}
       </ul>`
    : "";

  const content = `
    <p style="margin:0 0 20px;font-size:17px;color:#1c1a18;">Hi ${attendee.firstName},</p>
    <p style="margin:0 0 24px;color:#374151;">
      You're registered for <strong>${event.title}</strong>${
    event.presentedBy ? ` with ${event.presentedBy}` : ""
  }.
      We're looking forward to having you join the conversation.
    </p>

    <div style="background-color:#eef5f7;border-radius:8px;padding:24px;margin:0 0 24px;">
      <p style="margin:0 0 16px;font-weight:700;font-size:16px;color:#1a5f6e;">Event details</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr class="detail-row">
          <td style="padding:8px 0;border-bottom:1px solid #d0e4e7;color:#374151;font-weight:600;width:130px;">Date &amp; time</td>
          <td style="padding:8px 0 8px 16px;border-bottom:1px solid #d0e4e7;color:#374151;">${formattedDate}</td>
        </tr>
        <tr class="detail-row">
          <td style="padding:8px 0;border-bottom:1px solid #d0e4e7;color:#374151;font-weight:600;">Duration</td>
          <td style="padding:8px 0 8px 16px;border-bottom:1px solid #d0e4e7;color:#374151;">${event.duration} minutes</td>
        </tr>
        <tr class="detail-row">
          <td style="padding:8px 0;${
    event.presentedBy ? "border-bottom:1px solid #d0e4e7;" : ""
  }color:#374151;font-weight:600;">Format</td>
          <td style="padding:8px 0 8px 16px;${
    event.presentedBy ? "border-bottom:1px solid #d0e4e7;" : ""
  }color:#374151;">Online via Google Meet</td>
        </tr>
        ${
    event.presentedBy
      ? `
        <tr>
          <td style="padding:8px 0;color:#374151;font-weight:600;">Presented by</td>
          <td style="padding:8px 0 8px 16px;color:#374151;">${event.presentedBy}</td>
        </tr>`
      : ""
  }
      </table>
    </div>

    <p style="text-align:center;margin:0 0 24px;">
      <a href="${event.meetingLink}" class="btn btn-teal">Join Google Meet</a>
    </p>

    ${topicsHtml}

    <p style="margin:0 0 16px;color:#374151;">
      <strong>Calendar invite:</strong> An iCalendar (.ics) file is attached —
      open it to add this event to Google Calendar, Outlook, or Apple Calendar.
    </p>
    <p style="margin:0 0 24px;color:#374151;">
      We'll send you a reminder 24 hours before the event.
    </p>
    <p style="margin:0;font-size:13px;color:#6b7280;">
      Need to cancel? Simply reply to this email.
    </p>`;

  const text = `Hi ${attendee.firstName},

You're registered for ${event.title}.

Date & time: ${formattedDate}
Duration: ${event.duration} minutes
Meeting link: ${event.meetingLink}
${
    event.topics?.length
      ? `\nWhat we'll discuss:\n${event.topics.map((t) => `- ${t}`).join("\n")}`
      : ""
  }

An iCalendar file is attached to add this to your calendar.
We'll send a reminder 24 hours before the event.

Need to cancel? Reply to this email.

Future Together — futuretogether.community`;

  const encoder = new TextEncoder();
  const icalBytes = encoder.encode(icalContent);
  const base64Content = btoa(String.fromCharCode(...icalBytes));

  return await sendEmail({
    to: attendee.email,
    subject: `Confirmed: ${event.title} \u2014 ${formattedDate}`,
    html: buildEmailHtml(
      content,
      `You're registered for ${event.title} on ${formattedDate}.`,
    ),
    text,
    attachments: [{
      filename: "event.ics",
      content: base64Content,
      type: "text/calendar",
    }],
  });
}

// ---------------------------------------------------------------------------
// Reminder email
// ---------------------------------------------------------------------------

export async function sendReminderEmail(
  event: EventConfig,
  registration: Registration,
  reminderType: "day_before" | "hour_before",
): Promise<boolean> {
  const { attendee } = registration;
  const formattedDate = formatEventDate(event.date, event.timezone);
  const timeUntil = reminderType === "day_before" ? "24 hours" : "1 hour";
  const subjectPrefix = reminderType === "day_before"
    ? "Tomorrow:"
    : "Starting soon:";

  const content = `
    <p style="margin:0 0 20px;font-size:17px;color:#1c1a18;">Hi ${attendee.firstName},</p>
    <p style="margin:0 0 24px;color:#374151;">
      A quick reminder — <strong>${event.title}</strong> is starting in
      <strong>${timeUntil}</strong>.
    </p>

    <div style="background-color:#eef5f7;border-radius:8px;padding:24px;margin:0 0 28px;">
      <p style="margin:0 0 4px;font-weight:700;color:#1a5f6e;">${formattedDate}</p>
      <p style="margin:0;font-size:14px;color:#374151;">Online via Google Meet</p>
    </div>

    <p style="text-align:center;margin:0 0 24px;">
      <a href="${event.meetingLink}" class="btn btn-teal">Join Google Meet</a>
    </p>

    <p style="margin:0;font-size:13px;color:#6b7280;">See you there!</p>`;

  const text = `Hi ${attendee.firstName},

Reminder: ${event.title} is starting in ${timeUntil}.

Date & time: ${formattedDate}
Meeting link: ${event.meetingLink}

See you there!

Future Together — futuretogether.community`;

  return await sendEmail({
    to: attendee.email,
    subject: `${subjectPrefix} ${event.title}`,
    html: buildEmailHtml(
      content,
      `${event.title} is starting in ${timeUntil}.`,
    ),
    text,
  });
}
