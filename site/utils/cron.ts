import { expandRRule } from "@/utils/recurrence.ts";
import { createAdminClient } from "@/utils/supabase.ts";
import {
  getRegistrationsNeedingReminder,
  hasOrganizerReminderBeenSent,
  updateOrganizerReminderSent,
  updateReminderSent,
} from "@/utils/db/group-registrations.ts";
import {
  sendOrganizerReminderEmail,
  sendReminderEmail,
} from "@/utils/email/eventEmail.ts";

/**
 * Fetches registrations needing a reminder of the given type, sends each
 * reminder email, and marks it as sent in KV.
 *
 * Called by Deno.cron() in main.ts — not via HTTP.
 */
export async function sendReminders(
  type: "day_before" | "hour_before",
): Promise<void> {
  const { events, registrations } = await getRegistrationsNeedingReminder(type);
  console.log(
    `[cron] ${type}: events=${events.length} registrations=${registrations.length}`,
  );

  // --- Attendee reminder emails ---
  if (registrations.length > 0) {
    const attendeeResults = await Promise.allSettled(
      registrations.map(async ({ event, registration }) => {
        const sent = await sendReminderEmail(event, registration, type);
        if (sent) await updateReminderSent(event.id, registration.id, type);
        return { sent, email: registration.attendee.email };
      }),
    );

    const sent = attendeeResults.filter(
      (r) => r.status === "fulfilled" && r.value.sent,
    ).length;
    const failed = attendeeResults.length - sent;
    console.log(`[cron] ${type}: attendee sent=${sent} failed=${failed}`);
  }

  // --- Organiser reminder emails ---
  // Build a map of eventId → registrations for that event
  const regsByEvent = new Map<
    string,
    typeof registrations[number]["registration"][]
  >();
  for (const { event, registration } of registrations) {
    const list = regsByEvent.get(event.id) ?? [];
    list.push(registration);
    regsByEvent.set(event.id, list);
  }

  const organiserResults = await Promise.allSettled(
    events
      .filter((event) => !!event.organizer?.email)
      .map(async (event) => {
        const alreadySent = await hasOrganizerReminderBeenSent(event.id, type);
        if (alreadySent) {
          return {
            sent: false,
            organizer: event.organizer!.email,
            skipped: true,
          };
        }
        const regsForEvent = regsByEvent.get(event.id) ?? [];
        const sent = await sendOrganizerReminderEmail(
          event,
          regsForEvent,
          type,
        );
        if (sent) await updateOrganizerReminderSent(event.id, type);
        return { sent, organizer: event.organizer!.email, skipped: false };
      }),
  );

  const orgSent =
    organiserResults.filter((r) => r.status === "fulfilled" && r.value.sent)
      .length;
  const orgSkipped =
    organiserResults.filter((r) => r.status === "fulfilled" && r.value.skipped)
      .length;
  const orgFailed = organiserResults.length - orgSent - orgSkipped;
  console.log(
    `[cron] ${type}: organiser sent=${orgSent} skipped=${orgSkipped} failed=${orgFailed}`,
  );
}

// ---------------------------------------------------------------------------
// Recurring event instance generation
// ---------------------------------------------------------------------------

/**
 * Generate upcoming event instances for a single recurring program.
 * Maintains a 3-month lookahead; skips dates where an instance already exists.
 * Auto-publishes instances when the program is published.
 * Uses Supabase admin client since no `user` is in context for cron jobs
 *
 * Called directly on program publish and weekly via Deno.cron.
 */
