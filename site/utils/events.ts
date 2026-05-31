import { parse as parseYaml } from "@std/yaml";
import { marked } from "marked";
import { mangle } from "marked-mangle";
import { gfmHeadingId } from "marked-gfm-heading-id";
import { markedSmartypants } from "marked-smartypants";
import { getKv } from "./kv.ts";

/**
 * EVENT SYSTEM ARCHITECTURE
 *
 * Event configs (YAML files) are loaded into an in-memory Map on first use.
 * This is fast (~1ms, local filesystem reads) and avoids unnecessary KV
 * round trips for static data that doesn't change between deploys.
 *
 * A promise lock ensures concurrent requests during cold start all await
 * the same single load operation, rather than racing to build the cache.
 *
 * The "next available event" per slug is stored in KV as a single pointer
 * (the event ID). This means page renders cost 1 KV read instead of N.
 * The pointer is refreshed after every registration and cancellation.
 *
 * Deno KV is used for:
 *   - Registrations (mutable runtime data)
 *   - next_event_id pointer per slug (updated on registration/cancellation)
 */

const EVENTS_DIR = "./data/events";

// KV key prefix for the cached next-available event ID per slug.
const NEXT_EVENT_KEY = "next_event_id";

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
  posterImage?: string; // Optional event poster or infographic
  supportingImages?: string[]; // Optional additional charts or graphics shown in the body
  slideshowUrl?: string; // Optional link to post-event slideshow/resources
  isActive: boolean;
  topics?: string[];
  presentedBy?: string; // Person/people presenting (e.g., "Charlie Garrison")
  organizer?: { name: string; email: string }; // Organiser contact for reminder emails
  sponsoredBy?: string; // Organization hosting (e.g., "Beyond Better")
  moreInfoFile?: string; // Filename (without extension) of the more-info markdown file
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
  status: "registered" | "cancelled" | "attended";
  remindersSent: {
    confirmation: boolean;
    day_before: boolean;
    hour_before: boolean;
  };
}

// ---------------------------------------------------------------------------
// In-memory event config cache
// ---------------------------------------------------------------------------

let eventCache: Map<string, EventConfig> | null = null;
// Promise lock: all concurrent callers await the same load operation.
// Prevents partial/empty cache being returned during cold-start races.
let cachePromise: Promise<Map<string, EventConfig>> | null = null;

/**
 * Returns the in-memory event cache, loading from YAML files if needed.
 * Safe to call concurrently — all callers share a single load promise and
 * only read from disk once per isolate lifetime.
 */
async function getEventCache(): Promise<Map<string, EventConfig>> {
  if (eventCache) return eventCache;
  if (!cachePromise) cachePromise = loadEventCache();
  return cachePromise;
}

async function loadEventCache(): Promise<Map<string, EventConfig>> {
  const cache = new Map<string, EventConfig>();

  try {
    for await (const entry of Deno.readDir(EVENTS_DIR)) {
      if (!entry.isFile || !entry.name.endsWith(".yaml")) continue;
      try {
        const content = await Deno.readTextFile(
          `${EVENTS_DIR}/${entry.name}`,
        );
        const config = parseYaml(content) as EventConfig;

        // Ensure date is a string for consistent handling
        if (config.date && typeof config.date !== "string") {
          config.date = (config.date as unknown as Date).toISOString();
        }

        if (!config.id || !config.slug || !config.date) {
          console.error(`Invalid event config: ${entry.name}`);
          continue;
        }

        cache.set(config.id, config);
      } catch (err) {
        console.error(`Error loading event ${entry.name}:`, err);
      }
    }
  } catch (error) {
    console.error("Error reading events directory:", error);
  }

  // Only assign to the module-level ref once fully built.
  // Subsequent calls hit the fast path before reaching the promise check.
  eventCache = cache;
  return cache;
}

// ---------------------------------------------------------------------------
// Public read API (event configs — from memory)
// ---------------------------------------------------------------------------

