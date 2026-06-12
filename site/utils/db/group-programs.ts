/**
 * site/utils/db/group-programs.ts
 *
 * Recurring program (group_programs) types and data-access functions.
 * All sourced from site/utils/groups.ts — no logic changes.
 */

import { expandRRule } from "@/utils/recurrence.ts";
import type { EventResource } from "@/utils/db/group-events.ts";
import type { GroupEventListItem } from "@/utils/db/group-events.ts";
import type { State } from "@/utils.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GroupProgramDetail {
  id: string;
  group_id: string;
  slug: string;
  title: string;
  description: string | null;
  program_type: "recurring" | "one-off";
  recurrence_rule: string | null; // iCal RRULE (was incorrectly named 'rrule')
  seed_datetime: string | null; // naive local RRULE anchor
  seed_timezone: string | null; // IANA tz for seed + instance generation
  sequence: number; // distinguishes programs within a multi-sequence series
  slug_suffix: string | null; // optional suffix appended to generated event slugs
  duration_minutes: number | null;
  capacity: number | null;
  registration_deadline_days: number | null;
  is_registration_required: boolean;
  location_type: string | null;
  location_name: string | null;
  location_address: string | null;
  meeting_link: string | null;
  organiser_id: string | null;
  presented_by: string | null;
  sponsored_by: string | null;
  poster_image_path: string | null;
  slideshow_url: string | null;
  more_info_path: string | null;
  topics: string[] | null;
  resources: EventResource[];
  visibility: string;
  status: string;
  created_by_id: string | null;
  created_at: string;
  updated_at: string;
  instance_count: number; // computed — not a DB column
}

export interface CreateGroupProgramInput {
  group_id: string;
  created_by_id: string;
  title: string;
  description?: string | null;
  program_type?: "recurring" | "one-off";
  recurrence_rule?: string | null;
  seed_datetime?: string | null;
  seed_timezone?: string | null;
  sequence?: number;
  slug_suffix?: string | null;
  location_type?: string | null;
  location_name?: string | null;
  location_address?: string | null;
  meeting_link?: string | null;
  duration_minutes?: number | null;
  capacity?: number | null;
  registration_deadline_days?: number | null;
  is_registration_required?: boolean;
  organiser_id?: string | null;
  presented_by?: string | null;
  sponsored_by?: string | null;
  poster_image_path?: string | null;
  slideshow_url?: string | null;
  more_info_path?: string | null;
  topics?: string[] | null;
  resources?: EventResource[];
  visibility?: string;
}

export type UpdateGroupProgramInput = Partial<CreateGroupProgramInput>;

