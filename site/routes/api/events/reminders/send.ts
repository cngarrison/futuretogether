import { Handlers } from '$fresh/server.ts';
import { getRegistrationsNeedingReminder, updateReminderSent } from '../../../../utils/events.ts';
import { sendReminderEmail } from '../../../../utils/eventEmail.ts';

/**
 * API endpoint for sending event reminders
 * Should be called by cron job on server
 * 
 * Examples:
 * - 24 hours before: curl -X POST https://futuretogether.community/api/events/reminders/send?type=day_before
 * - 1 hour before: curl -X POST https://futuretogether.community/api/events/reminders/send?type=hour_before
 * 
 * Cron setup:
 * # Send day-before reminders daily at 9am
 * 0 9 * * * curl -X POST https://futuretogether.community/api/events/reminders/send?type=day_before
 * 
 * # Send hour-before reminders every hour
 * 0 * * * * curl -X POST https://futuretogether.community/api/events/reminders/send?type=hour_before
 */
export const handler: Handlers = {
	async POST(req) {
		try {
			const url = new URL(req.url);
			const type = url.searchParams.get('type') as 'day_before' | 'hour_before';

			if (!type || !['day_before', 'hour_before'].includes(type)) {
				return new Response(
					JSON.stringify({ error: 'Invalid reminder type. Use day_before or hour_before' }),
					{ status: 400, headers: { 'Content-Type': 'application/json' } },
				);
			}

			// Get registrations needing this reminder
			const registrations = await getRegistrationsNeedingReminder(type);

			if (registrations.length === 0) {
				return new Response(
					JSON.stringify({
						success: true,
						message: 'No reminders to send',
						count: 0,
					}),
					{ status: 200, headers: { 'Content-Type': 'application/json' } },
				);
			}

			// Send reminders
			const results = await Promise.allSettled(
				registrations.map(async ({ event, registration }) => {
					const sent = await sendReminderEmail(event, registration, type);
					if (sent) {
						await updateReminderSent(event.id, registration.id, type);
					}
					return { sent, email: registration.attendee.email };
				}),
			);

			const sent = results.filter((r) => r.status === 'fulfilled' && r.value.sent).length;
			const failed = results.length - sent;

			return new Response(
				JSON.stringify({
					success: true,
					message: `Sent ${sent} reminders, ${failed} failed`,
					total: registrations.length,
					sent,
					failed,
				}),
				{ status: 200, headers: { 'Content-Type': 'application/json' } },
			);
		} catch (error) {
			console.error('Error sending reminders:', error);
			return new Response(
				JSON.stringify({ error: 'Internal server error' }),
				{ status: 500, headers: { 'Content-Type': 'application/json' } },
			);
		}
	},
};