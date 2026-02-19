import { define } from "@/utils.ts";
import { page } from "fresh";
import {
  getAllEvents,
  getActiveRegistrationCount,
} from "@/utils/events.ts";
import type { EventConfig } from "@/utils/events.ts";

/**
 * Staff events list — Fresh v2
 */

interface EventWithStats extends EventConfig {
  registrationCount: number;
}

interface StaffEventsData {
  events: EventWithStats[];
}

function formatEventDate(date: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  }).format(new Date(date));
}

export const handler = define.handlers<StaffEventsData>({
  async GET(_ctx) {
    const events = await getAllEvents();
    const eventsWithStats = await Promise.all(
      events.map(async (event) => ({
        ...event,
        registrationCount: await getActiveRegistrationCount(event.id),
      })),
    );
    return page({ events: eventsWithStats });
  },
});

export default define.page<typeof handler>(function StaffEventsPage({ data }) {
  const { events } = data ?? { events: [] };

  const now = new Date();
  const upcomingEvents = events.filter((e) => new Date(e.date) > now);
  const pastEvents = events.filter((e) => new Date(e.date) <= now);
  const totalRegistrations = events.reduce(
    (sum, e) => sum + e.registrationCount,
    0,
  );

  return (
    <div class="min-h-screen bg-gray-100 p-8">
      <div class="max-w-7xl mx-auto">
        <div class="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Event Management</h1>
            <a
              href="/staff"
              class="text-sm font-medium hover:underline"
              style="color: #1a5f6e;"
            >
              ← Staff Dashboard
            </a>
          </div>

          {/* Stats */}
          <div class="grid grid-cols-3 gap-6 mb-8">
            <div class="rounded-lg p-6" style="background-color: #eef5f7;">
              <div
                class="text-3xl font-bold mb-2"
                style="color: #1a5f6e;"
              >
                {events.length}
              </div>
              <div class="text-gray-600">Total Events</div>
            </div>
            <div class="bg-green-50 rounded-lg p-6">
              <div class="text-3xl font-bold text-green-600 mb-2">
                {upcomingEvents.length}
              </div>
              <div class="text-gray-600">Upcoming Events</div>
            </div>
            <div class="bg-amber-50 rounded-lg p-6">
              <div
                class="text-3xl font-bold mb-2"
                style="color: #c4853a;"
              >
                {totalRegistrations}
              </div>
              <div class="text-gray-600">Active Registrations</div>
            </div>
          </div>

          {/* Upcoming events */}
          {upcomingEvents.length > 0 && (
            <div class="mb-8">
              <h2 class="text-2xl font-bold text-gray-900 mb-4">
                Upcoming Events
              </h2>
              <div class="space-y-4">
                {upcomingEvents.map((event) => {
                  const spotsRemaining = event.capacity -
                    event.registrationCount;
                  const percentFull =
                    (event.registrationCount / event.capacity) * 100;
                  return (
                    <div
                      key={event.id}
                      class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div class="flex justify-between items-start mb-4">
                        <div>
                          <h3 class="text-xl font-bold text-gray-900 mb-1">
                            {event.title}
                          </h3>
                          <p class="text-gray-600">
                            {formatEventDate(event.date, event.timezone)}
                          </p>
                        </div>
                        <div class="text-right">
                          <div class="text-2xl font-bold text-gray-900">
                            {event.registrationCount}/{event.capacity}
                          </div>
                          <div class="text-sm text-gray-500">registrations</div>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div class="mb-4">
                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            class={`h-2.5 rounded-full ${
                              percentFull >= 90
                                ? "bg-red-600"
                                : percentFull >= 70
                                ? "bg-yellow-500"
                                : "bg-green-600"
                            }`}
                            style={{ width: `${percentFull}%` }}
                          />
                        </div>
                        <p class="text-sm text-gray-600 mt-1">
                          {spotsRemaining > 0
                            ? `${spotsRemaining} spots remaining`
                            : "Event full"}
                        </p>
                      </div>
                      <div class="flex gap-4">
                        <a
                          href={`/staff/events/${event.slug}`}
                          class="inline-block text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
                          style="background-color: #1a5f6e;"
                        >
                          View Registrations
                        </a>
                        <a
                          href={`/events/${event.slug}`}
                          class="inline-block border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          View Public Page
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past events */}
          {pastEvents.length > 0 && (
            <div>
              <h2 class="text-2xl font-bold text-gray-900 mb-4">
                Past Events
              </h2>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      {["Event", "Date", "Registrations", "Actions"].map(
                        (h) => (
                          <th
                            key={h}
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    {pastEvents.map((event) => (
                      <tr key={event.id}>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {event.title}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatEventDate(event.date, event.timezone)}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {event.registrationCount} / {event.capacity}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                          <a
                            href={`/staff/events/${event.slug}?eventId=${event.id}`}
                            class="hover:underline"
                            style="color: #1a5f6e;"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {events.length === 0 && (
            <div class="text-center py-12 text-gray-500">
              <p class="text-lg">No events configured yet.</p>
              <p class="text-sm mt-2">
                Add event YAML files to the /events directory.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
