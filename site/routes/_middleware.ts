import { define } from "@/utils.ts";

/**
 * Top-level middleware — runs on every request.
 *
 * Event configs are now loaded into an in-memory cache on first use
 * (see utils/events.ts → getEventCache). No blocking initialisation
 * needed here.
 */
export const handler = define.middleware((ctx) => ctx.next());