// Get event by ID
export async function getEventById(id: string): Promise<EventConfig | null> {
  const cache = await getEventCache();
  return cache.get(id) ?? null;
}

// Get all events for a given slug, sorted by date (earliest first)
export async function getEventsBySlug(slug: string): Promise<EventConfig[]> {
  const cache = await getEventCache();
  const events: EventConfig[] = [];

  for (const event of cache.values()) {
    if (event.slug === slug) events.push(event);
  }

  return events.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

// Get all events (for admin dashboard), sorted by date (most recent first)
export async function getAllEvents(): Promise<EventConfig[]> {
  const cache = await getEventCache();
  const events = [...cache.values()];
  return events.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

// Get all upcoming events for slugs OTHER than the recurring one (special/one-off events),
// sorted by date ascending (soonest first).
export async function getUpcomingSpecialEvents(
  excludeSlug = "discuss-our-future",
): Promise<EventConfig[]> {
  const cache = await getEventCache();
  const now = new Date();
  const events: EventConfig[] = [];

  for (const event of cache.values()) {
    if (event.slug === excludeSlug) continue;
    const eventDate = new Date(event.date);
    if (eventDate > now) events.push(event);
  }

  return events.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

// Get all past special (non-recurring) events, sorted newest first.
export async function getPastSpecialEvents(
  excludeSlug = "discuss-our-future",
): Promise<EventConfig[]> {
  const cache = await getEventCache();
  const now = new Date();
  const events: EventConfig[] = [];

  for (const event of cache.values()) {
    if (event.slug === excludeSlug) continue;
    const eventDate = new Date(event.date);
    if (eventDate <= now) events.push(event);
  }

  return events.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

// Get past recurring events for a given slug, limited to the most recent N.
// Also returns the total count and earliest date for a "...plus N more since" note.
export async function getPastRecurringEvents(
  slug: string,
  limit = 3,
): Promise<
  { events: EventConfig[]; total: number; earliestDate: string | null }
> {
  const cache = await getEventCache();
  const now = new Date();
  const all: EventConfig[] = [];

  for (const event of cache.values()) {
    if (event.slug !== slug) continue;
    const eventDate = new Date(event.date);
    if (eventDate <= now) all.push(event);
  }

  // Sort newest first so slice(0, limit) gives the most recent N
  all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    events: all.slice(0, limit),
    total: all.length,
    earliestDate: all.length > 0 ? all[all.length - 1].date : null,
  };
}

// ---------------------------------------------------------------------------
// Next available event — KV pointer approach
// ---------------------------------------------------------------------------

/**
 * Recomputes and stores the next available event ID for a slug in KV.
 * Runs a full capacity scan (N KV reads) but is only called after a
 * registration or cancellation — never on a page render.
 */
async function refreshNextEventId(slug: string): Promise<void> {
  const kv = await getKv();
  const events = await getEventsBySlug(slug);
  const now = new Date();

  for (const event of events) {
    if (!event.isActive) continue;

    const eventDate = new Date(event.date);
    const deadlineDate = new Date(
      eventDate.getTime() - event.registrationDeadline * 60 * 60 * 1000,
    );
    if (now >= deadlineDate) continue;

    const count = await getActiveRegistrationCount(event.id);
    if (count < event.capacity) {
      await kv.set([NEXT_EVENT_KEY, slug], event.id);
      return;
    }
  }

  // No available event found — clear the pointer
  await kv.delete([NEXT_EVENT_KEY, slug]);
}

/**
 * Returns the next available (active, future, under-capacity) event for a slug.
 *
 * Uses a KV pointer for O(1) page render cost: 1 KV read + 1 memory lookup.
 * On first call (pointer not yet set), falls back to a full scan to seed the
 * pointer — this only happens once per slug per fresh deploy.
 *
 * Use this everywhere you need to display or check the next available event.
 */
export async function getNextAvailableEvent(
  slug: string,
): Promise<EventConfig | null> {
  const kv = await getKv();
  const result = await kv.get<string>([NEXT_EVENT_KEY, slug]);

  if (result.value) {
    const event = await getEventById(result.value);
    if (event) {
      // Validate the cached pointer is still usable — the deadline may have
      // passed since the pointer was last written (e.g. no registrations
      // occurred near the end of the window to trigger a refresh).
      const now = new Date();
      const eventDate = new Date(event.date);
      const deadlineDate = new Date(
        eventDate.getTime() - event.registrationDeadline * 60 * 60 * 1000,
      );
      if (event.isActive && now < deadlineDate) {
        return event;
      }
      // Cached event is stale — fall through to refresh the pointer.
    }
  }

  // Pointer not set (fresh deploy or first request) OR stale (deadline passed
  // without a registration to trigger a refresh) — recompute and cache it.
  await refreshNextEventId(slug);
  const refreshed = await kv.get<string>([NEXT_EVENT_KEY, slug]);
  return refreshed.value ? getEventById(refreshed.value) : null;
}

/**
 * @deprecated Use getNextAvailableEvent — it now uses a KV pointer
 * and is equally fast. This alias is retained for any remaining callers.
 */
export const getNextEvent = getNextAvailableEvent;

// ---------------------------------------------------------------------------
// Registration Management (KV — runtime-mutable data)
// ---------------------------------------------------------------------------

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
    return { success: false, error: "Event not found" };
  }

  if (!event.isActive) {
    return { success: false, error: "Event is not active" };
  }

  // Check deadline
  const now = new Date();
  const eventDate = new Date(event.date);
  const deadlineDate = new Date(
    eventDate.getTime() - event.registrationDeadline * 60 * 60 * 1000,
  );

  if (now >= deadlineDate) {
    return { success: false, error: "Registration deadline has passed" };
  }

  // Check capacity by counting active registrations
  const activeRegistrations = await getActiveRegistrationCount(eventId);

  if (activeRegistrations >= event.capacity) {
    return { success: false, error: "Event is at capacity" };
  }

  // Check for duplicate email
  const emailKey = [
    "registration_email",
    eventId,
    attendeeData.email.toLowerCase(),
  ];
  const existingReg = await kv.get(emailKey);

  if (existingReg.value) {
    return { success: false, error: "Email already registered for this event" };
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
    status: "registered",
    remindersSent: {
      confirmation: false,
      day_before: false,
      hour_before: false,
    },
  };

  // Atomic operation: store registration and index by email
  const atomic = kv.atomic()
    .set(["registration", eventId, registrationId], registration)
    .set(emailKey, registrationId);

  const result = await atomic.commit();

  if (!result.ok) {
    return { success: false, error: "Registration failed - event may be full" };
  }

  // Refresh the next-available pointer in the background.
  // Don't await — this runs after the response is returned.
  void refreshNextEventId(event.slug);

  return { success: true, registration };
}

// Get total registration count for an event (includes all statuses)
export async function getRegistrationCount(eventId: string): Promise<number> {
  const registrations = await getEventRegistrations(eventId);
  return registrations.length;
}

// Get active (non-cancelled) registration count for an event
export async function getActiveRegistrationCount(
  eventId: string,
): Promise<number> {
  const registrations = await getEventRegistrations(eventId);
  return registrations.filter((r) => r.status === "registered").length;
}

// Get all registrations for an event
export async function getEventRegistrations(
  eventId: string,
): Promise<Registration[]> {
  const kv = await getKv();
  const registrations: Registration[] = [];

  const iter = kv.list<Registration>({ prefix: ["registration", eventId] });

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
    "registration",
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
    return { success: false, error: "Registration not found" };
  }

  if (registration.status === "cancelled") {
    return { success: false, error: "Registration already cancelled" };
  }

  // Update registration status to cancelled
  registration.status = "cancelled";

  const result = await kv.set(
    ["registration", eventId, registrationId],
    registration,
  );

  if (!result.ok) {
    return { success: false, error: "Failed to cancel registration" };
  }

  // A cancellation may free up capacity — refresh the pointer in the background.
  const event = await getEventById(eventId);
  if (event) void refreshNextEventId(event.slug);

  return { success: true };
}

