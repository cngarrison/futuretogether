/**
 * site/utils/db/profiles.ts
 *
 * Direct profile lookups — queries the `profiles` table only.
 * No group membership dependency.
 *
 * getMemberByEmail / getMemberById are kept as aliases for backwards
 * compatibility but callers should migrate to getProfileByEmail / getProfileById.
 */

import { createAdminClient } from "@/utils/supabase.ts";

export type { Member } from "@/utils/db/group-members.ts";
// Backwards-compat aliases (group-member flavour — still used by admin views)
export {
  getMemberByEmailAdmin as getMemberByEmail,
  getMemberByIdAdmin as getMemberById,
} from "@/utils/db/group-members.ts";

export interface Profile {
  id: string;
  email: string;
  name_first: string | null;
  name_last: string | null;
  location: string | null;
  interests: string[] | null;
  heard_from: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Look up a profile by email address.
 * Returns null if no profile exists — does NOT require group membership.
 */
export async function getProfileByEmail(
  email: string,
): Promise<Profile | null> {
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("profiles")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();
    return (data as Profile | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * Look up a profile by Supabase auth user ID.
 * Returns null if no profile exists.
 */
export async function getProfileById(
  id: string,
): Promise<Profile | null> {
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return (data as Profile | null) ?? null;
  } catch {
    return null;
  }
}
