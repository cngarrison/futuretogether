/**
 * site/utils/db/group-events.ts
 *
 * All event types and data-access functions.
 * Merges site/utils/events.ts (legacy meetup series + EventConfig)
 * and group-event functions from site/utils/groups.ts.
 *
 * getGroupEvents (admin sidebar helper) is renamed getGroupEventsSummary.
 * getNextEvent alias is dropped — use getNextAvailableEvent directly.
 */

import { nowAsNaiveLocal } from "@/utils/temporal.ts";
import { loadMarkdown, renderMarkdown } from "@/utils/markdown.ts";
import { createAdminClient } from "@/utils/supabase.ts";
import { buildEmailHtml, sendEmail, SITE_URL } from "@/utils/email.ts";
import type { State } from "@/utils.ts";

// ---------------------------------------------------------------------------
// Shared types (from events.ts)
// ---------------------------------------------------------------------------

export interface EventResource {
  label: string;
  url: string;
  type: "download" | "link";
  description?: string;
}

export interface EventConfig {
  id: string;
  programId: string;
  programType: "recurring" | "one-off";
  slug: string;
  title: string;
  description: string;
  date: string;
  timezone: string;
  duration: number;
  capacity: number;
  registrationDeadline: number;
  meetingLink?: string;
  meetingLocation?: string;
  posterImage?: string;
  isActive: boolean;
  presentedBy?: string;
  sponsoredBy?: string;
  topics?: string[];
  resources?: EventResource[];
  slideshowUrl?: string;
  moreInfoPath?: string;
  organizer?: { name: string; email: string };
  supportingImages?: string[];
}

export const EVENT_SELECT = `
  id, slug, event_date, duration_minutes, timezone, registration_deadline_days,
  title, location_type, location_name, location_address, meeting_link,
  capacity, is_registration_required, organiser_id,
  poster_image_path, presented_by, sponsored_by, slideshow_url, more_info_path, topics, resources,
  visibility, status, created_by_id,
  program:group_programs!program_id (
    id, slug, title, description, program_type,
    duration_minutes, capacity, registration_deadline_days,
    poster_image_path, presented_by, sponsored_by, slideshow_url, more_info_path, topics, resources, 
    visibility, status, organiser_id, created_by_id
  )
`;

export function rowToEventConfig(row: Record<string, unknown>): EventConfig {
  const p = row.program as Record<string, unknown>;
  return {
    id: row.id as string,
    programId: p.id as string,
    programType: (p.program_type ?? "one-off") as "recurring" | "one-off",
    slug: p.slug as string,
    title: ((row.title ?? p.title) ?? "") as string,
    description: (p.description ?? "") as string,
    date: row.event_date as string,
    timezone: (row.timezone ?? "Australia/Sydney") as string,
    duration: ((row.duration_minutes ?? p.duration_minutes) ?? 60) as number,
    capacity: ((row.capacity ?? p.capacity) ?? 30) as number,
    registrationDeadline:
      ((row.registration_deadline_days ?? p.registration_deadline_days) ??
        1) as number,
    meetingLink: (row.meeting_link ?? undefined) as string | undefined,
    meetingLocation: (row.location_name ?? undefined) as string | undefined,
    posterImage:
      ((row.poster_image_path ?? p.poster_image_path) ?? undefined) as
        | string
        | undefined,
    isActive: row.status === "published",
    presentedBy: ((row.presented_by ?? p.presented_by) ?? undefined) as
      | string
      | undefined,
    sponsoredBy: ((row.sponsored_by ?? p.sponsored_by) ?? undefined) as
      | string
      | undefined,
    topics: ((row.topics ?? p.topics) ?? undefined) as string[] | undefined,
    resources: ((row.resources ?? p.resources) ?? undefined) as
      | EventResource[]
      | undefined,
    slideshowUrl: ((row.slideshow_url ?? p.slideshow_url) ?? undefined) as
      | string
      | undefined,
    moreInfoPath: (p.more_info_path ?? undefined) as string | undefined,
  };
}

// ---------------------------------------------------------------------------
// Legacy meetup-series functions (from events.ts) — already use state
// ---------------------------------------------------------------------------