export interface GroupEventWithProgramDefaults {
  id: string;
  slug: string;
  title: string;
  event_date: string | null;
  timezone: string;
  duration_minutes: number | null;
  /** Event-level override (null = inherit from program) */
  location_type: string | null;
  location_name: string | null;
  location_address: string | null;
  meeting_link: string | null;
  capacity: number | null;
  is_registration_required: boolean | null;
  organiser_id: string | null;
  visibility: string;
  status: string;
  slideshow_url: string | null;
  more_info_path: string | null;
  resources: EventResource[];
  program: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    duration_minutes: number | null;
    location_type: string | null;
    location_name: string | null;
    location_address: string | null;
    meeting_link: string | null;
    capacity: number | null;
    organiser_id: string | null;
    slideshow_url: string | null;
    more_info_path: string | null;
    resources: EventResource[];
    is_registration_required: boolean;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapProgramRow(
  row: Record<string, unknown>,
  instanceCount: number,
): GroupProgramDetail {
  return {
    id: row.id as string,
    group_id: row.group_id as string,
    slug: row.slug as string,
    title: (row.title as string) ?? "",
    description: (row.description as string | null) ?? null,
    program_type: (row.program_type as "recurring" | "one-off") ?? "one-off",
    recurrence_rule: (row.recurrence_rule as string | null) ?? null,
    seed_datetime: (row.seed_datetime as string | null) ?? null,
    seed_timezone: (row.seed_timezone as string | null) ?? null,
    sequence: (row.sequence as number) ?? 1,
    slug_suffix: (row.slug_suffix as string | null) ?? null,
    duration_minutes: (row.duration_minutes as number | null) ?? null,
    capacity: (row.capacity as number | null) ?? null,
    registration_deadline_days:
      (row.registration_deadline_days as number | null) ?? null,
    is_registration_required: (row.is_registration_required as boolean) ?? true,
    location_type: (row.location_type as string | null) ?? null,
    location_name: (row.location_name as string | null) ?? null,
    location_address: (row.location_address as string | null) ?? null,
    meeting_link: (row.meeting_link as string | null) ?? null,
    organiser_id: (row.organiser_id as string | null) ?? null,
    presented_by: (row.presented_by as string | null) ?? null,
    sponsored_by: (row.sponsored_by as string | null) ?? null,
    poster_image_path: (row.poster_image_path as string | null) ?? null,
    slideshow_url: (row.slideshow_url as string | null) ?? null,
    more_info_path: (row.more_info_path as string | null) ?? null,
    topics: (row.topics as string[] | null) ?? null,
    resources: (row.resources as EventResource[] | null) ?? [],
    visibility: (row.visibility as string) ?? "private",
    status: (row.status as string) ?? "draft",
    created_by_id: (row.created_by_id as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: (row.updated_at as string) ?? (row.created_at as string),
    instance_count: instanceCount,
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getGroupProgramById(
  programId: string,
  state: State,
): Promise<GroupProgramDetail | null> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("group_programs")
      .select("*")
      .eq("id", programId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    const { count } = await db
      .from("group_events")
      .select("*", { count: "exact", head: true })
      .eq("program_id", programId);
    return mapProgramRow(row, count ?? 0);
  } catch {
    return null;
  }
}

export async function getGroupEventsForProgram(
  programId: string,
  state: State,
): Promise<GroupEventListItem[]> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("group_events")
      .select(
        "id, slug, event_date, timezone, status, visibility, location_type, capacity, program_id, group_programs!program_id(title)",
      )
      .eq("program_id", programId)
      .order("event_date", { ascending: false });
    if (error || !data) return [];
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const eventIds = rows.map((r) => r.id as string);
    const { data: regData } = eventIds.length > 0
      ? await db
        .from("event_registrations")
        .select("event_id")
        .in("event_id", eventIds)
        .eq("status", "registered")
      : { data: [] };
    const countMap: Record<string, number> = {};
    for (const r of (regData ?? []) as Array<{ event_id: string }>) {
      countMap[r.event_id] = (countMap[r.event_id] ?? 0) + 1;
    }
    return rows.map((r) => {
      const prog = r.group_programs as { title: string | null } | null;
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
        program_id: programId,
      };
    });
  } catch {
    return [];
  }
}

export async function getLinkedEventForProgram(
  programId: string,
  state: State,
): Promise<string | null> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("group_events")
      .select("id")
      .eq("program_id", programId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return (data as { id: string }).id;
  } catch {
    return null;
  }
}