export async function generateRecurringInstancesForProgram(
  programId: string,
): Promise<{ created: number; error: string | null }> {
  try {
    const admin = createAdminClient();

    const { data: prog, error: progError } = await admin
      .from("group_programs")
      .select(
        "id, slug, slug_suffix, group_id, recurrence_rule, seed_datetime, seed_timezone, status, visibility, duration_minutes, capacity, registration_deadline_days",
      )
      .eq("id", programId)
      .eq("program_type", "recurring")
      .maybeSingle();

    if (progError || !prog) {
      return {
        created: 0,
        error: progError?.message ?? "Program not found or not recurring",
      };
    }

    const p = prog as {
      id: string;
      slug: string;
      slug_suffix: string | null;
      group_id: string;
      recurrence_rule: string | null;
      seed_datetime: string | null;
      seed_timezone: string | null;
      status: string;
      visibility: string;
      duration_minutes: number | null;
      capacity: number | null;
      registration_deadline_days: number | null;
    };

    if (!p.recurrence_rule || !p.seed_datetime || !p.seed_timezone) {
      return {
        created: 0,
        error:
          "Program missing recurrence_rule, seed_datetime, or seed_timezone",
      };
    }

    // Expand recurrence rule → Temporal.PlainDateTime[] (3-month lookahead)
    const dates = expandRRule(
      p.recurrence_rule,
      p.seed_datetime,
      p.seed_timezone,
      3,
    );
    if (dates.length === 0) return { created: 0, error: null };

    // Fetch existing event dates for this program to avoid duplicates
    const { data: existing } = await admin
      .from("group_events")
      .select("event_date")
      .eq("program_id", p.id);

    const existingDates = new Set(
      ((existing ?? []) as Array<{ event_date: string | null }>)
        .map((e) => e.event_date?.slice(0, 10))
        .filter(Boolean) as string[],
    );

    // Auto-publish if program is published; otherwise draft
    const eventStatus = p.status === "published" ? "published" : "draft";

    let created = 0;
    for (const dt of dates) {
      // dt is a Temporal.PlainDateTime — extract date portion for dedup check
      const datePart = dt.toPlainDate().toString(); // YYYY-MM-DD
      if (existingDates.has(datePart)) continue;

      // Slug: [program.slug]-[slug_suffix]-[YYYY-MM-DD] or [program.slug]-[YYYY-MM-DD]
      const eventSlug = p.slug_suffix
        ? `${p.slug}-${p.slug_suffix}-${datePart}`
        : `${p.slug}-${datePart}`;

      const eventDate = dt.toString({ smallestUnit: "second" });

      const { error: insertError } = await admin
        .from("group_events")
        .insert({
          group_id: p.group_id,
          program_id: p.id,
          slug: eventSlug,
          event_date: eventDate,
          timezone: p.seed_timezone,
          duration_minutes: p.duration_minutes ?? null,
          capacity: p.capacity ?? null,
          registration_deadline_days: p.registration_deadline_days ?? null,
          visibility: p.visibility ?? "public",
          status: eventStatus,
          is_registration_required: true,
        });

      if (insertError) {
        // Log and continue — may be a transient conflict
        console.error(
          `[cron] generateRecurringInstances: insert failed for ${eventSlug}:`,
          insertError.message,
        );
        continue;
      }

      created++;
      existingDates.add(datePart); // prevent intra-run duplicates
    }

    console.log(
      `[cron] generateRecurringInstancesForProgram: program=${p.id} created=${created}`,
    );
    return { created, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[cron] generateRecurringInstancesForProgram:", msg);
    return { created: 0, error: msg };
  }
}

/**
 * Generate recurring event instances for all published recurring programs.
 * Maintains a 3-month lookahead. Called weekly via Deno.cron in main.ts.
 * Can also be called directly when a program is published.
 * Uses Supabase admin client since no `user` is in context for cron jobs
 */
export async function generateRecurringInstances(): Promise<void> {
  try {
    const admin = createAdminClient();

    const { data: programs, error } = await admin
      .from("group_programs")
      .select("id")
      .eq("program_type", "recurring")
      .eq("status", "published")
      .not("recurrence_rule", "is", null)
      .not("seed_datetime", "is", null)
      .not("seed_timezone", "is", null);

    if (error) {
      console.error(
        "[cron] generateRecurringInstances: fetch error:",
        error.message,
      );
      return;
    }

    const ids = ((programs ?? []) as Array<{ id: string }>).map((p) => p.id);
    console.log(
      `[cron] generateRecurringInstances: ${ids.length} program(s) to process`,
    );

    let totalCreated = 0;
    for (const id of ids) {
      const { created } = await generateRecurringInstancesForProgram(id);
      totalCreated += created;
    }

    console.log(
      `[cron] generateRecurringInstances: done, totalCreated=${totalCreated}`,
    );
  } catch (err) {
    console.error(
      "[cron] generateRecurringInstances:",
      err instanceof Error ? err.message : err,
    );
  }
}
