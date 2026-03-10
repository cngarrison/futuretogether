import {
  getRegistrationsNeedingReminder,
  updateReminderSent,
} from "@/utils/events.ts";
import { sendReminderEmail } from "@/utils/eventEmail.ts";

/**
 * Fetches registrations needing a reminder of the given type, sends each
 * reminder email, and marks it as sent in KV.
 *
 * Called by Deno.cron() in main.ts — not via HTTP.
 */
export async function sendReminders(
  type: "day_before" | "hour_before",
): Promise<void> {
  const registrations = await getRegistrationsNeedingReminder(type);
  console.log(`[cron] ${type}: registrations=${registrations}`);

  if (registrations.length === 0) return;

  const results = await Promise.allSettled(
    registrations.map(async ({ event, registration }) => {
      const sent = await sendReminderEmail(event, registration, type);
      if (sent) await updateReminderSent(event.id, registration.id, type);
      return { sent, email: registration.attendee.email };
    }),
  );

  const sent = results.filter((r) => r.status === "fulfilled" && r.value.sent)
    .length;
  const failed = results.length - sent;
  console.log(`[cron] ${type}: sent=${sent} failed=${failed}`);
}
