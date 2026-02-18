import ical from "ical-generator";
import type { EventConfig, Registration } from "./events.ts";

const RESEND_API_KEY = Deno.env.get("FT_RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FT_RESEND_FROM_EMAIL") ||
  "hello@futuretogether.community";
const FROM_NAME = Deno.env.get("FT_RESEND_FROM_NAME") || "Future Together";

interface EmailAttachment {
  filename: string;
  content: string;
  type?: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

// Generate iCalendar file content with proper timezone support
export function generateICalendar(
  event: EventConfig,
  attendee: { firstName: string; lastName: string; email: string },
): string {
  // Simple UTC-based calendar (no timezone complexity)
  const calendar = ical({
    name: event.title,
    production: true,
  });

  // Parse UTC dates - simple and reliable
  const startDate = new Date(event.date);
  const endDate = new Date(startDate.getTime() + event.duration * 60 * 1000);

  calendar.createEvent({
    start: startDate,
    end: endDate,
    summary: event.title,
    description: event.description,
    location: event.meetingLink,
    url: event.meetingLink,
    organizer: {
      name: FROM_NAME,
      email: FROM_EMAIL,
    },
    attendees: [{
      name: `${attendee.firstName} ${attendee.lastName}`,
      email: attendee.email,
      rsvp: true,
      status: "ACCEPTED",
    }],
  });

  return calendar.toString();
}

// Send email via Resend API
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

// Format event date for display
function formatEventDate(date: string, timezone: string): string {
  const eventDate = new Date(date);
  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  });
  return formatter.format(eventDate);
}

