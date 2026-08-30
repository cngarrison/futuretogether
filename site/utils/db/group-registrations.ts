/**
 * site/utils/db/group-registrations.ts
 *
 * All event registration types and functions.
 * Merges site/utils/events.ts (registration CRUD + reminder pipeline)
 * and site/utils/groups.ts (group-event registrant queries + cancel tokens).
 */

import { naiveDatetimeToDate, nowAsNaiveLocal } from "@/utils/temporal.ts";
import { createAdminClient } from "@/utils/supabase.ts";
import type { State } from "@/utils.ts";
import type { EventConfig } from "@/utils/db/group-events.ts";
import { EVENT_SELECT, rowToEventConfig } from "@/utils/db/group-events.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Registration {
  id: string;
  eventId: string;
  eventSlug: string;
  attendee: {
    firstName: string;
    lastName: string;
    email: string;
  };
  engagement: {
    interests: string;
    heardFrom: string;
  } | null;
  timestamp: string;
  status: "registered" | "cancelled";
  cancelledAt?: string;
}

export interface ProfileRegistration {
  id: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  eventDate: string | null;
  timezone: string;
  groupSlug: string;
  registeredAt: string;
}

export interface GroupEventRegistrant {
  id: string;
  profileId: string | null;
  email: string;
  nameFirst: string;
  nameLast: string;
  status: "registered" | "cancelled" | "attended";
  source: "web" | "admin-added";
  interests: string | null;
  heardFrom: string | null;
  registeredAt: string;
  cancelledAt: string | null;
  reminders: {
    dayBefore: string | null;
    hourBefore: string | null;
  };
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function rowToRegistration(
  row: Record<string, unknown>,
  event: EventConfig,
): Registration {
  const interests = (row.interests as string) ?? "";
  const heardFrom = (row.heard_from as string) ?? "";
  return {
    id: row.id as string,
    eventId: event.id,
    eventSlug: event.slug,
    attendee: {
      firstName: (row.name_first as string) ?? "",
      lastName: (row.name_last as string) ?? "",
      email: row.email as string,
    },
    engagement: (interests || heardFrom) ? { interests, heardFrom } : null,
    timestamp: row.registered_at as string,
    status: (row.status ?? "registered") as Registration["status"],
    cancelledAt: (row.cancelled_at as string | undefined) ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Registration CRUD (from events.ts)
// ---------------------------------------------------------------------------

export async function createRegistration(
  eventId: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    interests?: string;
    heardFrom?: string;
  },
  state: State,
): Promise<{ registration: Registration | null; error: string | null }> {
  try {
    const db = state.supabaseClient;
    const { data: eventRow, error: eventError } = await db
      .from("group_events").select(EVENT_SELECT).eq("id", eventId)
      .maybeSingle();
    //console.log(`DbGroupRegistrations: createRegistration for: ${eventId}`, { eventRow, eventError });
    if (eventError || !eventRow) {
      return { registration: null, error: "Event not found" };
    }
    const event = await rowToEventConfig(
      eventRow as Record<string, unknown>,
    );
    if (!event.isActive) {
      return {
        registration: null,
        error: "Registrations are closed for this event",
      };
    }

    // Capacity check — admin client required: anon has INSERT-only on event_registrations
    const { count: regCount } = await createAdminClient()
      .from("event_registrations").select("*", { count: "exact", head: true })
      .eq("event_id", eventId).eq("status", "registered");
    if (event.capacity && (regCount ?? 0) >= event.capacity) {
      return { registration: null, error: "This event is fully booked" };
    }

    // Deadline check
    const eventDate = naiveDatetimeToDate(event.date, event.timezone);
    const deadlineDays = event.registrationDeadline ?? 1;
    const deadlineDate = new Date(
      eventDate.getTime() - deadlineDays * 24 * 60 * 60 * 1000,
    );
    if (new Date() > deadlineDate) {
      return { registration: null, error: "Registration deadline has passed" };
    }

    // Look up profile_id via admin client (bypasses RLS — intentional for server-side registration)
    let profileId: string | null = null;
    try {
      const admin = createAdminClient();
      const { data: profileData } = await admin.from("profiles").select("id")
        .eq("email", data.email.toLowerCase()).maybeSingle();
      if (profileData) profileId = (profileData as { id: string }).id;
    } catch { /* non-fatal */ }

    // Admin client required: anon has no SELECT on event_registrations;
    // .insert().select() needs SELECT to return the created row.
    const { data: regData, error: regError } = await createAdminClient()
      .from("event_registrations")
      .insert({
        event_id: eventId,
        profile_id: profileId,
        name_first: data.firstName,
        name_last: data.lastName,
        email: data.email.toLowerCase(),
        interests: data.interests ?? null,
        heard_from: data.heardFrom ?? null,
        status: "registered",
      }).select("*").single();

    if (regError) {
      console.log(
        `DbGroupRegistrations: createRegistration - Error: ${eventId}`,
        { regData, regError },
      );
      if (regError.code === "23505") {
        return {
          registration: null,
          error: "You are already registered for this event",
        };
      }
      return {
        registration: null,
        error: "Failed to register: " + regError.message,
      };
    }
    return {
      registration: rowToRegistration(
        regData as Record<string, unknown>,
        event,
      ),
      error: null,
    };
  } catch (err) {
    return {
      registration: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function getRegistrationCount(
  eventId: string,
  state: State,
): Promise<number> {
  return await getActiveRegistrationCount(eventId, state);
}

export async function getActiveRegistrationCount(
  eventId: string,
  state: State,
): Promise<number> {
  try {
    const { count } = await state.supabaseClient
      .from("event_registrations").select("*", { count: "exact", head: true })
      .eq("event_id", eventId).eq("status", "registered");
    //console.log(`DbGroupRegistrations: getActiveRegistrationCount for: ${eventId}`, { count });
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getEventRegistrations(
  eventId: string,
  state: State,
): Promise<Registration[]> {
  try {
    const { data: eventRow } = await state.supabaseClient
      .from("group_events").select(EVENT_SELECT).eq("id", eventId)
      .maybeSingle();
    if (!eventRow) return [];
    const event = await rowToEventConfig(
      eventRow as Record<string, unknown>,
    );
    const { data, error } = await state.supabaseClient
      .from("event_registrations").select("*").eq("event_id", eventId).order(
        "registered_at",
        { ascending: false },
      );
    if (error || !data) return [];
    return data.map((row) =>
      rowToRegistration(row as Record<string, unknown>, event)
    );
  } catch {
    return [];
  }
}

export async function getRegistrationById(
  id: string,
  state: State,
): Promise<Registration | null> {
  try {
    const { data: regRow, error: regError } = await state.supabaseClient
      .from("event_registrations").select(
        "*, event:event_id(group_events!inner(*))",
      ).eq("id", id).single();
    if (regError || !regRow) return null;
    const row = regRow as Record<string, unknown>;
    const eventId = row.event_id as string;
    const { data: eventRow } = await state.supabaseClient
      .from("group_events").select(EVENT_SELECT).eq("id", eventId)
      .maybeSingle();
    if (!eventRow) return null;
    const event = await rowToEventConfig(
      eventRow as Record<string, unknown>,
    );
    return rowToRegistration(row, event);
  } catch {
    return null;
  }
}

export async function cancelRegistration(
  registrationId: string,
  state: State,
): Promise<{ success: boolean; error?: string }> {
  // Token verification is performed by the caller via verifyCancelRegistrationToken (HMAC).
  // cancel_token is not stored in the DB.
  try {
    const { data: reg } = await state.supabaseClient
      .from("event_registrations").select("status").eq("id", registrationId)
      .single();
    if (!reg) return { success: false, error: "Registration not found" };
    if ((reg as { status: string }).status === "cancelled") {
      return { success: false, error: "Registration already cancelled" };
    }
    const { error } = await state.supabaseClient
      .from("event_registrations")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", registrationId);
    return error
      ? { success: false, error: "Failed to cancel registration" }
      : { success: true };
  } catch {
    return { success: false, error: "Unexpected error" };
  }
}

export async function updateReminderSent(
  _eventId: string,
  registrationId: string,
  reminderType: "day_before" | "hour_before",
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("event_reminder_logs").insert({
      registration_id: registrationId,
      reminder_type: reminderType,
      sent_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("updateReminderSent error:", err);
  }
}

export async function hasOrganizerReminderBeenSent(
  eventId: string,
  reminderType: "day_before" | "hour_before",
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const col = reminderType === "day_before"
      ? "organiser_day_before_sent_at"
      : "organiser_hour_before_sent_at";
    const { data } = await admin.from("group_events").select(col).eq(
      "id",
      eventId,
    ).maybeSingle();
    return !!(data as Record<string, unknown> | null)?.[col];
  } catch {
    return false;
  }
}

export async function updateOrganizerReminderSent(
  eventId: string,
  reminderType: "day_before" | "hour_before",
): Promise<void> {
  try {
    const admin = createAdminClient();
    const col = reminderType === "day_before"
      ? "organiser_day_before_sent_at"
      : "organiser_hour_before_sent_at";
    await admin.from("group_events").update({ [col]: new Date().toISOString() })
      .eq("id", eventId);
  } catch (err) {
    console.error("updateOrganizerReminderSent error:", err);
  }
}

export async function getRegistrationsNeedingReminder(
  reminderType: "day_before" | "hour_before",
): Promise<
  {
    events: EventConfig[];
    registrations: Array<{ event: EventConfig; registration: Registration }>;
  }
> {
  const empty = { events: [], registrations: [] };
  try {
    const admin = createAdminClient();
    const now = nowAsNaiveLocal("Australia/Sydney");
    // For day_before: window = [22h, 26h] from now; hour_before: [45min, 75min]
    const windowMs = reminderType === "day_before"
      ? { low: 22 * 60 * 60 * 1000, high: 26 * 60 * 60 * 1000 }
      : { low: 45 * 60 * 1000, high: 75 * 60 * 1000 };
    const lowCutoff = new Date(Date.now() + windowMs.low).toISOString().replace(
      "T",
      " ",
    ).slice(0, 19);
    const highCutoff = new Date(Date.now() + windowMs.high).toISOString()
      .replace("T", " ").slice(0, 19);
    const { data: eventRows } = await admin
      .from("group_events")
      .select(EVENT_SELECT)
      .eq("status", "published")
      .gt("event_date", now)
      .gte("event_date", lowCutoff)
      .lte("event_date", highCutoff);
    if (!eventRows || eventRows.length === 0) return empty;
    const events = await Promise.all(
      (eventRows as Record<string, unknown>[]).map((row) =>
        rowToEventConfig(row)
      ),
    );
    const registrations: Array<
      { event: EventConfig; registration: Registration }
    > = [];
    const reminderCol = reminderType === "day_before"
      ? "day_before_reminder_sent"
      : "hour_before_reminder_sent";
    for (const event of events) {
      const { data: regs } = await admin
        .from("event_registrations")
        .select("*")
        .eq("event_id", event.id)
        .eq("status", "registered")
        .eq(reminderCol, false);
      if (!regs) continue;
      for (const reg of regs as Record<string, unknown>[]) {
        registrations.push({
          event,
          registration: rowToRegistration(reg, event),
        });
      }
    }
    return { events, registrations };
  } catch {
    return empty;
  }
}

// ---------------------------------------------------------------------------
// Group-event registrant queries (from groups.ts)
// ---------------------------------------------------------------------------

export async function getGroupEventRegistrants(
  eventId: string,
  state: State,
): Promise<GroupEventRegistrant[]> {
  try {
    const db = state.supabaseClient;
    const { data: rows, error } = await db
      .from("event_registrations")
      .select(
        "id, profile_id, email, name_first, name_last, status, source, interests, heard_from, registered_at, cancelled_at",
      )
      .eq("event_id", eventId)
      .order("registered_at", { ascending: false });
    if (error || !rows) return [];
    const regIds = (rows as Record<string, unknown>[]).map((r) =>
      r.id as string
    );
    const { data: logRows } = regIds.length > 0
      ? await db.from("event_reminder_logs").select(
        "registration_id, reminder_type, sent_at",
      ).in("registration_id", regIds)
      : { data: [] };
    const logsByRegId = new Map<
      string,
      { dayBefore: string | null; hourBefore: string | null }
    >();
    for (const log of (logRows ?? []) as Record<string, unknown>[]) {
      const rid = log.registration_id as string;
      if (!logsByRegId.has(rid)) {
        logsByRegId.set(rid, { dayBefore: null, hourBefore: null });
      }
      const entry = logsByRegId.get(rid)!;
      if (log.reminder_type === "1-day") {
        entry.dayBefore = log.sent_at as string;
      }
      if (log.reminder_type === "1-hour") {
        entry.hourBefore = log.sent_at as string;
      }
    }
    return (rows as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      profileId: (r.profile_id as string | null) ?? null,
      email: r.email as string,
      nameFirst: (r.name_first as string | null) ?? "",
      nameLast: (r.name_last as string | null) ?? "",
      status: (r.status ?? "registered") as GroupEventRegistrant["status"],
      source: (r.source ?? "web") as GroupEventRegistrant["source"],
      interests: (r.interests as string | null) ?? null,
      heardFrom: (r.heard_from as string | null) ?? null,
      registeredAt: r.registered_at as string,
      cancelledAt: (r.cancelled_at as string | null) ?? null,
      reminders: logsByRegId.get(r.id as string) ??
        { dayBefore: null, hourBefore: null },
    }));
  } catch {
    return [];
  }
}

export async function generateCancelRegistrationToken(
  registrationId: string,
  eventId: string,
): Promise<string> {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = `${registrationId}.${eventId}.${expiresAt}`;
  const secret = Deno.env.get("FT_TOKEN_SECRET") ?? "ft-dev-secret";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  const sigHex = Array.from(new Uint8Array(sig)).map((b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
  return `${payload}.${sigHex}`;
}

export async function verifyCancelRegistrationToken(
  token: string,
): Promise<{ registrationId: string; eventId: string } | null> {
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [registrationId, eventId, expiresAtStr, providedSig] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) return null;
  const payload = `${registrationId}.${eventId}.${expiresAtStr}`;
  const secret = Deno.env.get("FT_TOKEN_SECRET") ?? "ft-dev-secret";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const sigBytes = new Uint8Array(
    (providedSig.match(/.{2}/g) ?? []).map((h) => parseInt(h, 16)),
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    new TextEncoder().encode(payload),
  );
  if (!valid) return null;
  return { registrationId, eventId };
}

// ---------------------------------------------------------------------------
// Admin cancel (group admin action — bypasses RLS via service role)
// ---------------------------------------------------------------------------

export interface AdminCancelResult {
  success: boolean;
  error?: string;
  emailData?: {
    email: string;
    nameFirst: string;
    eventTitle: string;
    eventDate: string;
    eventTimezone: string;
    groupSlug: string;
    groupName: string;
  };
}

/**
 * Cancel a single event registration on behalf of a group admin.
 * Uses the service-role client to bypass RLS (the admin is acting on another
 * person's row, so the session client would be rejected by RLS).
 * Returns email data so the caller can fire the cancellation email.
 */
export async function adminCancelGroupRegistration(
  registrationId: string,
  eventId: string,
): Promise<AdminCancelResult> {
  try {
    const admin = createAdminClient();

    // Fetch registration — also verifies it belongs to this event
    const { data: regRow } = await admin
      .from("event_registrations")
      .select("id, status, email, name_first")
      .eq("id", registrationId)
      .eq("event_id", eventId)
      .maybeSingle();

    if (!regRow) return { success: false, error: "Registration not found" };
    const reg = regRow as Record<string, unknown>;
    if (reg.status === "cancelled") {
      return { success: false, error: "Registration is already cancelled" };
    }

    const { error: updateErr } = await admin
      .from("event_registrations")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", registrationId);

    if (updateErr) {
      console.error("[adminCancelGroupRegistration] update error:", updateErr);
      return { success: false, error: "Failed to cancel registration" };
    }

    // Fetch event + group details for the cancellation email.
    // Also join group_programs so recurring instances (where group_events.title
    // is null) can fall back to the program title.
    const { data: evRow } = await admin
      .from("group_events")
      .select(
        "title, event_date, timezone, group:groups!group_id(slug, name), program:group_programs!program_id(title)",
      )
      .eq("id", eventId)
      .maybeSingle();

    if (!evRow) return { success: true };

    const ev = evRow as Record<string, unknown>;
    const group = (ev.group ?? {}) as Record<string, unknown>;
    const program = (ev.program ?? {}) as Record<string, unknown>;
    const eventTitle = (ev.title as string | null) ??
      (program.title as string | null) ??
      "Event";
    return {
      success: true,
      emailData: {
        email: reg.email as string,
        nameFirst: (reg.name_first as string) ?? "",
        eventTitle,
        eventDate: (ev.event_date as string) ?? "",
        eventTimezone: (ev.timezone as string) ?? "Australia/Sydney",
        groupSlug: (group.slug as string) ?? "",
        groupName: (group.name as string) ?? "",
      },
    };
  } catch (err) {
    console.error("[adminCancelGroupRegistration] unexpected error:", err);
    return { success: false, error: "Unexpected error" };
  }
}

/**
 * Returns the subset of `eventIds` that the given profile is actively registered for.
 * Used by the public group page to suppress re-registration forms.
 */
export async function getRegisteredEventIds(
  profileId: string,
  eventIds: string[],
  state: State,
): Promise<string[]> {
  if (eventIds.length === 0) return [];
  try {
    const { data, error } = await state.supabaseClient
      .from("event_registrations")
      .select("event_id")
      .eq("profile_id", profileId)
      .eq("status", "registered")
      .in("event_id", eventIds);
    if (error || !data) return [];
    return (data as { event_id: string }[]).map((r) => r.event_id);
  } catch {
    return [];
  }
}

export async function getProfileUpcomingRegistrations(
  profileId: string,
  state: State,
): Promise<ProfileRegistration[]> {
  try {
    const now = nowAsNaiveLocal("Australia/Sydney");
    const admin = state.supabaseClient;
    const { data, error } = await admin
      .from("event_registrations")
      .select(`id, status, registered_at,
        group_events!event_id(
          id, slug, event_date, timezone, title, group_id,
          group_programs!program_id(title),
          groups!group_id(slug)
        )`)
      .eq("profile_id", profileId)
      .eq("status", "registered")
      .gt("group_events.event_date", now);
    if (error || !data) return [];
    const results: ProfileRegistration[] = [];
    for (const row of data as Record<string, unknown>[]) {
      const ev = row.group_events as {
        id: string;
        slug: string;
        event_date: string | null;
        timezone: string;
        title: string | null;
        group_id: string;
        group_programs: { title: string | null } | null;
        groups: { slug: string } | null;
      } | null;
      if (!ev || !ev.event_date) continue;
      results.push({
        id: row.id as string,
        eventId: ev.id,
        eventSlug: ev.slug,
        eventTitle: ev.title ?? ev.group_programs?.title ?? "Event",
        eventDate: ev.event_date,
        timezone: ev.timezone ?? "Australia/Sydney",
        groupSlug: ev.groups?.slug ?? "",
        registeredAt: row.registered_at as string,
      });
    }
    results.sort((a, b) =>
      (a.eventDate ?? "").localeCompare(b.eventDate ?? "")
    );
    return results;
  } catch {
    return [];
  }
}
