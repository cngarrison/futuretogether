#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write
/**
 * site/scripts/migrate-kv.ts
 *
 * Migrates legacy Deno KV data → Supabase tables.
 * Run from site/ directory: deno task migrate-kv
 *
 * Data migrated:
 *   1. Members        → auth.users + profiles + group_memberships
 *   2. Registrations  → event_registrations + event_reminder_logs
 *   3. Broadcasts     → email_sends
 *
 * Flags:
 *   --dry-run             Print what would be written without touching Supabase
 *   --skip-members        Skip member migration
 *   --skip-registrations  Skip event registration migration
 *   --skip-broadcasts     Skip email broadcast migration
 *   --env <local|prod>    Environment target (default: local)
 *
 * KV connection (checked in order):
 *   FT_KV_URL    Remote KV URL (e.g. wss://api.deno.com/databases/…/connect)
 *   FT_KV_PATH   Path to a local KV SQLite file
 *   (default)    Deno.openKv() — default local KV for this project
 *
 * Broadcasts: set FT_ADMIN_EMAIL to the sender's email address so the
 * script can resolve sent_by_id.  Falls back to the first ft-global organiser.
 */

import { load as loadDotenv } from "@std/dotenv";
import { parseArgs } from "@std/cli";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = parseArgs(Deno.args, {
  boolean: [
    "dry-run",
    "skip-members",
    "skip-registrations",
    "skip-broadcasts",
    "skip-staff-log",
  ],
  string: ["env"],
  default: { env: "local" },
});

const isDryRun = args["dry-run"] as boolean;
const skipMembers = args["skip-members"] as boolean;
const skipRegistrations = args["skip-registrations"] as boolean;
const skipBroadcasts = args["skip-broadcasts"] as boolean;
const skipStaffLog = args["skip-staff-log"] as boolean;
const envTarget = args["env"] as string;

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

await loadDotenv({ export: true, envPath: `.env.${envTarget}` });
console.log(
  `[env] Using ${envTarget} environment${
    isDryRun ? " (DRY RUN — no writes)" : ""
  }`,
);

// ---------------------------------------------------------------------------
// KV connection
// ---------------------------------------------------------------------------

const kvUrl = Deno.env.get("FT_KV_URL");
const kvPath = Deno.env.get("FT_KV_PATH");

let kv: Deno.Kv;
if (kvUrl) {
  console.log(`[kv] Remote KV: ${kvUrl}`);
  kv = await Deno.openKv(kvUrl);
} else if (kvPath) {
  console.log(`[kv] Local KV file: ${kvPath}`);
  kv = await Deno.openKv(kvPath);
} else {
  console.log("[kv] Default local KV");
  kv = await Deno.openKv();
}

// ---------------------------------------------------------------------------
// Supabase admin client (dynamic import — env must be set first)
// ---------------------------------------------------------------------------

const { createAdminClient } = await import("../utils/supabase.ts");
const admin = createAdminClient();

// ---------------------------------------------------------------------------
// Summary stats
// ---------------------------------------------------------------------------

const stats = {
  members: { total: 0, created: 0, skipped: 0, errors: 0 },
  registrations: { total: 0, inserted: 0, skipped: 0, errors: 0 },
  reminderLogs: { total: 0, inserted: 0, errors: 0 },
  emailConsents: { inserted: 0, errors: 0 },
  broadcasts: { total: 0, inserted: 0, skipped: 0, errors: 0 },
  staffLog: { total: 0, inserted: 0, skipped: 0, errors: 0 },
};

// ---------------------------------------------------------------------------
// KV data interfaces  (mirrors *.kv.deprecated.ts files)
// ---------------------------------------------------------------------------

type MemberRole = "member" | "organiser";
type MemberSource = "join_form" | "event_registration";

interface KvMember {
  id: string;
  email: string; // always lowercase in KV
  firstName: string;
  lastName: string;
  joinedAt: string; // ISO timestamp
  updatedAt: string;
  role: MemberRole;
  source: MemberSource;
  status?: "active" | "removed";
  interests: string[];
  heardFrom?: string;
  location?: string;
}