export async function createGroupProgram(
  input: CreateGroupProgramInput,
  state: State,
): Promise<{ programId: string | null; error: string | null }> {
  try {
    const db = state.supabaseClient;
    const titleSlug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    let programSlug = titleSlug;
    const sequence = input.sequence ?? 1;
    for (let i = 2; i <= 20; i++) {
      const { data: existing } = await db
        .from("group_programs")
        .select("id")
        .eq("group_id", input.group_id)
        .eq("slug", programSlug)
        .eq("sequence", sequence)
        .maybeSingle();
      if (!existing) break;
      programSlug = `${titleSlug}-${i}`;
    }
    const { data, error } = await db.from("group_programs").insert({
      slug: programSlug,
      group_id: input.group_id,
      title: input.title,
      description: input.description ?? null,
      program_type: input.program_type ?? "one-off",
      recurrence_rule: input.recurrence_rule ?? null,
      seed_datetime: input.seed_datetime ?? null,
      seed_timezone: input.seed_timezone ?? null,
      sequence: sequence,
      slug_suffix: input.slug_suffix ?? null,
      duration_minutes: input.duration_minutes ?? null,
      capacity: input.capacity ?? null,
      registration_deadline_days: input.registration_deadline_days ?? null,
      is_registration_required: input.is_registration_required ?? true,
      location_type: input.location_type ?? null,
      location_name: input.location_name ?? null,
      location_address: input.location_address ?? null,
      meeting_link: input.meeting_link ?? null,
      visibility: input.visibility ?? "private",
      status: "draft",
      organiser_id: input.organiser_id ?? null,
      presented_by: input.presented_by ?? null,
      sponsored_by: input.sponsored_by ?? null,
      slideshow_url: input.slideshow_url ?? null,
      more_info_path: input.more_info_path ?? null,
      topics: input.topics ?? null,
      resources: input.resources ?? [],
      created_by_id: input.created_by_id,
    }).select("id").single();
    if (error) return { programId: null, error: error.message };
    return { programId: (data as { id: string }).id, error: null };
  } catch (err) {
    return {
      programId: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function updateGroupProgram(
  programId: string,
  input: UpdateGroupProgramInput,
  state: State,
): Promise<{ error: string | null }> {
  try {
    const db = state.supabaseClient;
    const update: Record<string, unknown> = {};
    const fields: Array<keyof UpdateGroupProgramInput> = [
      "title",
      "description",
      "program_type",
      "recurrence_rule",
      "seed_datetime",
      "seed_timezone",
      "sequence",
      "slug_suffix",
      "duration_minutes",
      "capacity",
      "registration_deadline_days",
      "is_registration_required",
      "location_type",
      "location_name",
      "location_address",
      "meeting_link",
      "visibility",
      "organiser_id",
      "presented_by",
      "sponsored_by",
      "poster_image_path",
      "slideshow_url",
      "more_info_path",
      "topics",
      "resources",
    ];
    for (const key of fields) {
      if (input[key] !== undefined) update[key as string] = input[key];
    }
    if (Object.keys(update).length === 0) return { error: null };
    const { error } = await db.from("group_programs").update(update).eq(
      "id",
      programId,
    );
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function publishGroupProgram(
  programId: string,
  state: State,
): Promise<{ error: string | null }> {
  try {
    const db = state.supabaseClient;
    const program = await getGroupProgramById(programId, state);
    if (!program) return { error: "Program not found" };
    if (program.program_type === "recurring" && program.recurrence_rule) {
      const tz = program.seed_timezone ?? "Australia/Sydney";
      const seedDatetime = program.seed_datetime;
      if (!seedDatetime) {
        return { error: "Program has no seed_datetime — cannot expand RRULE" };
      }
      let occurrences: Temporal.PlainDateTime[] = [];
      try {
        occurrences = expandRRule(program.recurrence_rule, seedDatetime, tz, 3);
      } catch (err) {
        return {
          error: `Invalid RRULE: ${
            err instanceof Error ? err.message : String(err)
          }`,
        };
      }
      const { data: existing } = await db
        .from("group_events")
        .select("event_date")
        .eq("program_id", programId);
      // DB stores event_date as naive local string "YYYY-MM-DD HH:mm"; PlainDateTime.toString() gives "YYYY-MM-DDTHH:mm:ss"
      const existingDates = new Set(
        (existing ?? []).map((r) =>
          (r as { event_date: string }).event_date.slice(0, 16)
        ),
      );
      const toCreate = occurrences.filter((date) => {
        const iso = date.toString().slice(0, 16).replace("T", " ");
        return !existingDates.has(iso);
      });
      const suffix = program.slug_suffix ? `-${program.slug_suffix}` : "";
      for (const date of toCreate) {
        const dateStr = date.toString().slice(0, 19).replace("T", " ");
        const datePart = dateStr.split(" ")[0];
        const eventSlug = `${program.slug}-${datePart}${suffix}`;
        await db.from("group_events").insert({
          group_id: program.group_id,
          program_id: programId,
          slug: eventSlug,
          event_date: dateStr,
          timezone: tz,
          duration_minutes: program.duration_minutes,
          location_type: program.location_type,
          location_name: program.location_name,
          location_address: program.location_address,
          meeting_link: program.meeting_link,
          capacity: program.capacity,
          // is_registration_required intentionally omitted — NULL inherits from program
          organiser_id: program.organiser_id,
          slideshow_url: program.slideshow_url,
          more_info_path: program.more_info_path,
          resources: program.resources,
          visibility: program.visibility,
          status: "draft",
        }).select("id");
      }
    }
    const { error } = await db
      .from("group_programs")
      .update({ status: "published" })
      .eq("id", programId);
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function getGroupPrograms(
  groupId: string,
  state: State,
): Promise<GroupProgramDetail[]> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("group_programs")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    const programs = await Promise.all(
      (data as Record<string, unknown>[]).map(async (row) => {
        const { count } = await db
          .from("group_events")
          .select("*", { count: "exact", head: true })
          .eq("program_id", row.id as string);
        return mapProgramRow(row, count ?? 0);
      }),
    );
    return programs;
  } catch {
    return [];
  }
}

export async function getGroupEventWithProgramDefaults(
  eventId: string,
  state: State,
): Promise<GroupEventWithProgramDefaults | null> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("group_events")
      .select(
        `id, slug, title, event_date, timezone, duration_minutes, location_type, location_name,
         location_address, meeting_link, capacity, is_registration_required, organiser_id,
         visibility, status, slideshow_url, more_info_path, resources,
         group_programs!program_id(id, slug, title, description, duration_minutes, location_type,
           location_name, location_address, meeting_link, capacity, organiser_id, slideshow_url, more_info_path,
           resources, is_registration_required)`,
      )
      .eq("id", eventId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    const prog = row.group_programs as Record<string, unknown>;
    return {
      id: row.id as string,
      slug: row.slug as string,
      title: (row.title as string | null) ?? (prog?.title as string | null) ??
        "",
      event_date: (row.event_date as string | null) ?? null,
      timezone: (row.timezone as string) ?? "Australia/Sydney",
      duration_minutes: (row.duration_minutes as number | null) ?? null,
      location_type: (row.location_type as string | null) ?? null,
      location_name: (row.location_name as string | null) ?? null,
      location_address: (row.location_address as string | null) ?? null,
      meeting_link: (row.meeting_link as string | null) ?? null,
      capacity: (row.capacity as number | null) ?? null,
      is_registration_required:
        (row.is_registration_required as boolean | null) ?? null,
      organiser_id: (row.organiser_id as string | null) ?? null,
      visibility: (row.visibility as string) ?? "private",
      status: (row.status as string) ?? "draft",
      slideshow_url: (row.slideshow_url as string | null) ?? null,
      more_info_path: (row.more_info_path as string | null) ?? null,
      resources: (row.resources as EventResource[] | null) ?? [],
      program: {
        id: (prog?.id as string) ?? "",
        slug: (prog?.slug as string) ?? "",
        title: (prog?.title as string | null) ?? "",
        description: (prog?.description as string | null) ?? null,
        duration_minutes: (prog?.duration_minutes as number | null) ?? null,
        location_type: (prog?.location_type as string | null) ?? null,
        location_name: (prog?.location_name as string | null) ?? null,
        location_address: (prog?.location_address as string | null) ?? null,
        meeting_link: (prog?.meeting_link as string | null) ?? null,
        capacity: (prog?.capacity as number | null) ?? null,
        organiser_id: (prog?.organiser_id as string | null) ?? null,
        slideshow_url: (prog?.slideshow_url as string | null) ?? null,
        more_info_path: (prog?.more_info_path as string | null) ?? null,
        resources: (prog?.resources as EventResource[] | null) ?? [],
        is_registration_required: (prog?.is_registration_required as boolean) ??
          true,
      },
    };
  } catch {
    return null;
  }
}

export async function createGroupEventForProgram(
  programId: string,
  eventDate: string,
  groupId: string,
  createdById: string,
  state: State,
): Promise<{ eventId: string | null; error: string | null }> {
  try {
    const program = await getGroupProgramById(programId, state);
    if (!program) return { eventId: null, error: "Program not found" };
    const db = state.supabaseClient;
    const tz = program.seed_timezone ?? "Australia/Sydney";
    const datePart = eventDate.split("T")[0] ?? eventDate.split(" ")[0];
    const suffix = program.slug_suffix ? `-${program.slug_suffix}` : "";
    const baseSlug = `${program.slug}-${datePart}${suffix}`;
    let eventSlug = baseSlug;
    for (let i = 2; i <= 20; i++) {
      const { data: existing } = await db
        .from("group_events")
        .select("id")
        .eq("group_id", groupId)
        .eq("slug", eventSlug)
        .maybeSingle();
      if (!existing) break;
      eventSlug = `${baseSlug}-${i}`;
    }
    const { data, error } = await db.from("group_events").insert({
      group_id: groupId,
      program_id: programId,
      slug: eventSlug,
      event_date: eventDate,
      timezone: tz,
      duration_minutes: program.duration_minutes,
      location_type: program.location_type,
      location_name: program.location_name,
      location_address: program.location_address,
      meeting_link: program.meeting_link,
      capacity: program.capacity,
      // is_registration_required intentionally omitted — NULL inherits from program
      organiser_id: program.organiser_id,
      slideshow_url: program.slideshow_url,
      more_info_path: program.more_info_path,
      resources: program.resources,
      visibility: program.visibility,
      status: "draft",
      created_by_id: createdById,
    }).select("id").single();
    if (error) return { eventId: null, error: error.message };
    return { eventId: (data as { id: string }).id, error: null };
  } catch (err) {
    return {
      eventId: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function getRecentPastInstances(
  groupId: string,
  limit = 5,
  state: State,
): Promise<(GroupEventListItem & { program_id: string })[]> {
  try {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("group_events")
      .select(
        "id, slug, event_date, timezone, status, visibility, location_type, program_id, group_programs!program_id(title, program_type)",
      )
      .eq("group_id", groupId)
      .lt("event_date", now)
      .order("event_date", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map((r) => {
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
        registration_count: 0,
        program_id: r.program_id as string,
        program_type: prog?.program_type ?? null,
      };
    });
  } catch {
    return [];
  }
}

export async function getNextEventsForPrograms(
  programIds: string[],
  state: State,
): Promise<Record<string, GroupEventListItem>> {
  if (programIds.length === 0) return {};
  try {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("group_events")
      .select(
        "id, slug, event_date, timezone, status, visibility, location_type, program_id, group_programs!program_id(title)",
      )
      .in("program_id", programIds)
      .eq("status", "published")
      .gt("event_date", now)
      .order("event_date", { ascending: true });
    if (error || !data) return {};
    const result: Record<string, GroupEventListItem> = {};
    for (const r of data as Array<Record<string, unknown>>) {
      const programId = r.program_id as string;
      if (!result[programId]) {
        const prog = r.group_programs as { title: string | null } | null;
        result[programId] = {
          id: r.id as string,
          slug: r.slug as string,
          title: prog?.title ?? "(untitled)",
          event_date: (r.event_date as string | null) ?? null,
          timezone: (r.timezone as string) ?? "Australia/Sydney",
          status: r.status as string,
          visibility: r.visibility as string,
          location_type: (r.location_type as string | null) ?? null,
          registration_count: 0,
          program_id: programId,
        };
      }
    }
    return result;
  } catch {
    return {};
  }
}
