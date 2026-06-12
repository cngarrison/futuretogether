import type { EventConfig } from "@/utils/db/group-events.ts";
import type { Registration } from "@/utils/db/group-registrations.ts";
import { buildEmailHtml, sendEmail } from "../email.ts";
import { naiveDatetimeToDate } from "../temporal.ts";
import { buildGroupEventICal } from "../ical.ts";

const SLACK_INVITE_URL =
  "https://join.slack.com/t/future-together-group/shared_invite/zt-3ssaug5th-1JI5b86jGesX8B77RojgBQ";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatEventDate(date: string, timezone: string): string {
  // date is a naive local datetime (ft-07i.15); convert via Temporal before formatting.
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

// ---------------------------------------------------------------------------
// Confirmation email
// ---------------------------------------------------------------------------

export async function sendConfirmationEmail(
  event: EventConfig,
  registration: Registration,
  slackInvite = false,
  cancelUrl?: string,
): Promise<boolean> {
  const { attendee } = registration;
  const formattedDate = formatEventDate(event.date, event.timezone);
  // Build iCal using the shared helper — handles hybrid location correctly
  // and uses the group contact address as organiser.
  // Global FT meetups fall back to the ft-global group identity.
  const icalContent = buildGroupEventICal({
    event,
    groupSlug: "ft-global",
    groupName: "Future Together",
    attendee: {
      name: `${attendee.firstName} ${attendee.lastName}`.trim() || undefined,
      email: attendee.email,
    },
  });

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
          <td style="padding:8px 0;border-bottom:1px solid #d0e4e7;color:#374151;font-weight:600;">Format</td>
          <td style="padding:8px 0 8px 16px;border-bottom:1px solid #d0e4e7;color:#374151;">${
    event.meetingLink && event.meetingLocation
      ? "Online + In Person"
      : event.meetingLink
      ? "Online via Jitsi"
      : "In Person"
  }</td>
        </tr>
        ${
    event.meetingLocation
      ? `
        <tr class="detail-row">
          <td style="padding:8px 0;border-bottom:1px solid #d0e4e7;color:#374151;font-weight:600;">Location</td>
          <td style="padding:8px 0 8px 16px;border-bottom:1px solid #d0e4e7;color:#374151;">${event.meetingLocation}</td>
        </tr>`
      : ""
  }
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

    ${
    event.meetingLink
      ? `<p style="text-align:center;margin:0 0 24px;">
      <a href="${event.meetingLink}" class="btn btn-teal">Join Meetup</a>
    </p>`
      : ""
  }

    ${topicsHtml}

    <p style="margin:0 0 16px;color:#374151;">
      <strong>Calendar invite:</strong> An iCalendar (.ics) file is attached —
      open it to add this event to Google Calendar, Outlook, or Apple Calendar.
    </p>
    <p style="margin:0 0 24px;color:#374151;">
      We'll send you a reminder 24 hours before the event.
    </p>
    ${
    slackInvite
      ? `
    <div style="margin:0 0 24px;padding:20px 24px;background:#f0f9fa;border-left:4px solid #1a5f6e;border-radius:4px;">
      <p style="margin:0 0 8px;font-weight:700;color:#1a5f6e;font-size:15px;">&#x1F4AC; Keep the conversation going</p>
      <p style="margin:0 0 14px;color:#374151;font-size:14px;">
        Between meetups, the Future Together Slack is where our community
        talks — share what you're reading, ask questions, or just know others
        are thinking about the same things you are.
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
    <p style="margin:0;font-size:13px;color:#6b7280;">
      ${
    cancelUrl
      ? `Can't make it? <a href="${cancelUrl}" style="color:#1a5f6e;">Cancel your registration &rarr;</a>`
      : `Need to cancel? Simply reply to this email.`
  }
    </p>`;

  const text = `Hi ${attendee.firstName},

You're registered for ${event.title}.

Date & time: ${formattedDate}
Duration: ${event.duration} minutes
${event.meetingLocation ? `Location: ${event.meetingLocation}\n` : ""}${
    event.meetingLink ? `Meeting link: ${event.meetingLink}` : ""
  }
${
    event.topics?.length
      ? `\nWhat we'll discuss:\n${event.topics.map((t) => `- ${t}`).join("\n")}`
      : ""
  }

An iCalendar file is attached to add this to your calendar.
We'll send a reminder 24 hours before the event.

${
    cancelUrl
      ? `Can't make it? Cancel here: ${cancelUrl}`
      : `Need to cancel? Reply to this email.`
  }

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
      <p style="margin:0;font-size:14px;color:#374151;">${
    event.meetingLink && event.meetingLocation
      ? "Online + In Person"
      : event.meetingLink
      ? "Online via Jitsi"
      : "In Person"
  }</p>
      ${
    event.meetingLocation
      ? `<p style="margin:4px 0 0;font-size:14px;color:#374151;">📍 ${event.meetingLocation}</p>`
      : ""
  }
    </div>

    ${
    event.meetingLink
      ? `<p style="text-align:center;margin:0 0 24px;">
      <a href="${event.meetingLink}" class="btn btn-teal">Join Meetup</a>
    </p>`
      : ""
  }

    <p style="margin:0;font-size:13px;color:#6b7280;">See you there!</p>`;

  const text = `Hi ${attendee.firstName},

Reminder: ${event.title} is starting in ${timeUntil}.

Date & time: ${formattedDate}
${event.meetingLocation ? `Location: ${event.meetingLocation}\n` : ""}${
    event.meetingLink ? `Meeting link: ${event.meetingLink}` : ""
  }

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

// ---------------------------------------------------------------------------
// Organiser reminder email
// ---------------------------------------------------------------------------

export async function sendOrganizerReminderEmail(
  event: EventConfig,
  registrations: Registration[],
  reminderType: "day_before" | "hour_before",
): Promise<boolean> {
  if (!event.organizer?.email) return false;

  const { name: orgName, email: orgEmail } = event.organizer;
  const formattedDate = formatEventDate(event.date, event.timezone);
  const timeUntil = reminderType === "day_before" ? "24 hours" : "1 hour";
  const subjectPrefix = reminderType === "day_before"
    ? "[Organiser] Tomorrow:"
    : "[Organiser] Starting soon:";
  const attendeeSubjectPrefix = reminderType === "day_before"
    ? "Tomorrow:"
    : "Starting soon:";
  const n = registrations.length;

  const hasInterests = registrations.some(
    (r) => (r.engagement?.interests ?? "").trim() !== "",
  );

  let registrantSectionHtml: string;
  let csvAttachment:
    | { filename: string; content: string; type: string }
    | undefined;

  if (n === 0) {
    registrantSectionHtml =
      `<p style="margin:16px 0 0;color:#374151;">No registrations have been received for this event.</p>`;
  } else if (n <= 30) {
    // Build registrant rows for inline table
    const tableRowsHtml = registrations.map((r) => {
      const reg = r.attendee;
      const interests = r.engagement?.interests ?? "";
      const heardFrom = r.engagement?.heardFrom ?? "";
      const registered = new Date(r.timestamp).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      return `<tr>
		<td style="padding:6px 10px;border-bottom:1px solid #d0e4e7;color:#374151;">${reg.firstName}</td>
		<td style="padding:6px 10px;border-bottom:1px solid #d0e4e7;color:#374151;">${reg.lastName}</td>
		<td style="padding:6px 10px;border-bottom:1px solid #d0e4e7;color:#374151;">${reg.email}</td>
		<td style="padding:6px 10px;border-bottom:1px solid #d0e4e7;color:#374151;">${interests}</td>
		<td style="padding:6px 10px;border-bottom:1px solid #d0e4e7;color:#374151;">${heardFrom}</td>
		<td style="padding:6px 10px;border-bottom:1px solid #d0e4e7;color:#374151;">${registered}</td>
	  </tr>`;
    }).join("");

    const interestsNote = (n > 0 && hasInterests)
      ? `<p style="margin:16px 0 0;color:#374151;">If you have a separate presenter, please share the interests above with them ahead of the event.</p>`
      : "";
    registrantSectionHtml = `
      <p style="margin:24px 0 8px;font-weight:600;color:#1c1a18;">${n} registered attendee(s)</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#eef5f7;">
            <th style="padding:6px 10px;text-align:left;color:#1a5f6e;">First Name</th>
            <th style="padding:6px 10px;text-align:left;color:#1a5f6e;">Last Name</th>
            <th style="padding:6px 10px;text-align:left;color:#1a5f6e;">Email</th>
            <th style="padding:6px 10px;text-align:left;color:#1a5f6e;">Interests</th>
            <th style="padding:6px 10px;text-align:left;color:#1a5f6e;">Heard From</th>
            <th style="padding:6px 10px;text-align:left;color:#1a5f6e;">Registered</th>
          </tr>
        </thead>
        <tbody>${tableRowsHtml}</tbody>
      </table>
      ${interestsNote}`;
  } else {
    // Build CSV for attachment
    const csvHeader =
      "First Name,Last Name,Email,Interests,Heard From,Registered At\n";
    const csvRows = registrations.map((r) => {
      const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
      return [
        esc(r.attendee.firstName),
        esc(r.attendee.lastName),
        esc(r.attendee.email),
        esc(r.engagement?.interests ?? ""),
        esc(r.engagement?.heardFrom ?? ""),
        esc(r.timestamp),
      ].join(",");
    }).join("\n");
    const csvContent = csvHeader + csvRows;
    const encoder = new TextEncoder();
    const csvBytes = encoder.encode(csvContent);
    const base64Csv = btoa(String.fromCharCode(...csvBytes));
    csvAttachment = {
      filename: "registrants.csv",
      content: base64Csv,
      type: "text/csv",
    };

    registrantSectionHtml =
      `<p style="margin:24px 0 0;color:#374151;">${n} registered attendee(s). See attached CSV for the full list.</p>`;
  }

  const content = `
    <p style="margin:0 0 20px;font-size:17px;color:#1c1a18;">Hi ${orgName},</p>
    <p style="margin:0 0 24px;color:#374151;">
      <strong>${event.title}</strong> is starting in <strong>${timeUntil}</strong>.
      Here is your organiser summary.
    </p>
    <p style="margin:0 0 24px;color:#6b7280;font-size:13px;">
      <em>Attendees received: &ldquo;${attendeeSubjectPrefix} ${event.title}&rdquo;</em>
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
          <td style="padding:8px 0 8px 16px;border-bottom:1px solid #d0e4e7;color:#374151;">${event.duration} minutes</td>
        </tr>
        ${
    event.meetingLocation
      ? `
        <tr>
          <td style="padding:8px 0;${
        event.meetingLink ? "border-bottom:1px solid #d0e4e7;" : ""
      }color:#374151;font-weight:600;">Location</td>
          <td style="padding:8px 0 8px 16px;${
        event.meetingLink ? "border-bottom:1px solid #d0e4e7;" : ""
      }color:#374151;">${event.meetingLocation}</td>
        </tr>`
      : ""
  }
        ${
    event.meetingLink
      ? `
        <tr>
          <td style="padding:8px 0;color:#374151;font-weight:600;">Meeting link</td>
          <td style="padding:8px 0 8px 16px;color:#374151;">
            <a href="${event.meetingLink}" style="color:#1a5f6e;">${event.meetingLink}</a>
          </td>
        </tr>`
      : ""
  }
      </table>
    </div>

    ${registrantSectionHtml}`;

  const text = `Hi ${orgName},

${event.title} is starting in ${timeUntil}. Here is your organiser summary.

Attendees received: "${attendeeSubjectPrefix} ${event.title}"

Date & time: ${formattedDate}
Duration: ${event.duration} minutes
${event.meetingLocation ? `Location: ${event.meetingLocation}\n` : ""}${
    event.meetingLink ? `Meeting link: ${event.meetingLink}` : ""
  }

${
    n === 0
      ? "No registrations have been received for this event."
      : n > 30
      ? `${n} registered attendee(s). See attached CSV for the full list.`
      : `${n} registered attendee(s):\n${
        registrations.map((r) =>
          `  ${r.attendee.firstName} ${r.attendee.lastName} <${r.attendee.email}>`
        ).join("\n")
      }`
  }${
    n > 0 && hasInterests
      ? "\n\nIf you have a separate presenter, please share the interests above with them ahead of the event."
      : ""
  }

Future Together — futuretogether.community`;

  const attachments: { filename: string; content: string; type: string }[] = [];
  if (csvAttachment) attachments.push(csvAttachment);

  return await sendEmail({
    to: orgEmail,
    subject: `${subjectPrefix} ${event.title} \u2014 ${n} registrant(s)`,
    html: buildEmailHtml(
      content,
      `${event.title} is starting in ${timeUntil}. Here is your organiser summary.`,
    ),
    text,
    ...(attachments.length > 0 ? { attachments } : {}),
  });
}
