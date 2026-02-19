import { define } from "@/utils.ts";
import { initializeEventCache } from "@/utils/events.ts";

/**
 * Top-level middleware — runs on every request.
 * Initialises the event KV cache once on first request so that
 * getNextAvailableEvent() and friends work on all pages.
 */
let initialized = false;
let initializing = false;

export const handler = define.middleware(async (ctx) => {
  if (!initialized && !initializing) {
    initializing = true;
    try {
      await initializeEventCache();
      initialized = true;
    } catch (e) {
      console.error("Failed to initialize event cache:", e);
      initializing = false; // allow retry on next request
    }
  }
  return ctx.next();
});