interface KvRegistration {
  id: string;
  eventId: string; // group_events.slug (date-suffixed, e.g. discuss-our-future-2026-06-17)
  timestamp: string; // ISO — when the registration was created
  attendee: {
    firstName: string;
    lastName: string;
    email: string;
  };
  engagement?: {
    interests?: string;
    heardFrom?: string;
  };
  status: "registered" | "cancelled" | "attended";
  remindersSent: {
    confirmation: boolean;
    day_before: boolean;
    hour_before: boolean;
  };
}

interface KvEmailBroadcast {
  id: string;
  subject: string;
  markdown: string;
  sentAt: string; // ISO timestamp
  total: number; // members in list at time of send
  sent: number; // confirmed delivered by Resend
  failed: number;
  recipientEmails: string[]; // snapshot of who received it
}

// ---------------------------------------------------------------------------
// 1. Members  →  auth.users + group_memberships
// ---------------------------------------------------------------------------

if (!skipMembers) {
  console.log("\n[1/3] Migrating members...");

  // Read all member records from KV
  const members: KvMember[] = [];
  const iter = kv.list<KvMember>({ prefix: ["member"] });
  for await (const { value } of iter) {
    members.push(value);
  }
  console.log(`  Found ${members.length} KV member records`);

  // Pre-load all existing auth users once (avoid per-record API calls)
  const { data: authList } = await admin.auth.admin.listUsers({
    perPage: 1000,
  });
  const authEmailMap = new Map<string, string>(); // email → auth user id
  for (const u of authList?.users ?? []) {
    if (u.email) authEmailMap.set(u.email.toLowerCase(), u.id);
  }
  console.log(`  Loaded ${authEmailMap.size} existing auth users`);

  // Resolve ft-global group id once
  const { data: globalGroup, error: groupErr } = await admin
    .from("groups")
    .select("id")
    .eq("slug", "ft-global")
    .single();
  if (groupErr || !globalGroup) {
    console.error(
      "  ERROR: ft-global group not found — cannot migrate members.",
    );
    stats.members.errors = members.length;
  } else {
    const groupId: string = globalGroup.id;

    for (const member of members) {
      stats.members.total++;
      try {
        // Skip soft-removed members
        if (member.status === "removed") {
          console.log(`  SKIP  [removed]  ${member.email}`);
          stats.members.skipped++;
          continue;
        }

        if (isDryRun) {
          console.log(
            `  [DRY] createUser(${member.email}) role=${member.role} source=${member.source}`,
          );
          stats.members.created++;
          continue;
        }

        let profileId = authEmailMap.get(member.email.toLowerCase());

        if (profileId) {
          console.log(`  EXISTS  ${member.email}  →  ${profileId}`);
          stats.members.skipped++;
        } else {
          // Create auth user (email already confirmed — they signed up via OTP/join form)
          const { data: created, error: createErr } = await admin.auth.admin
            .createUser({
              email: member.email,
              email_confirm: true,
              user_metadata: {
                name_first: member.firstName ?? null,
                name_last: member.lastName ?? null,
                interests: member.interests ?? [],
                heard_from: member.heardFrom ?? null,
                location: member.location ?? null,
                age_confirmed: true,
              },
            });
          if (createErr || !created.user) {
            console.error(
              `  ERROR createUser(${member.email}):`,
              createErr?.message,
            );
            stats.members.errors++;
            continue;
          }
          profileId = created.user.id;
          authEmailMap.set(member.email.toLowerCase(), profileId!);
          console.log(`  CREATED  ${member.email}  →  ${profileId}`);
          stats.members.created++;
        }

        // Map KV role → DB role enum (KV 'organiser' → DB 'group_admin')
        const dbRole = member.role === "organiser" ? "group_admin" : "member";

        // UPDATE group_memberships (trigger fires on auth.user creation and
        // inserts a default row — here we back-fill role/source/joined_at)
        const { error: updErr } = await admin
          .from("group_memberships")
          .update({
            role: dbRole,
            source: "imported",
            joined_at: member.joinedAt,
          })
          .eq("profile_id", profileId)
          .eq("group_id", groupId);

        if (updErr) {
          // Trigger may not have fired yet or row absent — fall back to insert
          const { error: insErr } = await admin
            .from("group_memberships")
            .insert({
              profile_id: profileId,
              group_id: groupId,
              role: dbRole,
              source: "imported",
              joined_at: member.joinedAt,
            });
          if (insErr) {
            console.error(
              `  WARN  group_memberships upsert (${member.email}):`,
              insErr.message,
            );
          }
        }
      } catch (err) {
        console.error(
          `  ERROR member(${member.email}):`,
          (err as Error).message,
        );
        stats.members.errors++;
      }
    }
  }

  console.log(
    `  Members: ${stats.members.created} created, ` +
      `${stats.members.skipped} skipped, ` +
      `${stats.members.errors} errors`,
  );
}

