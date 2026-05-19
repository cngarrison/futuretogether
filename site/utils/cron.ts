import {
  getRegistrationsNeedingReminder,
  hasOrganizerReminderBeenSent,
  updateOrganizerReminderSent,
  updateReminderSent,
} from "@/utils/events.ts";
import {
  sendOrganizerReminderEmail,
  sendReminderEmail,
} from "@/utils/eventEmail.ts";

/**
 * Fetches registrations needing a reminder of the given type, sends each
 * reminder email, and marks it as sent in KV.
 *
 * Called by Deno.cron() in main.ts — not via HTTP.
 */
export async function sendReminders(
  type: "day_before" | "hour_before",
): Promise<void> {
  const { events, registrations } = await getRegistrationsNeedingReminder(type);
  console.log(
    `[cron] ${type}: events=${events.length} registrations=${registrations.length}`,
  );

  // --- Attendee reminder emails ---
  if (registrations.length > 0) {
    const attendeeResults = await Promise.allSettled(
      registrations.map(async ({ event, registration }) => {
        const sent = await sendReminderEmail(event, registration, type);
        if (sent) await updateReminderSent(event.id, registration.id, type);
        return { sent, email: registration.attendee.email };
      }),
    );

    const sent = attendeeResults.filter(
      (r) => r.status === "fulfilled" && r.value.sent,
    ).length;
    const failed = attendeeResults.length - sent;
    console.log(`[cron] ${type}: attendee sent=${sent} failed=${failed}`);
  }

  // --- Organiser reminder emails ---
  // Build a map of eventId → registrations for that event
  const regsByEvent = new Map<string, typeof registrations[number]["registration"][]>();
  for (const { event, registration } of registrations) {
    const list = regsByEvent.get(event.id) ?? [];
    list.push(registration);
    regsByEvent.set(event.id, list);
  }

  const organiserResults = await Promise.allSettled(
    events
      .filter((event) => !!event.organizer?.email)
      .map(async (event) => {
        const alreadySent = await hasOrganizerReminderBeenSent(event.id, type);
        if (alreadySent) return { sent: false, organizer: event.organizer!.email, skipped: true };
        const regsForEvent = regsByEvent.get(event.id) ?? [];
        const sent = await sendOrganizerReminderEmail(event, regsForEvent, type);
        if (sent) await updateOrganizerReminderSent(event.id, type);
        return { sent, organizer: event.organizer!.email, skipped: false };
      }),
  );

  const orgSent = organiserResults.filter((r) => r.status === "fulfilled" && r.value.sent).length;
  const orgSkipped = organiserResults.filter((r) => r.status === "fulfilled" && r.value.skipped).length;
  const orgFailed = organiserResults.length - orgSent - orgSkipped;
  console.log(`[cron] ${type}: organiser sent=${orgSent} skipped=${orgSkipped} failed=${orgFailed}`);
}
