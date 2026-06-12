#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read
/**
 * site/scripts/import-tumba-members.ts
 *
 * Creates the Tumbarumba Community group (admin fast-path) and bulk-imports
 * event attendees from a CSV of names + emails.
 *
 * Run from site/ directory:
 *   deno task import-tumba-members -- --csv /path/to/attendees.csv
 *
 * CSV format (flexible, case-insensitive headers):
 *   email, name                   — full name in one column
 *   email, first_name, last_name  — split name columns
 *   email only                    — name_first/last left blank
 *
 * Flags:
 *   --csv <path>        Path to CSV file (required unless --skip-members)
 *   --dry-run           Print what would be written without touching Supabase
 *   --env <local|prod>  Environment target (default: local)
 *   --skip-group        Skip group creation (group already exists)
 *   --skip-members      Skip member import (create/verify group only)
 */

import { load as loadDotenv } from "@std/dotenv";
import { parseArgs } from "@std/cli";
import { parse as parseCsv } from "@std/csv";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = parseArgs(Deno.args, {
  boolean: ["dry-run", "skip-group", "skip-members"],
  string: ["csv", "env"],
  default: { env: "local" },
});

const isDryRun = args["dry-run"] as boolean;
const skipGroup = args["skip-group"] as boolean;
const skipMembers = args["skip-members"] as boolean;
const csvPath = args["csv"] as string | undefined;
const envTarget = args["env"] as string;

if (!skipMembers && !csvPath) {
  console.error(
    "ERROR: --csv <path> is required. Use --skip-members to only create the group.",
  );
  Deno.exit(1);
}

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
// Supabase admin client (dynamic import — env must be set first)
// ---------------------------------------------------------------------------

const { createAdminClient } = await import("../utils/supabase.ts");
const admin = createAdminClient();

// ---------------------------------------------------------------------------
// Summary stats
// ---------------------------------------------------------------------------

const stats = {
  group: { action: "none" as "none" | "created" | "existed" | "skipped" },
  members: { total: 0, created: 0, existed: 0, errors: 0 },
  memberships: { inserted: 0, existed: 0, errors: 0 },
  consents: { inserted: 0, warnings: 0 },
};

// ---------------------------------------------------------------------------
// Group definition  (spec from ft-mji.1)
// ---------------------------------------------------------------------------

const GROUP_SLUG = "tumbarumba-community";
const GROUP_DATA = {
  slug: GROUP_SLUG,
  name: "Tumbarumba Community",
  tagline:
    "Tumbarumba locals building awareness, conversation, and community resilience.",
  description:
    "Tumbarumba has something that's easy to take for granted until you need it: a community that genuinely looks after its own. That's exactly the kind of strength that matters as AI-driven change reshapes how we work, buy, and connect — faster than most people realise.\n\n" +
    "This is where Future Together began. Charlie Garrison — the movement's founder — is a Tumbarumba local, and this group started the way most good things in Tumba do: around a table at the Nest, over coffee on Tuesday mornings, with a handful of people asking questions they didn't have answers to yet.\n\n" +
    "Since then it's grown. After a community meeting in June 2026 brought more than a dozen locals together, the group has moved toward something more intentional: a monthly gathering to stay informed, think clearly, and take practical steps together.\n\n" +
    "We cover the broad Future Together themes — understanding what's changing, having honest conversations about the impact, and figuring out what to do. But we also get specific: community preparedness, local food resilience, knowing your neighbours' skills. Things that matter in a town like ours, where the distance from the nearest city is both a reality and a reason to build something worth relying on.\n\n" +
    "Supported in part by the Tumbarumba Business Chamber.\n\n" +
    "**Meetings:** Monthly in-person — location to be confirmed. Watch this page for details.\n" +
    "**New members:** Always welcome. No prior knowledge needed.",
  group_type: "geographic",
  tier: "local",
  location_name: "Tumbarumba, NSW, Australia",
  location_suburb: "Tumbarumba",
  location_state: "NSW",
  location_country: "Australia",
  // Tumbarumba, NSW geocoordinates (Nominatim/OpenStreetMap)
  lat: -35.7848,
  lng: 148.0160,
  status: "active",
  visibility: "public",
} as const;

// ---------------------------------------------------------------------------
// 1. Group creation  (admin fast-path — bypasses approval flow)
// ---------------------------------------------------------------------------

let tumbaGroupId: string | null = null;

