/**
 * Focused, non-network tests for private event poster path recognition.
 * Run: deno test site/tests/group-events.test.ts
 */

import { assertEquals } from "@std/assert";
import {
  isGroupEventPosterPath,
  resolveEventPosterImage,
  resolveRegistrationRequired,
} from "../utils/db/group-events.ts";

const GROUP_ID = "499229dc-7c73-409c-8629-94898913cd5c";
const EVENT_ID = "9c780ada-1a77-4879-867d-e1128426dbc8";

Deno.test("recognizes a canonical groups-bucket event poster path", () => {
  assertEquals(
    isGroupEventPosterPath(`${GROUP_ID}/events/${EVENT_ID}/poster.webp`),
    true,
  );
});

Deno.test("does not classify static or external poster URLs as private paths", () => {
  assertEquals(isGroupEventPosterPath("/img/event-poster.webp"), false);
  assertEquals(isGroupEventPosterPath("/charts/event-poster.svg"), false);
  assertEquals(
    isGroupEventPosterPath("https://example.com/poster.webp"),
    false,
  );
});

Deno.test("preserves static and external poster URLs without signing", async () => {
  assertEquals(
    await resolveEventPosterImage("/img/event-poster.webp"),
    "/img/event-poster.webp",
  );
  assertEquals(
    await resolveEventPosterImage("/charts/event-poster.svg"),
    "/charts/event-poster.svg",
  );
  assertEquals(
    await resolveEventPosterImage("https://example.com/poster.webp"),
    "https://example.com/poster.webp",
  );
});

Deno.test("rejects malformed relative storage paths", async () => {
  assertEquals(isGroupEventPosterPath("events/poster.webp"), false);
  assertEquals(
    isGroupEventPosterPath(`${GROUP_ID}/events/${EVENT_ID}/poster.jpg`),
    false,
  );
  assertEquals(
    isGroupEventPosterPath(`../${GROUP_ID}/events/${EVENT_ID}/poster.webp`),
    false,
  );
  assertEquals(
    await resolveEventPosterImage("events/poster.webp"),
    undefined,
  );
});

Deno.test("uses an event registration setting when it is explicitly supplied", () => {
  assertEquals(resolveRegistrationRequired(true, false), true);
  assertEquals(resolveRegistrationRequired(false, true), false);
});

Deno.test("inherits the program registration setting for unset event instances", () => {
  assertEquals(resolveRegistrationRequired(null, true), true);
  assertEquals(resolveRegistrationRequired(null, false), false);
  assertEquals(resolveRegistrationRequired(undefined, false), false);
});

Deno.test("requires registration when neither an event nor program sets it", () => {
  assertEquals(resolveRegistrationRequired(null, null), true);
  assertEquals(resolveRegistrationRequired(undefined, undefined), true);
});