// ---------------------------------------------------------------------------
// 2. Event registrations  →  event_registrations + event_reminder_logs
// ---------------------------------------------------------------------------

if (!skipRegistrations) {
  console.log("\n[2/3] Migrating event registrations...");

  // Build slug → {id, event_date} map from Supabase
  const { data: eventRows } = await admin
    .from("group_events")
    .select("id, slug, event_date, timezone, group_id");
  const eventMap = new Map<
    string,
    { id: string; event_date: string; timezone: string; group_id: string }
  >();
  for (const ev of eventRows ?? []) {
    eventMap.set(ev.slug, {
      id: ev.id,
      event_date: ev.event_date,
      timezone: ev.timezone ?? "Australia/Sydney",
      group_id: ev.group_id,
    });
  }

  // Pre-load profiles email→id map for profile_id resolution and email_consents
  const { data: profileRows } = await admin.from("profiles").select(
    "id, email",
  );
  const profileEmailMap = new Map<string, string>(); // email → profiles.id
  for (const u of profileRows ?? []) {
    profileEmailMap.set(u.email.toLowerCase(), u.id);
  }
  console.log(`  Loaded ${profileEmailMap.size} profiles for email matching`);
  console.log(`  Loaded ${eventMap.size} events from Supabase`);

  // Scan all registration records from KV  ["registration", eventId, regId]
  const registrations: KvRegistration[] = [];
  const regIter = kv.list<KvRegistration>({ prefix: ["registration"] });
  for await (const { key, value } of regIter) {
    // Filter to 3-segment primary records; skip email-dedup index entries
    // (email index keys are under ["registration_email", …] — different prefix)
    if (key.length === 3) {
      registrations.push(value);
    }
  }
  console.log(`  Found ${registrations.length} KV registration records`);

  for (const reg of registrations) {
    stats.registrations.total++;
    try {
      const eventInfo = eventMap.get(reg.eventId);
      if (!eventInfo) {
        console.log(`  SKIP  [event not in DB]  eventId=${reg.eventId}`);
        stats.registrations.skipped++;
        continue;
      }

      // Resolve profile_id from profiles table (null for guests with no account)
      const resolvedProfileId =
        profileEmailMap.get(reg.attendee.email.toLowerCase()) ?? null;

      if (isDryRun) {
        console.log(
          `  [DRY] INSERT event_registrations` +
            ` event=${reg.eventId} email=${reg.attendee.email} status=${reg.status}` +
            (resolvedProfileId
              ? ` profile_id=${resolvedProfileId}`
              : " (guest)"),
        );
        if (reg.remindersSent.day_before) {
          console.log(`         → reminder_log 1-day`);
        }
        if (reg.remindersSent.hour_before) {
          console.log(`         → reminder_log 1-hour`);
        }
        if (resolvedProfileId) {
          console.log(`         → email_consents (group_email)`);
        }
        stats.registrations.inserted++;
        continue;
      }

      // Idempotency check: skip if this email is already registered for the event
      const { data: existing } = await admin
        .from("event_registrations")
        .select("id")
        .eq("event_id", eventInfo.id)
        .eq("email", reg.attendee.email.toLowerCase())
        .maybeSingle();

      if (existing) {
        console.log(`  EXISTS  ${reg.attendee.email}  @  ${reg.eventId}`);
        stats.registrations.skipped++;
        continue;
      }

      const { data: inserted, error: insErr } = await admin
        .from("event_registrations")
        .insert({
          event_id: eventInfo.id,
          profile_id: resolvedProfileId,
          email: reg.attendee.email.toLowerCase(),
          name_first: reg.attendee.firstName,
          name_last: reg.attendee.lastName,
          status: reg.status,
          registered_at: reg.timestamp,
          cancelled_at: reg.status === "cancelled" ? reg.timestamp : null,
          source: "web",
          interests: reg.engagement?.interests ?? null,
          heard_from: reg.engagement?.heardFrom ?? null,
        })
        .select("id")
        .single();

      if (insErr || !inserted) {
        console.error(
          `  ERROR registration(${reg.attendee.email} @ ${reg.eventId}):`,
          insErr?.message,
        );
        stats.registrations.errors++;
        continue;
      }
      console.log(
        `  INSERTED  ${reg.attendee.email}  @  ${reg.eventId}` +
          (resolvedProfileId ? "  [profile linked]" : "  [guest]"),
      );
      stats.registrations.inserted++;

      // Insert email_consents record for matched profiles
      if (resolvedProfileId) {
        const { error: consentErr } = await admin
          .from("email_consents")
          .insert({
            profile_id: resolvedProfileId,
            consent_type: "group_email",
            group_id: eventInfo.group_id,
            granted: true,
            consented_at: reg.timestamp,
            source: "imported",
          });
        if (consentErr) {
          console.warn(
            `  WARN  email_consents(${reg.attendee.email}):`,
            consentErr.message,
          );
          stats.emailConsents.errors++;
        } else {
          stats.emailConsents.inserted++;
        }
      }

      // Insert reminder log rows for reminders that were already sent.
      // Timestamps are approximated from event_date (KV didn't store exact send time).
      // event_date is now naive local time (ft-07i.15); convert via Temporal for UTC epoch.
      const eventEpochMs = Temporal.PlainDateTime.from(eventInfo.event_date)
        .toZonedDateTime(eventInfo.timezone)
        .epochMilliseconds;

      if (reg.remindersSent.day_before) {
        stats.reminderLogs.total++;
        const approxSentAt = new Date(
          eventEpochMs - 24 * 60 * 60 * 1000,
        ).toISOString();
        const { error: remErr } = await admin
          .from("event_reminder_logs")
          .insert({
            registration_id: inserted.id,
            reminder_type: "1-day",
            sent_at: approxSentAt,
          });
        if (remErr) {
          console.error(
            `  ERROR reminder_log 1-day (${reg.attendee.email}):`,
            remErr.message,
          );
          stats.reminderLogs.errors++;
        } else {
          stats.reminderLogs.inserted++;
        }
      }

      if (reg.remindersSent.hour_before) {
        stats.reminderLogs.total++;
        const approxSentAt = new Date(
          eventEpochMs - 60 * 60 * 1000,
        ).toISOString();
        const { error: remErr } = await admin
          .from("event_reminder_logs")
          .insert({
            registration_id: inserted.id,
            reminder_type: "1-hour",
            sent_at: approxSentAt,
          });
        if (remErr) {
          console.error(
            `  ERROR reminder_log 1-hour (${reg.attendee.email}):`,
            remErr.message,
          );
          stats.reminderLogs.errors++;
        } else {
          stats.reminderLogs.inserted++;
        }
      }
    } catch (err) {
      console.error(
        `  ERROR registration(${reg.eventId}/${reg.id}):`,
        (err as Error).message,
      );
      stats.registrations.errors++;
    }
  }

  console.log(
    `  Registrations: ${stats.registrations.inserted} inserted, ` +
      `${stats.registrations.skipped} skipped, ` +
      `${stats.registrations.errors} errors`,
  );
  console.log(
    `  Reminder logs:  ${stats.reminderLogs.inserted} inserted, ` +
      `${stats.reminderLogs.errors} errors`,
  );
  console.log(
    `  Email consents: ${stats.emailConsents.inserted} inserted, ` +
      `${stats.emailConsents.errors} errors`,
  );
}