// Send confirmation email with iCalendar attachment
export async function sendConfirmationEmail(
  event: EventConfig,
  registration: Registration,
): Promise<boolean> {
  const { attendee } = registration;
  const icalContent = generateICalendar(event, attendee);

  const formattedDate = formatEventDate(event.date, event.timezone);

  const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			line-height: 1.6;
			color: #333;
			max-width: 600px;
			margin: 0 auto;
			padding: 20px;
		}
		.header {
			background: linear-gradient(135deg, #2563eb 0%, #10b981 100%);
			color: white;
			padding: 30px 20px;
			text-align: center;
			border-radius: 8px 8px 0 0;
		}
		.header h1 {
			margin: 0;
			font-size: 24px;
		}
		.content {
			background: #ffffff;
			padding: 30px 20px;
			border: 1px solid #e5e7eb;
			border-top: none;
		}
		.event-details {
			background: #f3f4f6;
			padding: 20px;
			border-radius: 8px;
			margin: 20px 0;
		}
		.event-details h2 {
			margin-top: 0;
			color: #1f2937;
			font-size: 20px;
		}
		.detail-row {
			margin: 10px 0;
			padding: 8px 0;
			border-bottom: 1px solid #e5e7eb;
		}
		.detail-row:last-child {
			border-bottom: none;
		}
		.detail-label {
			font-weight: 600;
			color: #374151;
			margin-right: 8px;
		}
		.meeting-link {
			display: inline-block;
			background: #2563eb;
			color: white;
			padding: 12px 24px;
			text-decoration: none;
			border-radius: 6px;
			margin: 20px 0;
			font-weight: 600;
		}
		.topics {
			margin: 20px 0;
		}
		.topics ul {
			list-style: none;
			padding: 0;
		}
		.topics li {
			padding: 8px 0;
			border-bottom: 1px solid #e5e7eb;
		}
		.topics li:last-child {
			border-bottom: none;
		}
		.footer {
			background: #f9fafb;
			padding: 20px;
			text-align: center;
			font-size: 14px;
			color: #6b7280;
			border-radius: 0 0 8px 8px;
			border: 1px solid #e5e7eb;
			border-top: none;
		}
	</style>
</head>
<body>
	<div class="header">
		<h1>✅ You're Registered!</h1>
	</div>
	
	<div class="content">
		<p>Hi ${attendee.firstName},</p>
		
		<p>Thank you for registering for <strong>${event.title}</strong>${
    event.presentedBy ? ` with ${event.presentedBy}` : ""
  }. We're looking forward to having you join the discussion!</p>
		
		<div class="event-details">
			<h2>Event Details</h2>
			<div class="detail-row">
				<span class="detail-label">Date & Time:</span>
				<span>${formattedDate}</span>
			</div>
			<div class="detail-row">
				<span class="detail-label">Duration:</span>
				<span>${event.duration} minutes</span>
			</div>
			<div class="detail-row">
				<span class="detail-label">Format:</span>
				<span>Online via Google Meet</span>
			</div>
			${
    event.presentedBy
      ? `<div class="detail-row">
				<span class="detail-label">Presented by:</span>
				<span>${event.presentedBy}</span>
			</div>`
      : ""
  }
		</div>
		
		<p style="text-align: center;">
			<a href="${event.meetingLink}" class="meeting-link">Join Google Meet</a>
		</p>
		
		<p><strong>What We'll Discuss:</strong></p>
		<div class="topics">
			<ul>
				${
    event.topics?.map((topic) => `<li>${topic}</li>`).join("\n\t\t\t\t") || ""
  }
			</ul>
		</div>
		
		<p><strong>Calendar Reminder:</strong> An iCalendar (.ics) file is attached to this email. You can open it to add this event to your calendar application (Google Calendar, Outlook, Apple Calendar, etc.).</p>
		
		<p>We'll send you a reminder 24 hours before the event with the meeting link.</p>
		
		<p>See you there!</p>
	</div>
	
	<div class="footer">
		<p>Future Together<br>
		<a href="https://futuretogether.community" style="color: #2563eb;">futuretogether.community</a></p>
		<p style="font-size: 12px; margin-top: 16px;">If you need to cancel your registration, please reply to this email.</p>
	</div>
</body>
</html>
	`;

  const text = `
Hi ${attendee.firstName},

Thank you for registering for ${event.title}. We're looking forward to having you join the discussion!

Event Details:
- Date & Time: ${formattedDate}
- Duration: ${event.duration} minutes
- Format: Online via Google Meet
- Meeting Link: ${event.meetingLink}

What We'll Discuss:
${event.topics?.map((topic) => `- ${topic}`).join("\n") || ""}

An iCalendar (.ics) file is attached to this email. You can open it to add this event to your calendar.

We'll send you a reminder 24 hours before the event.

See you there!

Future Together
https://futuretogether.community

If you need to cancel your registration, please reply to this email.
	`;

  // Encode iCalendar content to base64 using Deno's native APIs
  const encoder = new TextEncoder();
  const icalBytes = encoder.encode(icalContent);
  const base64Content = btoa(String.fromCharCode(...icalBytes));

  return await sendEmail({
    to: attendee.email,
    subject: `Confirmed: ${event.title} - ${formattedDate}`,
    html,
    text,
    attachments: [{
      filename: "event.ics",
      content: base64Content,
      type: "text/calendar",
    }],
  });
}

// Send reminder email (24 hours before or 1 hour before)
export async function sendReminderEmail(
  event: EventConfig,
  registration: Registration,
  reminderType: "day_before" | "hour_before",
): Promise<boolean> {
  const { attendee } = registration;
  const formattedDate = formatEventDate(event.date, event.timezone);
  const timeUntil = reminderType === "day_before" ? "24 hours" : "1 hour";

  const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			line-height: 1.6;
			color: #333;
			max-width: 600px;
			margin: 0 auto;
			padding: 20px;
		}
		.header {
			background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
			color: white;
			padding: 30px 20px;
			text-align: center;
			border-radius: 8px 8px 0 0;
		}
		.header h1 {
			margin: 0;
			font-size: 24px;
		}
		.content {
			background: #ffffff;
			padding: 30px 20px;
			border: 1px solid #e5e7eb;
			border-top: none;
		}
		.meeting-link {
			display: inline-block;
			background: #2563eb;
			color: white;
			padding: 12px 24px;
			text-decoration: none;
			border-radius: 6px;
			margin: 20px 0;
			font-weight: 600;
		}
		.footer {
			background: #f9fafb;
			padding: 20px;
			text-align: center;
			font-size: 14px;
			color: #6b7280;
			border-radius: 0 0 8px 8px;
			border: 1px solid #e5e7eb;
			border-top: none;
		}
	</style>
</head>
<body>
	<div class="header">
		<h1>⏰ Reminder: Event Starting Soon!</h1>
	</div>
	
	<div class="content">
		<p>Hi ${attendee.firstName},</p>
		
		<p>This is a friendly reminder that <strong>${event.title}</strong> is starting in ${timeUntil}!</p>
		
		<p><strong>When:</strong> ${formattedDate}</p>
		
		<p style="text-align: center;">
			<a href="${event.meetingLink}" class="meeting-link">Join Google Meet</a>
		</p>
		
		<p>We're looking forward to seeing you there!</p>
	</div>
	
	<div class="footer">
		<p>Future Together<br>
		<a href="https://futuretogether.community" style="color: #2563eb;">futuretogether.community</a></p>
	</div>
</body>
</html>
	`;

  const text = `
Hi ${attendee.firstName},

This is a friendly reminder that ${event.title} is starting in ${timeUntil}!

When: ${formattedDate}
Meeting Link: ${event.meetingLink}

We're looking forward to seeing you there!

Future Together
https://futuretogether.community
	`;

  return await sendEmail({
    to: attendee.email,
    subject: `Reminder: ${event.title} in ${timeUntil}`,
    html,
    text,
  });
}