export async function getEventById(
  id: string,
  state: State,
): Promise<EventConfig | null> {
  try {
    const { data, error } = await state.supabaseClient
      .from("group_events").select(EVENT_SELECT).eq("id", id).maybeSingle();
    //console.log(`DbGroupEvents: getEventById for: ${id}`, { data, error });
    if (error || !data) return null;
    return rowToEventConfig(data as Record<string, unknown>) as EventConfig;
  } catch {
    return null;
  }
}

export async function getEventBySlug(
  slug: string,
  state: State,
): Promise<EventConfig | null> {
  try {
    const { data, error } = await state.supabaseClient
      .from("group_events").select(EVENT_SELECT).eq("slug", slug).maybeSingle();
    if (error || !data) return null;
    return rowToEventConfig(data as Record<string, unknown>) as EventConfig;
  } catch {
    return null;
  }
}

export async function getEventsBySlug(
  slug: string,
  state: State,
): Promise<EventConfig[]> {
  try {
    const { data, error } = await state.supabaseClient
      .from("group_events").select(EVENT_SELECT).order("event_date", {
        ascending: true,
      });
    if (error || !data) return [];
    return (data as Record<string, unknown>[])
      .map((row) => rowToEventConfig(row) as EventConfig)
      .filter((e) => e.slug === slug);
  } catch {
    return [];
  }
}

export async function getAllEvents(state: State): Promise<EventConfig[]> {
  try {
    const { data, error } = await state.supabaseClient
      .from("group_events").select(EVENT_SELECT).order("event_date", {
        ascending: false,
      });
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map((row) =>
      rowToEventConfig(row) as EventConfig
    );
  } catch {
    return [];
  }
}

export async function getUpcomingSpecialEvents(
  excludeSlug: string,
  state: State,
): Promise<EventConfig[]> {
  try {
    const now = nowAsNaiveLocal("Australia/Sydney");
    const { data, error } = await state.supabaseClient
      .from("group_events").select(EVENT_SELECT).gt("event_date", now).order(
        "event_date",
        { ascending: true },
      );
    if (error || !data) return [];
    return (data as Record<string, unknown>[])
      .map((row) => rowToEventConfig(row) as EventConfig)
      .filter((e) => e.slug !== excludeSlug);
  } catch {
    return [];
  }
}

export async function getPastSpecialEvents(
  excludeSlug: string,
  state: State,
): Promise<EventConfig[]> {
  try {
    const now = nowAsNaiveLocal("Australia/Sydney");
    const { data, error } = await state.supabaseClient
      .from("group_events").select(EVENT_SELECT).lte("event_date", now).order(
        "event_date",
        { ascending: false },
      );
    if (error || !data) return [];
    return (data as Record<string, unknown>[])
      .map((row) => rowToEventConfig(row) as EventConfig)
      .filter((e) => e.slug !== excludeSlug);
  } catch {
    return [];
  }
}

export async function getPastRecurringEvents(
  slug: string,
  limit: number,
  state: State,
): Promise<
  { events: EventConfig[]; total: number; earliestDate: string | null }
> {
  try {
    const now = nowAsNaiveLocal("Australia/Sydney");
    const { data, error } = await state.supabaseClient
      .from("group_events").select(EVENT_SELECT).lte("event_date", now).order(
        "event_date",
        { ascending: false },
      );
    if (error || !data) return { events: [], total: 0, earliestDate: null };
    const all = (data as Record<string, unknown>[])
      .map((row) => rowToEventConfig(row) as EventConfig)
      .filter((e) => e.slug === slug);
    return {
      events: all.slice(0, limit),
      total: all.length,
      earliestDate: all.length > 0 ? all[all.length - 1].date : null,
    };
  } catch {
    return { events: [], total: 0, earliestDate: null };
  }
}

export async function getNextAvailableEvent(
  slug: string,
  state: State,
): Promise<EventConfig | null> {
  try {
    const { data: eventId, error } = await state.supabaseClient.rpc(
      "get_next_available_event_id",
      { p_program_slug: slug },
    );
    //console.log(`DbGroupEvents: getNextAvailableEvent for: ${slug}`, { eventId, error });
    if (error || !eventId) return null;
    return getEventById(eventId as string, state);
  } catch (err) {
    console.error("[group-events] getNextAvailableEvent error:", err);
    return null;
  }
}

