import { define } from "@/utils.ts";

/**
 * Staff dashboard home — Fresh v2
 */
export default define.page(function StaffIndex() {
  return (
    <div class="min-h-screen bg-gray-100">
      <div class="max-w-4xl mx-auto px-4 py-12">
        <div class="bg-white rounded-lg shadow-lg p-8">
          <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900">
              Future Together — Staff Dashboard
            </h1>
            <a
              href="/"
              class="text-sm font-medium hover:underline"
              style="color: #1a5f6e;"
            >
              ← Back to Site
            </a>
          </div>

          <p class="text-lg text-gray-700 mb-8">
            Welcome to the staff management area. Select an option below to
            manage events and registrations.
          </p>

          <div class="grid md:grid-cols-2 gap-6">
            <a
              href="/staff/events"
              class="block bg-white p-6 rounded-lg border-2 hover:shadow-md transition-all"
              style="border-color: #1a5f6e;"
            >
              <h2 class="text-xl font-bold text-gray-900 mb-2">Events</h2>
              <p class="text-gray-600">
                Manage events and registrations. View attendees, send reminders,
                and download registration data.
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});
