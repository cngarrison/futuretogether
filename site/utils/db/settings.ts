/**
 * site/utils/settings.ts
 *
 * Lazy-cached getters for Supabase platform settings.
 * Uses the admin client (service role) to call get_setting() RPC.
 * Values are cached module-level for the process lifetime.
 */

import { createAdminClient } from "@/utils/supabase.ts";

let _globalGroupId: string | null = null;

/**
 * Returns the global group UUID from the settings table.
 * Result is cached for the process lifetime.
 * Throws if the setting is not yet seeded.
 */
export async function getGlobalGroupId(): Promise<string> {
  if (_globalGroupId) return _globalGroupId;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_setting", {
    p_key: "global_group_id",
  });

  if (error) {
    throw new Error(`Failed to read global_group_id setting: ${error.message}`);
  }
  if (!data) {
    throw new Error(
      "global_group_id setting not seeded — run 20260612000012_seed_global_group.sql",
    );
  }

  _globalGroupId = data as string;
  return _globalGroupId;
}