export async function getEventMoreInfoHtml(
  moreInfoPath: string,
): Promise<string | null> {
  try {
    const { content } = await loadMarkdown(moreInfoPath);
    return renderMarkdown(content);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Group event types (from groups.ts)
// ---------------------------------------------------------------------------

export interface GroupEvent {
  id: string;
  title: string | null;
  event_date: string | null;
  status: string;
}

export interface GroupEventDetail {
  id: string;
  slug: string;
  group_id: string;
  program_id: string;
  title: string;
  description: string;
  event_date: string | null;
  timezone: string;
  duration_minutes: number | null;
  location_type: string | null;
  location_name: string | null;
  location_address: string | null;
  meeting_link: string | null;
  capacity: number | null;
  is_registration_required: boolean;
  organiser_id: string | null;
  organiser_name: string | null;
  visibility: string;
  status: string;
  poster_image_path: string | null;
  poster_url: string | null;
  slideshow_url: string | null;
  more_info_path: string | null;
  resources: EventResource[];
  created_by_id: string | null;
  created_at: string;
}

export interface GroupEventListItem {
  id: string;
  slug: string;
  title: string;
  event_date: string | null;
  timezone: string;
  status: string;
  visibility: string;
  location_type: string | null;
  registration_count: number;
  program_id?: string | null;
  program_type?: string | null;
}

export interface FeaturedGroupEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  event_date: string;
  timezone: string;
  duration_minutes: number | null;
  location_type: string | null;
  location_name: string | null;
  meeting_link: string | null;
  group_id: string;
  group_slug: string;
  group_name: string;
  poster_url: string | null;
}

export interface GroupEventSummary {
  id: string;
  slug: string;
  title: string;
  event_date: string;
  timezone: string;
  duration_minutes: number | null;
  location_type: string | null;
  location_name: string | null;
  meeting_link: string | null;
  capacity: number | null;
  is_registration_required: boolean;
}

export interface CreateGroupEventInput {
  group_id: string;
  created_by_id: string;
  title: string;
  description: string;
  event_date: string;
  timezone: string;
  duration_minutes: number | null;
  location_type: string | null;
  location_name: string | null;
  location_address: string | null;
  meeting_link: string | null;
  capacity: number | null;
  is_registration_required: boolean;
  organiser_id: string | null;
  visibility: string;
  slideshow_url: string | null;
  more_info_path: string | null;
  resources: EventResource[];
}

export interface UpdateGroupEventInput extends Partial<CreateGroupEventInput> {
  poster_image_path?: string | null;
}

// ---------------------------------------------------------------------------
// Slug → UUID cache (admin client required — cache utility, not RLS-gated)
// ---------------------------------------------------------------------------

const _slugToDbId = new Map<string, string>();

export async function resolveEventDbId(slug: string): Promise<string | null> {
  if (_slugToDbId.has(slug)) return _slugToDbId.get(slug)!;
  try {
    const db = createAdminClient();
    const { data } = await db.from("group_events").select("id").eq("slug", slug)
      .single();
    if (data?.id) {
      _slugToDbId.set(slug, data.id as string);
      return data.id as string;
    }
  } catch { /* ignore */ }
  return null;
}

// ---------------------------------------------------------------------------
// Group event CRUD (from groups.ts) — use state.supabaseClient
// ---------------------------------------------------------------------------

export async function getGroupEventsSummary(
  groupId: string,
  state: State,
): Promise<GroupEvent[]> {
  try {
    const { data, error } = await state.supabaseClient
      .from("group_events")
      .select("id, event_date, status, group_programs(title)")
      .eq("group_id", groupId)
      .order("event_date", { ascending: false })
      .limit(20);
    if (error) return [];
    return (data ?? []).map((row) => {
      const r = row as unknown as {
        id: string;
        event_date: string | null;
        status: string;
        group_programs: { title: string | null } | null;
      };
      return {
        id: r.id,
        title: r.group_programs?.title ?? null,
        event_date: r.event_date,
        status: r.status,
      };
    });
  } catch {
    return [];
  }
}

export async function getGroupEventsForAdmin(
  groupId: string,
  state: State,
): Promise<GroupEventListItem[]> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("group_events")
      .select(
        "id, slug, program_id, event_date, timezone, status, visibility, location_type, group_programs!program_id(title, program_type)",
      )
      .eq("group_id", groupId)
      .order("event_date", { ascending: false });
    if (error) return [];
    const events = (data ?? []) as Array<Record<string, unknown>>;
    if (events.length === 0) return [];
    const eventIds = events.map((e) => e.id as string);
    const { data: regData } = await db.from("event_registrations").select(
      "event_id",
    ).in("event_id", eventIds).eq("status", "registered");
    const countMap: Record<string, number> = {};
    for (const r of (regData ?? []) as Array<{ event_id: string }>) {
      countMap[r.event_id] = (countMap[r.event_id] ?? 0) + 1;
    }
    return events.map((r) => {
      const prog = r.group_programs as {
        title: string | null;
        program_type: string | null;
      } | null;
      return {
        id: r.id as string,
        slug: r.slug as string,
        title: prog?.title ?? "(untitled)",
        event_date: (r.event_date as string | null) ?? null,
        timezone: (r.timezone as string) ?? "Australia/Sydney",
        status: r.status as string,
        visibility: r.visibility as string,
        location_type: (r.location_type as string | null) ?? null,
        registration_count: countMap[r.id as string] ?? 0,
        program_id: (r.program_id as string | null) ?? null,
        program_type: prog?.program_type ?? null,
      };
    });
  } catch {
    return [];
  }
}