// ---------------------------------------------------------------------------
// 3. Email broadcasts  →  email_sends
// ---------------------------------------------------------------------------

if (!skipBroadcasts) {
  console.log("\n[3/3] Migrating email broadcasts...");

  let groupId: string | null = null;
  // Resolve ft-global group id once
  const { data: globalGroup, error: groupErr } = await admin
    .from("groups")
    .select("id")
    .eq("slug", "ft-global")
    .single();
  if (groupErr || !globalGroup) {
    console.error(
      "  ERROR: ft-global group not found — email_sends using NULL group.",
    );
  } else {
    groupId = globalGroup.id;
  }

  // Resolve sent_by_id — KV broadcast records don't store sender info;
  // use FT_ADMIN_EMAIL env var to look up the profile, falling back to the
  // first organiser in the ft-global group.
  let sentById: string | null = null;
  const adminEmail = Deno.env.get("FT_ADMIN_EMAIL");

  if (adminEmail) {
    const { data: adminUser } = await admin
      .from("profiles")
      .select("id")
      .eq("email", adminEmail.toLowerCase())
      .maybeSingle();
    if (adminUser) {
      sentById = adminUser.id;
      console.log(`  Resolved sent_by_id for ${adminEmail}: ${sentById}`);
    } else {
      console.log(
        `  WARN: FT_ADMIN_EMAIL=${adminEmail} not found in profiles table`,
      );
    }
  }

  if (!sentById) {
    // Fallback: first organiser in ft-global group
    const { data: firstOrg } = await admin
      .from("group_memberships")
      .select("profile_id, groups!inner(slug)")
      .eq("groups.slug", "ft-global")
      .in("role", ["group_owner", "group_admin"])
      .limit(1)
      .maybeSingle();
    if (firstOrg) {
      sentById = firstOrg.profile_id as string;
      console.log(
        `  Fallback sent_by_id (first ft-global organiser): ${sentById}`,
      );
    } else {
      console.log(
        "  WARN: No organiser found in ft-global — broadcasts cannot be migrated.\n" +
          "  Set FT_ADMIN_EMAIL in your .env.local to enable broadcast migration.",
      );
    }
  }

  // Read all broadcast records from KV
  const broadcasts: KvEmailBroadcast[] = [];
  const bcIter = kv.list<KvEmailBroadcast>({ prefix: ["email_broadcast"] });
  for await (const { value } of bcIter) {
    broadcasts.push(value);
  }
  console.log(`  Found ${broadcasts.length} KV broadcast records`);

  for (const bc of broadcasts) {
    stats.broadcasts.total++;
    try {
      if (!sentById) {
        console.log(`  SKIP  [no sent_by_id]  "${bc.subject}"`);
        stats.broadcasts.skipped++;
        continue;
      }

      if (isDryRun) {
        console.log(
          `  [DRY] INSERT email_sends subject="${bc.subject}" sent_at=${bc.sentAt}` +
            ` sent=${bc.sent} failed=${bc.failed} recipients=${bc.recipientEmails.length}`,
        );
        stats.broadcasts.inserted++;
        continue;
      }

      // Idempotency check: skip if subject + sent_at already exist
      const { data: existing } = await admin
        .from("email_sends")
        .select("id")
        .eq("subject", bc.subject)
        .eq("sent_at", bc.sentAt)
        .maybeSingle();

      if (existing) {
        console.log(`  EXISTS  "${bc.subject}"  @  ${bc.sentAt}`);
        stats.broadcasts.skipped++;
        continue;
      }

      const { error: insErr } = await admin
        .from("email_sends")
        .insert({
          group_id: groupId,
          sent_by_id: sentById,
          subject: bc.subject,
          body_markdown: bc.markdown,
          recipient_count: bc.total,
          sent_count: bc.sent,
          failed_count: bc.failed,
          recipient_emails: bc.recipientEmails,
          sent_at: bc.sentAt,
        });

      if (insErr) {
        console.error(
          `  ERROR broadcast("${bc.subject}"):`,
          insErr.message,
        );
        stats.broadcasts.errors++;
        continue;
      }
      console.log(`  INSERTED  "${bc.subject}"  @  ${bc.sentAt}`);
      stats.broadcasts.inserted++;
    } catch (err) {
      console.error(
        `  ERROR broadcast(${bc.id}):`,
        (err as Error).message,
      );
      stats.broadcasts.errors++;
    }
  }

  console.log(
    `  Broadcasts: ${stats.broadcasts.inserted} inserted, ` +
      `${stats.broadcasts.skipped} skipped, ` +
      `${stats.broadcasts.errors} errors`,
  );
}

