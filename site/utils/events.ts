import { parse as parseYaml } from '@std/yaml';

/**
 * EVENT SYSTEM ARCHITECTURE
 * 
 * Similar to blog system:
 * - YAML config files in /events/ directory
 * - Loaded into Deno.KV on startup via middleware
 * - Support multiple date instances per event type
 * - Auto-switch to next available event based on capacity/deadline
 */

// KV store singleton
let kvInstance: Deno.Kv | null = null;

const EVENTS_DIR = './events';

// Get or initialize KV store
async function getKv(): Promise<Deno.Kv> {
	if (!kvInstance) {
		const kvPath = Deno.env.get('FT_EVENTS_KV_PATH');
		// Note: Deno.openKv() path parameter support varies by platform
		// In production (Deno Deploy), it's typically ignored
		kvInstance = kvPath ? await Deno.openKv(kvPath) : await Deno.openKv();
	}
	return kvInstance;
}

// Event configuration interface
export interface EventConfig {
	id: string; // "discuss-our-future-2025-01-21"
	slug: string; // "discuss-our-future"
	title: string;
	description: string;
	date: string; // ISO 8601 **without** timezone
	timezone: string; // "Australia/Sydney"
	duration: number; // minutes
	capacity: number;
	registrationDeadline: number; // hours before event
	meetingLink: string;
	posterImage: string;
	isActive: boolean;
	topics?: string[];
	presentedBy?: string; // Person/people presenting (e.g., "Charlie Garrison")
	sponsoredBy?: string; // Organization hosting (e.g., "Beyond Better")
}

// Registration data interface
export interface Registration {
	id: string;
	eventId: string;
	timestamp: string;
	attendee: {
		firstName: string;
		lastName: string;
		email: string;
	};
	engagement?: {
		interests?: string;
		heardFrom?: string;
	};
	status: 'registered' | 'cancelled' | 'attended';
	remindersSent: {
		confirmation: boolean;
		day_before: boolean;
		hour_before: boolean;
	};
}

// Initialize or reset the event cache
export async function initializeEventCache() {
	console.log('events.ts: Starting event cache initialization');
	const kv = await getKv();

	// Clear all event indexes
	const eventsToDelete = kv.list({ prefix: ['event'] });
	for await (const entry of eventsToDelete) {
		await kv.delete(entry.key);
	}

	const slugsToDelete = kv.list({ prefix: ['event_slug'] });
	for await (const entry of slugsToDelete) {
		await kv.delete(entry.key);
	}

	// Load all event configs into KV
	try {
		for await (const entry of Deno.readDir(EVENTS_DIR)) {
			if (!entry.isFile || !entry.name.endsWith('.yaml')) continue;
			await cacheEvent(entry.name);
		}
	} catch (error) {
		console.error('Error reading events directory:', error);
	}

	console.log('events.ts: Event cache initialization complete');
}

// Cache a single event configuration
async function cacheEvent(filename: string) {
	try {
		const content = await Deno.readTextFile(`${EVENTS_DIR}/${filename}`);
		const config = parseYaml(content) as EventConfig;
		
		// Ensure date is a string for consistent handling
		if (config.date && typeof config.date !== 'string') {
			config.date = (config.date as unknown as Date).toISOString();
		}

		if (!config.id || !config.slug || !config.date) {
			console.error(`Invalid event config: ${filename}`);
			return;
		}

		const kv = await getKv();
		const atomic = kv.atomic();

		// Store event by ID
		atomic.set(['event', config.id], config);

		// Store event ID under slug for lookup
		// Multiple dates can share the same slug
		atomic.set(['event_slug', config.slug, config.id], config.id);

		await atomic.commit();
		console.log(`Cached event: ${config.id}`);
	} catch (error) {
		console.error(`Error caching event ${filename}:`, error);
	}
}

// Get event by ID
export async function getEventById(id: string): Promise<EventConfig | null> {
	const kv = await getKv();
	const result = await kv.get<EventConfig>(['event', id]);
	return result.value;
}