export async function getGroupEventById(
  eventId: string,
  state: State,
): Promise<GroupEventDetail | null> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("group_events")
      .select(
        `id, slug, group_id, program_id, event_date, timezone, duration_minutes,
         location_type, location_name, location_address, meeting_link,
         capacity, is_registration_required, organiser_id,
         visibility, status, poster_image_path, slideshow_url, more_info_path, resources,
         created_by_id, created_at, title,
         group_programs!program_id(title, description, organiser_id, organiser:profiles!organiser_id(name_first, name_last)),
         organiser:profiles!organiser_id(name_first, name_last)`,
      )
      .eq("id", eventId).maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    let posterUrl: string | null = null;
    const posterPath = (row.poster_image_path as string | null) ?? null;
    if (posterPath) {
      try {
        // Admin client required: storage signed URLs need service role
        const admin = createAdminClient();
        const { data: sd } = await admin.storage.from("groups").createSignedUrl(
          posterPath,
          3600,
        );
        if (sd?.signedUrl) posterUrl = sd.signedUrl;
      } catch { /* non-fatal */ }
    }
    const prog = row.group_programs as {
      title: string | null;
      description: string | null;
      organiser_id: string | null;
      organiser: { name_first: string | null; name_last: string | null } | null;
    } | null;
    const eventOrg = row.organiser as {
      name_first: string | null;
      name_last: string | null;
    } | null;
    const effectiveOrganiserId = (row.organiser_id as string | null) ??
      prog?.organiser_id ?? null;
    const effectiveOrg = eventOrg ?? prog?.organiser ?? null;
    return {
      id: row.id as string,
      slug: row.slug as string,
      group_id: row.group_id as string,
      program_id: row.program_id as string,
      title: ((row.title ?? prog?.title) ?? "") as string,
      description: (prog?.description ?? "") as string,
      event_date: (row.event_date as string | null) ?? null,
      timezone: (row.timezone as string) ?? "Australia/Sydney",
      duration_minutes: (row.duration_minutes as number | null) ?? null,
      location_type: (row.location_type as string | null) ?? null,
      location_name: (row.location_name as string | null) ?? null,
      location_address: (row.location_address as string | null) ?? null,
      meeting_link: (row.meeting_link as string | null) ?? null,
      capacity: (row.capacity as number | null) ?? null,
      is_registration_required: (row.is_registration_required as boolean) ??
        true,
      organiser_id: effectiveOrganiserId,
      organiser_name: effectiveOrg
        ? [effectiveOrg.name_first, effectiveOrg.name_last].filter(Boolean)
          .join(" ") || null
        : null,
      visibility: (row.visibility as string) ?? "private",
      status: (row.status as string) ?? "draft",
      poster_image_path: posterPath,
      poster_url: posterUrl,
      slideshow_url: (row.slideshow_url as string | null) ?? null,
      more_info_path: (row.more_info_path as string | null) ?? null,
      resources: (row.resources as EventResource[] | null) ?? [],
      created_by_id: (row.created_by_id as string | null) ?? null,
      created_at: row.created_at as string,
    };
  } catch {
    return null;
  }
}

