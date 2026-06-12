import { useSignal } from "@preact/signals";

type ReminderType = "day_before" | "hour_before";

interface Result {
  type: ReminderType;
  message: string;
  sent: number;
  failed: number;
  error?: string;
}

async function triggerReminder(type: ReminderType): Promise<Result> {
  const res = await fetch(
    `/api/staff/events/reminders/send?type=${type}`,
    { method: "POST" },
  );
  const json = await res.json();
  if (!res.ok) {
    return {
      type,
      message: json.error ?? "Unknown error",
      sent: 0,
      failed: 0,
      error: json.error,
    };
  }
  return { type, ...json };
}

export default function ReminderTrigger() {
  const loading = useSignal<ReminderType | null>(null);
  const results = useSignal<Result[]>([]);

  async function handleTrigger(type: ReminderType) {
    loading.value = type;
    try {
      const result = await triggerReminder(type);
      results.value = [result, ...results.value];
    } finally {
      loading.value = null;
    }
  }

  const isLoading = (type: ReminderType) => loading.value === type;

  return (
    <div class="border border-gray-200 rounded-lg p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-1">Reminder Tools</h2>
      <p class="text-sm text-gray-500 mb-6">
        Manually trigger reminder checks. Safe to run at any time — each
        reminder is only sent once per registration.
      </p>

      <div class="flex gap-4 mb-6">
        <button
          type="button"
          onClick={() => handleTrigger("day_before")}
          disabled={loading.value !== null}
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading("day_before") ? "Sending…" : "Send Day-Before Reminders"}
        </button>
        <button
          type="button"
          onClick={() => handleTrigger("hour_before")}
          disabled={loading.value !== null}
          class="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading("hour_before") ? "Sending…" : "Send Hour-Before Reminders"}
        </button>
      </div>

      {results.value.length > 0 && (
        <div class="space-y-2">
          {results.value.map((r, i) => (
            <div
              key={i}
              class={`text-sm px-4 py-3 rounded-lg ${
                r.error
                  ? "bg-red-50 text-red-800"
                  : r.sent === 0
                  ? "bg-gray-50 text-gray-700"
                  : "bg-green-50 text-green-800"
              }`}
            >
              <span class="font-medium">
                {r.type === "day_before" ? "Day-before" : "Hour-before"}:
              </span>{" "}
              {r.error ? r.error : r.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