// ---------------------------------------------------------------------------
// 4. Staff log  →  audit_logs
// ---------------------------------------------------------------------------

if (!skipStaffLog) {
  console.log("\n[4/4] Migrating staff_log → audit_logs...");

  // Read all staff_log entries from KV
  // Key structure: ["staff_log", <ISO timestamp>, <UUID>]
  // Value:         { message: string; timestamp: string }
  // These are access/auth events (not admin actions) so we write them
  // to a plain text archive file rather than importing into audit_logs.
  interface KvStaffLogEntry {
    message: string;
    timestamp: string;
  }

  const entries: KvStaffLogEntry[] = [];
  const logIter = kv.list<KvStaffLogEntry>({ prefix: ["staff_log"] });
  for await (const { value } of logIter) {
    if (value?.message && value?.timestamp) {
      entries.push(value);
    }
  }
  // Sort chronologically
  entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  console.log(`  Found ${entries.length} KV staff_log entries`);

  stats.staffLog.total = entries.length;

  if (isDryRun) {
    console.log(
      `  [DRY] Would write ${entries.length} entries to ../playground/staff-log-archive.txt`,
    );
    stats.staffLog.inserted = entries.length;
  } else {
    const outPath = new URL(
      "../../playground/staff-log-archive.txt",
      import.meta.url,
    );
    const lines = entries.map((e) => e.message).join("\n") + "\n";
    await Deno.writeTextFile(outPath, lines);
    console.log(`  Written to ${outPath.pathname}`);
    stats.staffLog.inserted = entries.length;
  }

  console.log(
    `  Staff log: ${stats.staffLog.inserted} inserted, ` +
      `${stats.staffLog.skipped} skipped, ` +
      `${stats.staffLog.errors} errors`,
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log("\n" + "─".repeat(50));
console.log("Migration summary:");
if (!skipMembers) {
  console.log(
    `  Members:       ${stats.members.created} created, ` +
      `${stats.members.skipped} skipped, ` +
      `${stats.members.errors} errors`,
  );
}
if (!skipRegistrations) {
  console.log(
    `  Registrations: ${stats.registrations.inserted} inserted, ` +
      `${stats.registrations.skipped} skipped, ` +
      `${stats.registrations.errors} errors`,
  );
  console.log(
    `  Reminder logs:  ${stats.reminderLogs.inserted} inserted, ` +
      `${stats.reminderLogs.errors} errors`,
  );
  console.log(
    `  Email consents: ${stats.emailConsents.inserted} inserted, ` +
      `${stats.emailConsents.errors} errors`,
  );
}
if (!skipBroadcasts) {
  console.log(
    `  Broadcasts:    ${stats.broadcasts.inserted} inserted, ` +
      `${stats.broadcasts.skipped} skipped, ` +
      `${stats.broadcasts.errors} errors`,
  );
}
if (!skipStaffLog) {
  console.log(
    `  Staff log:     ${stats.staffLog.inserted} inserted, ` +
      `${stats.staffLog.skipped} skipped, ` +
      `${stats.staffLog.errors} errors`,
  );
}

if (isDryRun) {
  console.log("\n⚠  Dry run — no data was written to Supabase.");
} else {
  console.log("\n✓ KV migration complete.");
}

kv.close();