export async function createGroupEvent(
  input: CreateGroupEventInput,
  state: State,
): Promise<
  { eventId: string | null; programId: string | null; error: string | null }
> {
  try {
    const db = state.supabaseClient;
    const titleSlug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const dateStr = input.event_date
      ? Temporal.PlainDateTime.from(input.event_date).toPlainDate().toString()
      : Temporal.Now.plainDateISO("Australia/Sydney").toString();
    const baseSlug = `${titleSlug}-${dateStr}`;
    let eventSlug = baseSlug;
    for (let i = 2; i <= 20; i++) {
      const { data: existing } = await db.from("group_events").select("id").eq(
        "group_id",
        input.group_id,
      ).eq("slug", eventSlug).maybeSingle();
      if (!existing) break;
      eventSlug = `${baseSlug}-${i}`;
    }
    const programVisibility = input.visibility === "featured"
      ? "public"
      : input.visibility;
    let programId: string | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const programSlug = attempt === 0
        ? eventSlug
        : `${eventSlug}-p${attempt}`;
      const { data: pd, error: pe } = await db.from("group_programs").insert({
        slug: programSlug,
        group_id: input.group_id,
        title: input.title,
        description: input.description,
        program_type: "one-off",
        is_registration_required: input.is_registration_required,
        organiser_id: input.organiser_id ?? null,
        created_by_id: input.created_by_id ?? null,
        visibility: programVisibility,
        status: "draft",
      }).select("id").single();
      if (!pe && pd) {
        programId = (pd as { id: string }).id;
        break;
      }
      if (attempt === 2) {
        return {
          eventId: null,
          programId: null,
          error: pe?.message ?? "Failed to create program record",
        };
      }
    }
    if (!programId) {
      return {
        eventId: null,
        programId: null,
        error: "Failed to create program record",
      };
    }
    const { data: eventData, error: eventError } = await db.from("group_events")
      .insert({
        group_id: input.group_id,
        program_id: programId,
        slug: eventSlug,
        title: input.title,
        event_date: input.event_date,
        timezone: input.timezone,
        duration_minutes: input.duration_minutes ?? null,
        location_type: input.location_type ?? null,
        location_name: input.location_name ?? null,
        location_address: input.location_address ?? null,
        meeting_link: input.meeting_link ?? null,
        capacity: input.capacity ?? null,
        is_registration_required: input.is_registration_required,
        organiser_id: input.organiser_id ?? null,
        visibility: input.visibility,
        status: "draft",
        slideshow_url: input.slideshow_url ?? null,
        more_info_path: input.more_info_path ?? null,
        resources: input.resources,
        created_by_id: input.created_by_id,
      }).select("id").single();
    if (eventError) {
      return { eventId: null, programId: null, error: eventError.message };
    }
    return {
      eventId: (eventData as { id: string }).id,
      programId,
      error: null,
    };
  } catch (err) {
    return {
      eventId: null,
      programId: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function updateGroupEvent(
  eventId: string,
  input: UpdateGroupEventInput,
  state: State,
): Promise<{ error: string | null }> {
  try {
    const db = state.supabaseClient;
    const eventUpdate: Record<string, unknown> = {};
    if (input.event_date !== undefined) {
      eventUpdate.event_date = input.event_date;
    }
    if (input.timezone !== undefined) eventUpdate.timezone = input.timezone;
    if (input.duration_minutes !== undefined) {
      eventUpdate.duration_minutes = input.duration_minutes;
    }
    if (input.location_type !== undefined) {
      eventUpdate.location_type = input.location_type;
    }
    if (input.location_name !== undefined) {
      eventUpdate.location_name = input.location_name;
    }
    if (input.location_address !== undefined) {
      eventUpdate.location_address = input.location_address;
    }
    if (input.meeting_link !== undefined) {
      eventUpdate.meeting_link = input.meeting_link;
    }
    if (input.capacity !== undefined) eventUpdate.capacity = input.capacity;
    if (input.is_registration_required !== undefined) {
      eventUpdate.is_registration_required = input.is_registration_required;
    }
    if (input.organiser_id !== undefined) {
      eventUpdate.organiser_id = input.organiser_id;
    }
    if (input.visibility !== undefined) {
      eventUpdate.visibility = input.visibility;
    }
    if (input.slideshow_url !== undefined) {
      eventUpdate.slideshow_url = input.slideshow_url;
    }
    if (input.more_info_path !== undefined) {
      eventUpdate.more_info_path = input.more_info_path;
    }
    if (input.resources !== undefined) eventUpdate.resources = input.resources;
    if (input.poster_image_path !== undefined) {
      eventUpdate.poster_image_path = input.poster_image_path;
    }
    if (input.title !== undefined) eventUpdate.title = input.title;
    if (Object.keys(eventUpdate).length > 0) {
      const { error } = await db.from("group_events").update(eventUpdate).eq(
        "id",
        eventId,
      );
      if (error) return { error: error.message };
    }
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function publishGroupEvent(
  eventId: string,
  _publisherId: string,
  state: State,
): Promise<{ error: string | null }> {
  try {
    const db = state.supabaseClient;
    const { data: evRow, error: evError } = await db.from("group_events")
      .select(
        "program_id, group_id, title, event_date, timezone, location_type, location_name, meeting_link",
      )
      .eq("id", eventId).maybeSingle();
    if (evError || !evRow) {
      return { error: evError?.message ?? "Event not found" };
    }
    const ev = evRow as {
      program_id: string;
      group_id: string;
      title: string | null;
      event_date: string | null;
      timezone: string;
      location_type: string | null;
      location_name: string | null;
      meeting_link: string | null;
    };
    const { data: progRow } = await db.from("group_programs").select("title")
      .eq("id", ev.program_id).maybeSingle();
    const progTitle = (progRow as { title: string | null } | null)?.title;
    const { error: publishError } = await db.from("group_events").update({
      status: "published",
    }).eq("id", eventId);
    if (publishError) return { error: publishError.message };
    await db.from("group_programs").update({ status: "published" }).eq(
      "id",
      ev.program_id,
    );
    const { data: groupRow } = await db.from("groups").select("slug, name").eq(
      "id",
      ev.group_id,
    ).maybeSingle();
    const group = groupRow as { slug: string; name: string } | null;
    const eventTitle = ev.title ?? progTitle ?? "New event";
    // Admin client required: querying group_memberships.email_opt_in across RLS boundary for notification emails
    const admin = createAdminClient();
    const { data: members } = await admin
      .from("group_memberships")
      .select(
        "profiles!group_memberships_profile_id_fkey(email, name_first, name_last)",
      )
      .eq("group_id", ev.group_id).eq("status", "active").eq(
        "email_opt_in",
        true,
      ).limit(100);
    if (members && members.length > 0) {
      const ctaUrl = `${SITE_URL}/groups/${group?.slug ?? ""}/`;
      for (
        const m of members as unknown as Array<
          {
            profiles: {
              email: string;
              name_first: string | null;
              name_last: string | null;
            } | null;
          }
        >
      ) {
        if (!m.profiles?.email) continue;
        const recipientName =
          [m.profiles.name_first, m.profiles.name_last].filter(Boolean).join(
            " ",
          ) || "there";
        sendEmail({
          to: m.profiles.email,
          subject: `New event: ${eventTitle}`,
          html: buildEmailHtml(
            `<h2>New event: ${eventTitle}</h2><p>Hi ${recipientName}, a new event has been added to your ${
              group?.name ?? "Future Together"
            } group. <a href="${ctaUrl}">View group &rarr;</a></p>`,
            `New event from ${group?.name ?? "Future Together"}: ${eventTitle}`,
          ),
        }).catch((err) =>
          console.error("publishGroupEvent notification email:", err)
        );
      }
    }
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function cancelGroupEvent(
  eventId: string,
  state: State,
): Promise<{ error: string | null }> {
  try {
    const db = state.supabaseClient;
    const { data: evRow, error: evError } = await db.from("group_events")
      .select("title, program_id").eq("id", eventId).maybeSingle();
    if (evError || !evRow) {
      return { error: evError?.message ?? "Event not found" };
    }
    const ev = evRow as { title: string | null; program_id: string };
    const { data: progRow } = await db.from("group_programs").select("title")
      .eq("id", ev.program_id).maybeSingle();
    const eventTitle = ev.title ??
      (progRow as { title: string | null } | null)?.title ?? "Event";
    const { error: cancelError } = await db.from("group_events").update({
      status: "cancelled",
    }).eq("id", eventId);
    if (cancelError) return { error: cancelError.message };
    // Admin client required: querying event_registrations across RLS boundary for cancellation notification emails
    const admin = createAdminClient();
    const { data: registrants } = await admin.from("event_registrations")
      .select("email").eq("event_id", eventId).eq("status", "registered");
    if (registrants && registrants.length > 0) {
      for (const reg of registrants as Array<{ email: string | null }>) {
        if (!reg.email) continue;
        sendEmail({
          to: reg.email,
          subject: `Event cancelled: ${eventTitle}`,
          html: buildEmailHtml(
            `<h2>Event cancelled: ${eventTitle}</h2><p>We're sorry to inform you that <strong>${eventTitle}</strong> has been cancelled.</p>`,
            `Event cancelled: ${eventTitle}`,
          ),
        }).catch((err) =>
          console.error("cancelGroupEvent notification email:", err)
        );
      }
    }
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function getFeaturedGroupEvents(
  state: State,
): Promise<FeaturedGroupEvent[]> {
  try {
    const db = state.supabaseClient;
    const now = Temporal.Now.plainDateTimeISO("Australia/Sydney").toString({
      smallestUnit: "second",
    });
    const { data, error } = await db
      .from("group_events")
      .select(
        `id, slug, title, event_date, timezone, duration_minutes, location_type, location_name, meeting_link, poster_image_path, group_id, group_programs!program_id(description), groups!group_id(slug, name)`,
      )
      .eq("visibility", "featured").eq("status", "published").gt(
        "event_date",
        now,
      )
      .order("event_date", { ascending: true }).limit(10);
    if (error) return [];
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    return await Promise.all(rows.map(async (row) => {
      const prog = row.group_programs as { description: string | null } | null;
      const grp = row.groups as { slug: string; name: string } | null;
      let posterUrl: string | null = null;
      const posterPath = (row.poster_image_path as string | null) ?? null;
      if (posterPath) {
        try {
          // Admin client required: storage signed URLs need service role
          const admin = createAdminClient();
          const { data: sd } = await admin.storage.from("groups")
            .createSignedUrl(posterPath, 3600);
          if (sd?.signedUrl) posterUrl = sd.signedUrl;
        } catch { /* non-fatal */ }
      }
      return {
        id: row.id as string,
        slug: row.slug as string,
        title: (row.title as string) ?? "",
        description: prog?.description ?? "",
        event_date: row.event_date as string,
        timezone: (row.timezone as string) ?? "Australia/Sydney",
        duration_minutes: (row.duration_minutes as number | null) ?? null,
        location_type: (row.location_type as string | null) ?? null,
        location_name: (row.location_name as string | null) ?? null,
        meeting_link: (row.meeting_link as string | null) ?? null,
        group_id: row.group_id as string,
        group_slug: grp?.slug ?? "",
        group_name: grp?.name ?? "",
        poster_url: posterUrl,
      };
    }));
  } catch {
    return [];
  }
}

export async function getUpcomingGroupEvents(
  groupId: string,
  state: State,
  limit = 5,
): Promise<GroupEventSummary[]> {
  try {
    const now = nowAsNaiveLocal("Australia/Sydney");
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("group_events")
      .select(
        "id, slug, title, event_date, timezone, duration_minutes, location_type, location_name, meeting_link, capacity, is_registration_required, group_programs!program_id(title)",
      )
      .eq("group_id", groupId).eq("status", "published").gt("event_date", now)
      .order("event_date", { ascending: true }).limit(limit);
    if (error || !data) return [];
    return (data as Array<Record<string, unknown>>).map((row) => {
      const prog = row.group_programs as { title: string | null } | null;
      return {
        id: row.id,
        slug: row.slug,
        title: (row.title as string | null) ?? prog?.title ?? "Event",
        event_date: row.event_date,
        timezone: row.timezone,
        duration_minutes: row.duration_minutes,
        location_type: row.location_type,
        location_name: row.location_name,
        meeting_link: row.meeting_link,
        capacity: row.capacity,
        is_registration_required: row.is_registration_required,
      } as GroupEventSummary;
    });
  } catch {
    return [];
  }
}
