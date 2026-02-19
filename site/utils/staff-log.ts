/**
 * Staff access logger — Deno KV implementation
 *
 * Stores log entries in Deno KV so they survive across requests on Deno Deploy.
 * Also writes to console so entries appear in the Deno Deploy log viewer.
 *
 * KV key structure: ["staff_log", <ISO timestamp>]
 * Entries expire after 90 days (Deno KV supports TTL in milliseconds).
 */

const LOG_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

let kvInstance: Deno.Kv | null = null;

async function getKv(): Promise<Deno.Kv> {
  if (!kvInstance) kvInstance = await Deno.openKv();
  return kvInstance;
}

export async function logStaffAccess(message: string): Promise<void> {
  // Always log to console — visible in Deno Deploy log viewer
  console.log(`[staff-access] ${message}`);

  // Also persist to KV for later review
  try {
    const kv = await getKv();
    const timestamp = new Date().toISOString();
    // Use timestamp + random suffix to avoid key collisions under concurrent requests
    const key = ["staff_log", timestamp, crypto.randomUUID()];
    await kv.set(key, { message, timestamp }, { expireIn: LOG_TTL_MS });
  } catch (error) {
    // KV failure is non-fatal — console log above already captured the message
    console.error("[staff-access] KV write failed:", error);
  }
}

/**
 * Retrieve recent staff access log entries (for a future staff log viewer).
 * Returns entries sorted newest-first, up to `limit`.
 */
export async function getStaffAccessLog(
  limit = 100,
): Promise<Array<{ message: string; timestamp: string }>> {
  try {
    const kv = await getKv();
    const entries: Array<{ message: string; timestamp: string }> = [];
    const iter = kv.list<{ message: string; timestamp: string }>({
      prefix: ["staff_log"],
    });
    for await (const entry of iter) {
      entries.push(entry.value);
      if (entries.length >= limit) break;
    }
    return entries.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch {
    return [];
  }
}
