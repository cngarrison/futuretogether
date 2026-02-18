import { define } from "../../../../../utils.ts";
import { getEventById, getEventRegistrations, getNextAvailableEvent } from '../../../../../utils/events.ts';

export const handlers = define.handlers({
	async GET( ctx) {
		try {
			const { eventSlug } = ctx.params;
			const url = new URL(ctx.req.url);
			const eventId = url.searchParams.get('eventId');

			// Get event
			let event = null;
			if (eventId) {
				event = await getEventById(eventId);
			} else {
				event = await getNextAvailableEvent(eventSlug);
			}

			if (!event) {
				return new Response('Event not found', { status: 404 });
			}

			// Get registrations
			const registrations = await getEventRegistrations(event.id);

			// Generate CSV
			const headers = [
				'First Name',
				'Last Name',
				'Email',
				'Interests',
				'Heard From',
				'Status',
				'Registered At',
				'Confirmation Sent',
				'Reminder Day Before',
				'Reminder Hour Before',
			];

			const escapeCSV = (value: string | undefined): string => {
				if (!value) return '';
				if (value.includes(',') || value.includes('"') || value.includes('\n')) {
					return `"${value.replace(/"/g, '""')}"`;
				}
				return value;
			};

			const rows = registrations.map((reg) => [
				escapeCSV(reg.attendee.firstName),
				escapeCSV(reg.attendee.lastName),
				escapeCSV(reg.attendee.email),
				escapeCSV(reg.engagement?.interests),
				escapeCSV(reg.engagement?.heardFrom),
				escapeCSV(reg.status),
				escapeCSV(reg.timestamp),
				reg.remindersSent.confirmation ? 'Yes' : 'No',
				reg.remindersSent.day_before ? 'Yes' : 'No',
				reg.remindersSent.hour_before ? 'Yes' : 'No',
			]);

			const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

			// Set headers for CSV download
			const responseHeaders = new Headers({
				'Content-Type': 'text/csv',
				'Content-Disposition': `attachment; filename="${event.slug}-registrations.csv"`,
			});

			return new Response(csv, { headers: responseHeaders });
		} catch (error) {
			console.error('Error generating CSV:', error);
			return new Response('Failed to generate CSV file', { status: 500 });
		}
	},
};