// Update registration reminder status
export async function updateReminderSent(
  eventId: string,
  registrationId: string,
  reminderType: "confirmation" | "day_before" | "hour_before",
): Promise<boolean> {
  const kv = await getKv();
  const registration = await getRegistrationById(eventId, registrationId);

  if (!registration) return false;

  registration.remindersSent[reminderType] = true;

  const result = await kv.set(
    ["registration", eventId, registrationId],
    registration,
  );
  return result.ok;
}

/**
 * Returns true if an organiser reminder of the given type has already been
 * sent for this event. Keyed separately from per-registration reminders.
 */
export async function hasOrganizerReminderBeenSent(
  eventId: string,
  reminderType: "day_before" | "hour_before",
): Promise<boolean> {
  const kv = await getKv();
  const result = await kv.get<boolean>(["organiser_reminder", eventId, reminderType]);
  return result.value === true;
}

/**
 * Marks the organiser reminder of the given type as sent for this event.
 */
export async function updateOrganizerReminderSent(
  eventId: string,
  reminderType: "day_before" | "hour_before",
): Promise<boolean> {
  const kv = await getKv();
  const result = await kv.set(["organiser_reminder", eventId, reminderType], true);
  return result.ok;
}

// Get registrations needing reminders
// ---------------------------------------------------------------------------
// More-info markdown loader
// ---------------------------------------------------------------------------

