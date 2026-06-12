#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read
/**
 * scripts/onboard-site-owner.ts
 *
 * Onboards the site owner (CNG) into Supabase:
 *   1. Creates (or locates existing) auth.users record
 *   2. Inserts user_platform_roles: site_owner
 *   3. Inserts group_memberships: group_owner of ft-global
 *
 * Usage:
 *   deno run --allow-env --allow-net --allow-read scripts/onboard-site-owner.ts [--env <name>]
 *
 * Flags:
 *   --env <name>   Environment suffix for .env file (default: local → .env.local)
 *                 Use --env production to load .env.production
 *
 * Requires env vars (from .env.<name>):
 *   SUPABASE_URL
 *   SUPABASE_SECRET_KEY   (service role key — bypasses RLS)
 *
 * Safe to re-run: platform role insert uses ON CONFLICT; group membership uses UPDATE.
 */

import { createClient } from "@supabase/supabase-js";
import { load as loadDotenv } from "@std/dotenv";
import { parseArgs } from "@std/cli";

const { env: envTarget } = parseArgs(Deno.args, {
  string: ["env"],
  default: { env: "local" },
});

await loadDotenv({ export: true, envPath: `.env.${envTarget}` });
console.log(`[env] Using ${envTarget} environment`);

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SECRET_KEY = Deno.env.get("SUPABASE_SECRET_KEY");

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
  Deno.exit(1);
}
// console.error("ENV:", {SUPABASE_URL, SUPABASE_SECRET_KEY});

const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Config — edit these before running
// ---------------------------------------------------------------------------
const OWNER_EMAIL = Deno.env.get("FT_SITE_OWNER_EMAIL") ??
  "charlie@futuretogether.community";
const OWNER_DISPLAY_NAME = Deno.env.get("FT_SITE_OWNER_NAME") ??
  "Charlie Garrison";
const OWNER_PASSWORD = Deno.env.get("SITE_OWNER_PASSWORD"); // optional; set env or leave blank for magic-link-only
// ---------------------------------------------------------------------------

console.log("Future Together — Site Owner Onboarding");
console.log("========================================");

// Step 1: Resolve auth user (create if not exists)
let authProfileId: string;

console.log(`\n1. Resolving auth user for ${OWNER_EMAIL}...`);

const { data: { users: existingUsers }, error: listErr } = await admin.auth
  .admin.listUsers();

if (listErr) {
  console.error("Failed to list users:", listErr.message);
  Deno.exit(1);
}

const existing = existingUsers.find((u) => u.email === OWNER_EMAIL);

if (existing) {
  authProfileId = existing.id;
  console.log(`   Found existing auth user: ${authProfileId}`);
} else {
  const createParams: Record<string, unknown> = {
    email: OWNER_EMAIL,
    email_confirm: true, // skip email confirmation for admin-created account
    user_metadata: {
      name_first: OWNER_DISPLAY_NAME.split(" ")[0] ?? OWNER_DISPLAY_NAME,
      name_last: OWNER_DISPLAY_NAME.split(" ").slice(1).join(" ") || null,
      age_confirmed: true,
    },
  };
  if (OWNER_PASSWORD) createParams.password = OWNER_PASSWORD;

  const { data: newUser, error: createErr } = await admin.auth.admin.createUser(
    createParams as Parameters<typeof admin.auth.admin.createUser>[0],
  );

  if (createErr || !newUser.user) {
    console.error("Failed to create auth user:", createErr?.message);
    Deno.exit(1);
  }
  authProfileId = newUser.user.id;
  console.log(`   Created new auth user: ${authProfileId}`);
}

// Step 2: Resolve Global group UUID from settings
console.log("\n2. Resolving Global group UUID from settings...");

const { data: globalGroupIdRaw, error: settingErr } = await admin.rpc(
  "get_setting",
  { p_key: "global_group_id" },
);

if (settingErr || !globalGroupIdRaw) {
  console.error(
    "global_group_id not found in settings.",
    "Run the seed migration (20260612000012_seed_global_group.sql) first.",
  );
  Deno.exit(1);
}

const globalGroupId = globalGroupIdRaw as string;
console.log(`   Global group UUID: ${globalGroupId}`);

// Step 3: Insert site_owner platform role
console.log("\n3. Granting site_owner platform role...");

const { error: roleErr } = await admin
  .from("user_platform_roles")
  .insert({ profile_id: authProfileId, role: "site_owner" })
  .select()
  .maybeSingle();

if (roleErr && roleErr.code !== "23505") { // 23505 = unique_violation (already exists)
  console.error("Failed to insert site_owner role:", roleErr.message);
  Deno.exit(1);
}
console.log(roleErr ? "   Already exists — skipped." : "   Done.");

// Step 4: Elevate ft-global membership to group_owner
// The handle_new_auth_user trigger already created a 'member' row when the
// auth user was inserted. We update it to 'group_owner' here.
console.log("\n4. Setting group_owner role on ft-global membership...");

const { data: memberData, error: memberErr } = await admin
  .from("group_memberships")
  .update({ role: "group_owner", source: "admin-added" })
  .eq("group_id", globalGroupId)
  .eq("profile_id", authProfileId)
  .select()
  .maybeSingle();

if (memberErr) {
  console.error("Failed to update group_owner role:", memberErr.message);
  Deno.exit(1);
}
if (!memberData) {
  // Trigger didn't fire (e.g. seed ran after user creation) — insert directly.
  const { error: insertErr } = await admin
    .from("group_memberships")
    .insert({
      group_id: globalGroupId,
      profile_id: authProfileId,
      role: "group_owner",
      status: "active",
      email_opt_in: true,
      source: "admin-added",
    });
  if (insertErr) {
    console.error(
      "Failed to insert group_owner membership:",
      insertErr.message,
    );
    Deno.exit(1);
  }
  console.log(
    "   Inserted (trigger had not run — seed ran after user creation).",
  );
} else {
  console.log("   Updated existing member row to group_owner.");
}

console.log(`
========================================
Onboarding complete.
  Auth user ID : ${authProfileId}
  Email        : ${OWNER_EMAIL}
  Platform role: site_owner
  Group role   : group_owner of ft-global (${globalGroupId})
========================================
`);
