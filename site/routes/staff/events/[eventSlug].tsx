import { define } from "@/utils.ts";
import { page } from "fresh";
import {
  getEventById,
  getEventRegistrations,
  getNextAvailableEvent,
} from "@/utils/events.ts";
import type { EventConfig, Registration } from "@/utils/events.ts";
import CancelRegistrationButton from "@/islands/CancelRegistrationButton.tsx";

/**
 * Staff event registrations detail page — Fresh v2
 */

interface EventRegistrationsData {
  event: EventConfig;
  registrations: Registration[];
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

export const handler = define.handlers<EventRegistrationsData>({
  async GET(ctx) {
    const { eventSlug } = ctx.params;
    const url = new URL(ctx.req.url);
    const eventId = url.searchParams.get("eventId");

    const event = eventId
      ? await getEventById(eventId)
      : await getNextAvailableEvent(eventSlug);

    if (!event) {
      return new Response("Event not found", { status: 404 });
    }

    const registrations = await getEventRegistrations(event.id);
    return page({ event, registrations });
  },
});

export default define.page<typeof handler>(function EventRegistrationsPage(
  { data },
) {
  const { event, registrations } = data ?? { event: null, registrations: [] };

  if (!event) {
    return (
      <div class="p-8">
        <p class="text-gray-500">Event not found.</p>
      </div>
    );
  }

  const activeCount = registrations.filter((r) => r.status === "registered")
    .length;
  const cancelledCount = registrations.filter((r) =>
    r.status === "cancelled"
  ).length;
  const spotsRemaining = Math.max(
    0,
    event.capacity - activeCount,
  );

  return (
    <div class="min-h-screen bg-gray-100 p-8">
      <div class="max-w-7xl mx-auto">
        <div class="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div class="flex justify-between items-start mb-8">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 mb-1">
                {event.title}
              </h1>
              <p class="text-gray-600">{formatDate(event.date)}</p>
            </div>
            <div class="flex flex-col items-end gap-2">
              <a
                href="/staff/events"
                class="text-sm font-medium hover:underline"
                style="color: #1a5f6e;"
              >
                ← All Events
              </a>
              <a
                href={`/api/staff/events/${event.slug}/download?eventId=${event.id}`}
                class="inline-flex items-center text-white px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-90"
                style="background-color: #1a5f6e;"
              >
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download CSV
              </a>
            </div>
          </div>

          {/* Stats */}
          <div class="grid grid-cols-4 gap-6 mb-8">
            <div class="rounded-lg p-6" style="background-color: #eef5f7;">
              <div
                class="text-3xl font-bold mb-2"
                style="color: #1a5f6e;"
              >
                {registrations.length}
              </div>
              <div class="text-gray-600">Total Registrations</div>
            </div>
            <div class="bg-green-50 rounded-lg p-6">
              <div class="text-3xl font-bold text-green-600 mb-2">
                {activeCount}
                {cancelledCount > 0 && (
                  <span class="text-lg text-red-400 ml-2">
                    / {cancelledCount} cancelled
                  </span>
                )}
              </div>
              <div class="text-gray-600">Active Registrations</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-6">
              <div class="text-3xl font-bold text-gray-700 mb-2">
                {event.capacity}
              </div>
              <div class="text-gray-600">Capacity</div>
            </div>
            <div class="bg-amber-50 rounded-lg p-6">
              <div
                class="text-3xl font-bold mb-2"
                style="color: #c4853a;"
              >
                {spotsRemaining}
              </div>
              <div class="text-gray-600">Spots Remaining</div>
            </div>
          </div>

          {/* Registrations table */}
          <div class="overflow-x-auto">
            {registrations.length > 0
              ? (
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      {[
                        "Name",
                        "Email",
                        "Interests",
                        "Heard From",
                        "Registered",
                        "Status",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    {registrations.map((reg, i) => (
                      <tr
                        key={reg.id}
                        class={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {reg.attendee.firstName} {reg.attendee.lastName}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {reg.attendee.email}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {reg.engagement?.interests || "-"}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reg.engagement?.heardFrom || "-"}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(reg.timestamp)}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span
                            class={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              reg.status === "registered"
                                ? "bg-green-100 text-green-800"
                                : reg.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {reg.status}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                          {reg.status === "registered"
                            ? (
                              <CancelRegistrationButton
                                eventSlug={event.slug}
                                eventId={event.id}
                                registrationId={reg.id}
                                attendeeEmail={reg.attendee.email}
                              />
                            )
                            : <span class="text-gray-400">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
              : (
                <div class="text-center py-12 text-gray-500">
                  <p class="text-lg">No registrations yet.</p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
});