if (skipGroup) {
  console.log("\n[1/2] Skipping group creation (--skip-group).");
  const { data: existing, error } = await admin
    .from("groups")
    .select("id")
    .eq("slug", GROUP_SLUG)
    .maybeSingle();
  if (error || !existing) {
    console.error(
      `  ERROR: Group '${GROUP_SLUG}' not found — run without --skip-group first.`,
    );
    Deno.exit(1);
  }
  tumbaGroupId = existing.id;
  console.log(`  Found existing group: ${tumbaGroupId}`);
  stats.group.action = "existed";
} else {
  console.log(`\n[1/2] Creating group '${GROUP_SLUG}'...`);

  // Resolve ft-global group id for parent_group_id
  const { data: globalGroup, error: globalErr } = await admin
    .from("groups")
    .select("id")
    .eq("slug", "ft-global")
    .single();
  if (globalErr || !globalGroup) {
    console.error(
      "  ERROR: ft-global group not found — is the DB seeded? Run deno task seed first.",
    );
    Deno.exit(1);
  }

  if (isDryRun) {
    console.log(
      `  [DRY] UPSERT groups slug=${GROUP_SLUG} parent_group_id=${globalGroup.id}`,
    );
    tumbaGroupId = "dry-run-group-uuid";
    stats.group.action = "created";
  } else {
    // Idempotency — safe to re-run
    const { data: existing } = await admin
      .from("groups")
      .select("id")
      .eq("slug", GROUP_SLUG)
      .maybeSingle();

    if (existing) {
      console.log(`  EXISTS  '${GROUP_SLUG}'  →  ${existing.id}`);
      tumbaGroupId = existing.id;
      stats.group.action = "existed";
    } else {
      const { data: created, error: createErr } = await admin
        .from("groups")
        .insert({
          ...GROUP_DATA,
          parent_group_id: globalGroup.id,
          approved_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (createErr || !created) {
        console.error("  ERROR creating group:", createErr?.message);
        Deno.exit(1);
      }
      tumbaGroupId = created.id;
      console.log(`  CREATED  '${GROUP_SLUG}'  →  ${tumbaGroupId}`);
      stats.group.action = "created";
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Bulk member import from CSV
// ---------------------------------------------------------------------------

if (skipMembers) {
  console.log("\n[2/2] Skipping member import (--skip-members).");
} else {
  console.log(`\n[2/2] Importing members from: ${csvPath}`);

  // Read and parse CSV
  const csvText = await Deno.readTextFile(csvPath!);
  const rows = parseCsv(csvText, { skipFirstRow: true, strip: true });

  if (rows.length === 0) {
    console.error("  ERROR: CSV is empty (or has only a header row).");
    Deno.exit(1);
  }

  // Detect column layout from headers (case-insensitive)
  const headers = Object.keys(rows[0]).map((k) => k.toLowerCase().trim());
  const hasName = headers.includes("name");
  const hasFirstLast = headers.includes("first_name") &&
    headers.includes("last_name");
  const hasEmail = headers.includes("email");

  if (!hasEmail) {
    console.error("  ERROR: CSV must have an 'email' column.");
    Deno.exit(1);
  }

  const nameMode = hasName
    ? "name"
    : hasFirstLast
    ? "first_name+last_name"
    : "email-only";
  console.log(`  Columns: [${headers.join(", ")}]  →  name mode: ${nameMode}`);
  console.log(`  Rows: ${rows.length}`);

  // Pre-load all existing auth users once (avoids per-record API calls)
  const { data: authList } = await admin.auth.admin.listUsers({
    perPage: 1000,
  });
  const authEmailMap = new Map<string, string>(); // email → auth user id
  for (const u of authList?.users ?? []) {
    if (u.email) authEmailMap.set(u.email.toLowerCase(), u.id);
  }
  console.log(`  Loaded ${authEmailMap.size} existing auth users`);

  // Pre-load existing memberships for this group (idempotency on re-run)
  const { data: existingMems } = await admin
    .from("group_memberships")
    .select("profile_id")
    .eq("group_id", tumbaGroupId!);
  const memberProfileIds = new Set<string>(
    (existingMems ?? []).map((m: { profile_id: string }) => m.profile_id),
  );
  console.log(`  Existing memberships in group: ${memberProfileIds.size}`);

  const importedAt = new Date().toISOString();

  for (const rawRow of rows) {
    // Normalise keys to lowercase, trim values
    const row: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawRow)) {
      row[k.toLowerCase().trim()] = String(v ?? "").trim();
    }

    const email = row["email"]?.toLowerCase();
    if (!email) {
      console.log("  SKIP  [missing email]");
      continue;
    }

    // Build display_name from whichever columns are available
    let displayName = "";
    if (hasName) {
      displayName = row["name"] ?? "";
    } else if (hasFirstLast) {
      displayName = `${row["first_name"] ?? ""} ${row["last_name"] ?? ""}`
        .trim();
    }

    stats.members.total++;

    if (isDryRun) {
      const action = authEmailMap.has(email) ? "EXISTS" : "createUser";
      console.log(
        `  [DRY] ${action}  ${email}` +
          (displayName ? `  (${displayName})` : ""),
      );
      stats.members.created++;
      continue;
    }

    try {
      let profileId = authEmailMap.get(email);

      if (profileId) {
        // User already has an auth account
        console.log(`  EXISTS  ${email}  →  ${profileId}`);
        stats.members.existed++;
      } else {
        // Create auth user — email already confirmed (they attended in person)
        const { data: created, error: createErr } = await admin.auth.admin
          .createUser({
            email,
            email_confirm: true,
            user_metadata: {
              name_first: (hasFirstLast
                ? row["first_name"]
                : (row["name"] ?? "").split(" ")[0]) || null,
              name_last: (hasFirstLast
                ? row["last_name"]
                : (row["name"] ?? "").split(" ").slice(1).join(" ")) || null,
              age_confirmed: true,
            },
          });
        if (createErr || !created.user) {
          console.error(`  ERROR createUser(${email}):`, createErr?.message);
          stats.members.errors++;
          continue;
        }
        profileId = created.user.id;
        authEmailMap.set(email, profileId!);
        console.log(
          `  CREATED  ${email}  →  ${profileId}` +
            (displayName ? `  (${displayName})` : ""),
        );
        stats.members.created++;
      }

      // group_memberships — insert if not already a member of this group
      if (memberProfileIds.has(profileId!)) {
        console.log(`  MEMBER EXISTS  ${email} already in '${GROUP_SLUG}'`);
        stats.memberships.existed++;
      } else {
        const { error: memErr } = await admin
          .from("group_memberships")
          .insert({
            group_id: tumbaGroupId,
            profile_id: profileId,
            role: "member",
            status: "active",
            email_opt_in: true,
            source: "imported",
            joined_at: importedAt,
          });
        if (memErr) {
          console.error(`  ERROR group_memberships(${email}):`, memErr.message);
          stats.memberships.errors++;
        } else {
          memberProfileIds.add(profileId!);
          console.log(`  MEMBER  ${email} → '${GROUP_SLUG}'`);
          stats.memberships.inserted++;
        }
      }

      // email_consents — GDPR audit trail for imported members
      // Note: first email to these members must explain how they were added
      // and offer one-click unsubscribe (see §8.1 of local-groups-plan.md)
      const { error: consentErr } = await admin
        .from("email_consents")
        .insert({
          profile_id: profileId,
          consent_type: "group_email",
          group_id: tumbaGroupId,
          granted: true,
          consented_at: importedAt,
          source: "imported",
        });
      if (consentErr) {
        // Constraint violation on re-run is expected — warn only
        console.warn(`  WARN  email_consents(${email}):`, consentErr.message);
        stats.consents.warnings++;
      } else {
        stats.consents.inserted++;
      }
    } catch (err) {
      console.error(`  ERROR (${email}):`, (err as Error).message);
      stats.members.errors++;
    }
  }

  console.log(
    `\n  Members:     ${stats.members.created} created, ` +
      `${stats.members.existed} existed, ` +
      `${stats.members.errors} errors`,
  );
  console.log(
    `  Memberships: ${stats.memberships.inserted} inserted, ` +
      `${stats.memberships.existed} already existed, ` +
      `${stats.memberships.errors} errors`,
  );
  console.log(
    `  Consents:    ${stats.consents.inserted} logged, ` +
      `${stats.consents.warnings} warnings (duplicates OK on re-run)`,
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log("\n" + "─".repeat(60));
console.log("Import summary:");
console.log(`  Group '${GROUP_SLUG}': ${stats.group.action}`);
if (!skipMembers) {
  console.log(
    `  Members:     ${stats.members.created} created, ` +
      `${stats.members.existed} existed, ` +
      `${stats.members.errors} errors`,
  );
  console.log(
    `  Memberships: ${stats.memberships.inserted} inserted, ` +
      `${stats.memberships.existed} already existed`,
  );
  console.log(`  Consents:    ${stats.consents.inserted} logged`);
}

if (isDryRun) {
  console.log("\n⚠  Dry run — no data was written to Supabase.");
} else {
  console.log("\n✓ Import complete.");
  if (!skipMembers && stats.memberships.inserted > 0) {
    console.log(
      "\n→ Next step: send the welcome/consent email to imported members." +
        "\n  The first email MUST explain how they were added and include" +
        "\n  one-click unsubscribe (GDPR/CAN-SPAM requirement)." +
        `\n  From: group-tumbarumba-community@futuretogether.community`,
    );
  }
}