const MORE_INFO_DIR = "./data/events/more-info";

// Local marked instance — configured independently from blog.ts
const moreInfoMarked = marked.use({
  async: false,
  pedantic: false,
  gfm: true,
  breaks: true,
})
  .use(mangle())
  .use(gfmHeadingId({}))
  .use(markedSmartypants());

/**
 * Loads and renders the more-info markdown file for an event.
 * Returns rendered HTML string, or null if the file doesn't exist.
 */
export async function getEventMoreInfoHtml(
  moreInfoFile: string,
): Promise<string | null> {
  try {
    const content = await Deno.readTextFile(
      `${MORE_INFO_DIR}/${moreInfoFile}.md`,
    );
    return moreInfoMarked.parse(content) as string;
  } catch {
    return null;
  }
}

export async function getRegistrationsNeedingReminder(
  reminderType: "day_before" | "hour_before",
): Promise<{
  events: EventConfig[];
  registrations: Array<{ event: EventConfig; registration: Registration }>;
}> {
  const matchingEvents: EventConfig[] = [];
  const eventRegistrations: Array<{ event: EventConfig; registration: Registration }> = [];

  // Get all active events
  const events = await getAllEvents();
  const now = new Date();

  for (const event of events) {
    if (!event.isActive) continue;

    const eventDate = new Date(event.date);
    const hoursBefore = (eventDate.getTime() - now.getTime()) /
      (1000 * 60 * 60);

    // Check if it's time for this reminder type
    let shouldSend = false;
    if (
      reminderType === "day_before" && hoursBefore <= 24 && hoursBefore > 23
    ) {
      shouldSend = true;
    } else if (
      reminderType === "hour_before" && hoursBefore <= 1 && hoursBefore > 0.5
    ) {
      shouldSend = true;
    }

    if (!shouldSend) continue;

    // Collect every event in the reminder window (for organiser emails)
    matchingEvents.push(event);

    // Get registrations that haven't received this reminder
    const registrations = await getEventRegistrations(event.id);
    for (const registration of registrations) {
      if (
        registration.status === "registered" &&
        !registration.remindersSent[reminderType]
      ) {
        eventRegistrations.push({ event, registration });
      }
    }
  }

  return { events: matchingEvents, registrations: eventRegistrations };
}