// Get all events for a given slug, sorted by date
export async function getEventsBySlug(slug: string): Promise<EventConfig[]> {
	const kv = await getKv();
	const events: EventConfig[] = [];

	// List all event IDs for this slug
	const iter = kv.list<string>({ prefix: ['event_slug', slug] });

	for await (const { value: eventId } of iter) {
		const event = await getEventById(eventId);
		if (event) {
			events.push(event);
		}
	}

	// Sort by date (earliest first)
	return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Get the next available event for a slug
// Considers: active status, date (future), deadline, capacity
export async function getNextAvailableEvent(
	slug: string,
): Promise<EventConfig | null> {
	const events = await getEventsBySlug(slug);
	const now = new Date();

	for (const event of events) {
		if (!event.isActive) continue;

		const eventDate = new Date(event.date);
		const deadlineDate = new Date(
			eventDate.getTime() - event.registrationDeadline * 60 * 60 * 1000,
		);

		// Check if event is in the future and before deadline
		if (now < deadlineDate) {
			// Check capacity
			const registrationCount = await getRegistrationCount(event.id);
			if (registrationCount < event.capacity) {
				return event;
			}
		}
	}

	return null;
}

// Get all events (for admin dashboard)
export async function getAllEvents(): Promise<EventConfig[]> {
	const kv = await getKv();
	const events: EventConfig[] = [];

	const iter = kv.list<EventConfig>({ prefix: ['event'] });

	for await (const { value: event } of iter) {
		events.push(event);
	}

	// Sort by date (most recent first for admin view)
	return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Registration Management

// Create a new registration
export async function createRegistration(
	eventId: string,
	attendeeData: {
		firstName: string;
		lastName: string;
		email: string;
		interests?: string;
		heardFrom?: string;
	},
): Promise<{ success: boolean; registration?: Registration; error?: string }> {
	const kv = await getKv();

	// Check if event exists and is available
	const event = await getEventById(eventId);
	if (!event) {
		return { success: false, error: 'Event not found' };
	}

	if (!event.isActive) {
		return { success: false, error: 'Event is not active' };
	}

	// Check deadline
	const now = new Date();
	const eventDate = new Date(event.date);
	const deadlineDate = new Date(
		eventDate.getTime() - event.registrationDeadline * 60 * 60 * 1000,
	);

	if (now >= deadlineDate) {
		return { success: false, error: 'Registration deadline has passed' };
	}

	// Check capacity by counting active registrations
	const activeRegistrations = await getActiveRegistrationCount(eventId);

	if (activeRegistrations >= event.capacity) {
		return { success: false, error: 'Event is at capacity' };
	}

	// Check for duplicate email
	const emailKey = ['registration_email', eventId, attendeeData.email.toLowerCase()];
	const existingReg = await kv.get(emailKey);

	if (existingReg.value) {
		return { success: false, error: 'Email already registered for this event' };
	}

	// Create registration
	const registrationId = crypto.randomUUID();
	const registration: Registration = {
		id: registrationId,
		eventId,
		timestamp: new Date().toISOString(),
		attendee: {
			firstName: attendeeData.firstName,
			lastName: attendeeData.lastName,
			email: attendeeData.email.toLowerCase(),
		},
		engagement: {
			interests: attendeeData.interests,
			heardFrom: attendeeData.heardFrom,
		},
		status: 'registered',
		remindersSent: {
			confirmation: false,
			day_before: false,
			hour_before: false,
		},
	};

	// Atomic operation: store registration and index by email
	const atomic = kv.atomic()
		.set(['registration', eventId, registrationId], registration)
		.set(emailKey, registrationId);

	const result = await atomic.commit();

	if (!result.ok) {
		return { success: false, error: 'Registration failed - event may be full' };
	}

	return { success: true, registration };
}

// Get total registration count for an event (includes all statuses)
export async function getRegistrationCount(eventId: string): Promise<number> {
	const registrations = await getEventRegistrations(eventId);
	return registrations.length;
}

// Get active (non-cancelled) registration count for an event
export async function getActiveRegistrationCount(eventId: string): Promise<number> {
	const registrations = await getEventRegistrations(eventId);
	return registrations.filter((r) => r.status === 'registered').length;
}

// Get all registrations for an event
export async function getEventRegistrations(
	eventId: string,
): Promise<Registration[]> {
	const kv = await getKv();
	const registrations: Registration[] = [];

	const iter = kv.list<Registration>({ prefix: ['registration', eventId] });

	for await (const { value: registration } of iter) {
		registrations.push(registration);
	}

	// Sort by timestamp (most recent first)
	return registrations.sort(
		(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
	);
}

// Get registration by ID
export async function getRegistrationById(
	eventId: string,
	registrationId: string,
): Promise<Registration | null> {
	const kv = await getKv();
	const result = await kv.get<Registration>([
		'registration',
		eventId,
		registrationId,
	]);
	return result.value;
}

// Cancel a registration
export async function cancelRegistration(
	eventId: string,
	registrationId: string,
): Promise<{ success: boolean; error?: string }> {
	const kv = await getKv();
	const registration = await getRegistrationById(eventId, registrationId);

	if (!registration) {
		return { success: false, error: 'Registration not found' };
	}

	if (registration.status === 'cancelled') {
		return { success: false, error: 'Registration already cancelled' };
	}

	// Update registration status to cancelled
	registration.status = 'cancelled';

	const result = await kv.set(
		['registration', eventId, registrationId],
		registration,
	);

	if (!result.ok) {
		return { success: false, error: 'Failed to cancel registration' };
	}

	return { success: true };
}

// Update registration reminder status
export async function updateReminderSent(
	eventId: string,
	registrationId: string,
	reminderType: 'confirmation' | 'day_before' | 'hour_before',
): Promise<boolean> {
	const kv = await getKv();
	const registration = await getRegistrationById(eventId, registrationId);

	if (!registration) return false;

	registration.remindersSent[reminderType] = true;

	const result = await kv.set(
		['registration', eventId, registrationId],
		registration,
	);
	return result.ok;
}

// Get registrations needing reminders
export async function getRegistrationsNeedingReminder(
	reminderType: 'day_before' | 'hour_before',
): Promise<Array<{ event: EventConfig; registration: Registration }>> {
	const kv = await getKv();
	const results: Array<{ event: EventConfig; registration: Registration }> = [];

	// Get all active events
	const events = await getAllEvents();
	const now = new Date();

	for (const event of events) {
		if (!event.isActive) continue;

		const eventDate = new Date(event.date);
		const hoursBefore = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

		// Check if it's time for this reminder type
		let shouldSend = false;
		if (reminderType === 'day_before' && hoursBefore <= 24 && hoursBefore > 23) {
			shouldSend = true;
		} else if (
			reminderType === 'hour_before' && hoursBefore <= 1 && hoursBefore > 0.5
		) {
			shouldSend = true;
		}

		if (!shouldSend) continue;

		// Get registrations that haven't received this reminder
		const registrations = await getEventRegistrations(event.id);
		for (const registration of registrations) {
			if (
				registration.status === 'registered' &&
				!registration.remindersSent[reminderType]
			) {
				results.push({ event, registration });
			}
		}
	}

	return results;
}