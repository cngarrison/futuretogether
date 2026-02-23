/**
 * Shared Deno KV singleton for Future Together.
 *
 * All modules that need KV access should import getKv() from here
 * rather than calling Deno.openKv() directly. This ensures a single
 * connection is reused across the application.
 *
 * Environment variable:
 *   FT_KV_PATH — optional path for local dev (e.g. ./.kv)
 *   In production (Deno Deploy) this is ignored; the platform KV is used.
 */

let kvInstance: Deno.Kv | null = null;

export async function getKv(): Promise<Deno.Kv> {
  if (!kvInstance) {
    const kvPath = Deno.env.get("FT_KV_PATH");
    kvInstance = kvPath ? await Deno.openKv(kvPath) : await Deno.openKv();
  }
  return kvInstance;
}
