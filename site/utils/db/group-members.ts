/**
 * site/utils/db/group-members.ts
 *
 * All group membership and platform-wide member functions.
 * Sources: site/utils/groups.ts (membership functions) + site/utils/members.ts.
 *
 * removeMember(membershipId) from groups.ts is renamed removeGroupMember here.
 * removeMember(email) from members.ts retains its name (platform-scoped).
 * MemberInput and MemberResult (KV-era, unused) are not exported.
 */

import { createAdminClient } from "@/utils/supabase.ts";
import type { State } from "@/utils.ts";
import { getGlobalGroupId } from "@/utils/db/settings.ts";

// ---------------------------------------------------------------------------
// Types from members.ts
// ---------------------------------------------------------------------------

export type MemberRole = "member" | "organiser";
export type MemberSource = "join_form" | "event_registration";

export interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  joinedAt: string;
  updatedAt: string;
  role: MemberRole;
  source: MemberSource;
  status?: "active" | "removed";
  interests: string[];
  heardFrom?: string;
  location?: string;
}

// ---------------------------------------------------------------------------
// Types from groups.ts
// ---------------------------------------------------------------------------

export interface GroupMember {
  id: string;
  profile_id: string;
  name_first: string | null;
  name_last: string | null;
  email: string;
  role: string;
  status: string;
  joined_at: string;
  email_opt_in: boolean;
  source: string | null;
}

export interface MemberGroupEntry {
  name: string;
  slug: string;
  role: string;
}

export interface AccountMembership {
  id: string;
  groupId: string;
  groupName: string;
  groupSlug: string;
  role: string;
  joinedAt: string;
  emailOptIn: boolean;
}

// ---------------------------------------------------------------------------
// Row mapper for Member (members.ts pattern)
// ---------------------------------------------------------------------------

function rowToMember(
  profile: Record<string, unknown>,
  gm: Record<string, unknown>,
): Member {
  const firstName = (profile.name_first as string) ?? "";
  const lastName = (profile.name_last as string) ?? "";
  const dbRole = gm.role as string;
  const role: MemberRole = dbRole === "group_admin" || dbRole === "group_owner"
    ? "organiser"
    : "member";
  const dbSource = gm.source as string;
  const source: MemberSource = dbSource === "admin-added"
    ? "event_registration"
    : "join_form";
  const dbStatus = gm.status as string;
  const status = dbStatus === "active" ? "active" : "removed";
  return {
    id: profile.id as string,
    email: profile.email as string,
    firstName,
    lastName,
    joinedAt: (gm.joined_at as string) ?? (profile.created_at as string),
    updatedAt: profile.updated_at as string,
    role,
    source,
    status: status as Member["status"],
    interests: (profile.interests as string[]) ?? [],
    heardFrom: (profile.heard_from as string) ?? undefined,
    location: (profile.location as string) ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Platform-wide member functions (from members.ts)
// ---------------------------------------------------------------------------

export async function getMemberByEmailAdmin(
  email: string,
): Promise<Member | null> {
  try {
    const globalGroupId = await getGlobalGroupId();
    if (!globalGroupId) return null;
    const db = createAdminClient();
    const { data: profileData } = await db
      .from("profiles")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();
    if (!profileData) return null;
    const { data: gmData } = await db
      .from("group_memberships")
      .select("*")
      .eq("profile_id", profileData.id as string)
      .eq("group_id", globalGroupId)
      .maybeSingle();
    if (!gmData) return null;
    return rowToMember(
      profileData as Record<string, unknown>,
      gmData as Record<string, unknown>,
    );
  } catch {
    return null;
  }
}

export async function getMemberByIdAdmin(id: string): Promise<Member | null> {
  try {
    const globalGroupId = await getGlobalGroupId();
    if (!globalGroupId) return null;
    const db = createAdminClient();
    const { data: profileData } = await db
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (!profileData) return null;
    const { data: gmData } = await db
      .from("group_memberships")
      .select("*")
      .eq("profile_id", id)
      .eq("group_id", globalGroupId)
      .maybeSingle();
    if (!gmData) return null;
    return rowToMember(
      profileData as Record<string, unknown>,
      gmData as Record<string, unknown>,
    );
  } catch {
    return null;
  }
}

export async function getAllMembersAdmin(): Promise<Member[]> {
  try {
    const globalGroupId = await getGlobalGroupId();
    if (!globalGroupId) return [];
    const db = createAdminClient();
    const { data: rows, error } = await db
      .from("group_memberships")
      .select("*, profiles!group_memberships_profile_id_fkey!inner(*)")
      .eq("group_id", globalGroupId)
      .order("joined_at", { ascending: true });
    if (error) {
      console.log("DbMembers: getAllMembers", { error });
      return [];
    }
    if (!rows) return [];
    return rows
      .filter((row) => row.profiles != null)
      .map((row) =>
        rowToMember(
          row.profiles as Record<string, unknown>,
          row as Record<string, unknown>,
        )
      );
  } catch {
    return [];
  }
}

export async function getMemberCountAdmin(): Promise<number> {
  try {
    const globalGroupId = await getGlobalGroupId();
    if (!globalGroupId) return 0;
    const db = createAdminClient();
    const { count } = await db
      .from("group_memberships")
      .select("*", { count: "exact", head: true })
      .eq("group_id", globalGroupId);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getActiveMembersAdmin(): Promise<Member[]> {
  try {
    const globalGroupId = await getGlobalGroupId();
    if (!globalGroupId) return [];
    const db = createAdminClient();
    const { data: rows } = await db
      .from("group_memberships")
      .select("*, profiles!inner(*)")
      .eq("group_id", globalGroupId)
      .eq("status", "active")
      .order("joined_at", { ascending: true });
    if (!rows) return [];
    return rows
      .filter((row) => row.profiles != null)
      .map((row) =>
        rowToMember(
          row.profiles as Record<string, unknown>,
          row as Record<string, unknown>,
        )
      );
  } catch {
    return [];
  }
}

/** Platform-wide soft-remove by email: sets group_memberships.status = 'banned'. */
export async function removeMemberAdmin(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await getMemberByEmailAdmin(email);
    if (!existing) return { success: false, error: "Member not found" };
    if (existing.status === "removed") {
      return { success: false, error: "Member already removed" };
    }
    const globalGroupId = await getGlobalGroupId();
    if (!globalGroupId) {
      return { success: false, error: "Global group not found" };
    }
    const db = createAdminClient();
    const { error } = await db
      .from("group_memberships")
      .update({ status: "banned" })
      .eq("profile_id", existing.id)
      .eq("group_id", globalGroupId);
    return error
      ? { success: false, error: "Failed to remove member" }
      : { success: true };
  } catch {
    return { success: false, error: "Unexpected error" };
  }
}

// ---------------------------------------------------------------------------
// Group-scoped membership functions (from groups.ts)
// ---------------------------------------------------------------------------

export async function isGroupMember(
  groupId: string,
  profileId: string,
  state: State,
): Promise<boolean> {
  try {
    const { data, error } = await state.supabaseClient
      .from("group_memberships")
      .select("id")
      .eq("group_id", groupId)
      .eq("profile_id", profileId)
      .eq("status", "active")
      .maybeSingle();
    if (error) console.log("DbMembers: isGroupMember", { error });
    return !error && data !== null;
  } catch {
    return false;
  }
}

export async function joinGroup(
  groupId: string,
  profileId: string,
  source: string,
  state: State,
): Promise<{ error: string | null }> {
  try {
    const db = state.supabaseClient;
    const { error: errorMembership } = await db
      .from("group_memberships")
      .upsert(
        {
          group_id: groupId,
          profile_id: profileId,
          role: "member",
          status: "active",
          email_opt_in: true,
          source,
        },
        { onConflict: "group_id,profile_id" },
      );
    //console.log(`DbGroupMembers: joinGroup for: ${groupId} - ${profileId}`, { errorMembership });
    if (errorMembership) return { error: errorMembership.message };
    const consentSourceMap: Record<string, string> = {
      "self-joined": "join-group",
      "invited": "join-group",
      "imported": "imported",
      "admin-added": "admin-added",
    };
    // email_consents is an append-only audit log — no unique constraint on (group_id, profile_id).
    const { error: errorConsent } = await db
      .from("email_consents")
      .insert({
        group_id: groupId,
        profile_id: profileId,
        consent_type: "group_email",
        granted: true,
        source: consentSourceMap[source] ?? "join-group",
        consented_at: new Date().toISOString(),
      });
    //console.log(`DbGroupMembers: joinGroup for: ${groupId} - ${profileId}`, { errorConsent });
    if (errorConsent) return { error: errorConsent.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function getGroupMembers(
  groupId: string,
  state: State,
): Promise<GroupMember[]> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("group_memberships")
      .select(
        "id, profile_id, role, status, joined_at, email_opt_in, source, profiles!group_memberships_profile_id_fkey(name_first, name_last, email)",
      )
      .eq("group_id", groupId)
      .order("joined_at", { ascending: false });
    if (error) {
      console.log("DbMembers: getGroupMembers", { error });
      return [];
    }
    return (data ?? []).map((row) => {
      const r = row as unknown as {
        id: string;
        profile_id: string;
        role: string;
        status: string;
        joined_at: string;
        email_opt_in: boolean | null;
        source: string | null;
        profiles: {
          name_first: string | null;
          name_last: string | null;
          email: string;
        } | null;
      };
      return {
        id: r.id,
        profile_id: r.profile_id,
        name_first: r.profiles?.name_first ?? null,
        name_last: r.profiles?.name_last ?? null,
        email: r.profiles?.email ?? "",
        role: r.role,
        status: r.status,
        joined_at: r.joined_at,
        email_opt_in: r.email_opt_in ?? false,
        source: r.source ?? null,
      };
    });
  } catch {
    return [];
  }
}

export async function getMemberGroups(
  profileId: string,
  state: State,
): Promise<MemberGroupEntry[]> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("group_memberships")
      .select("role, groups!group_id(name, slug)")
      .eq("profile_id", profileId)
      .eq("status", "active")
      .order("joined_at", { ascending: false });
    if (error || !data) return [];
    return (data as unknown as Array<{
      role: string;
      groups: { name: string; slug: string } | null;
    }>)
      .filter((r) => r.groups !== null)
      .map((r) => ({
        name: r.groups!.name,
        slug: r.groups!.slug,
        role: r.role,
      }));
  } catch {
    return [];
  }
}

export async function getAccountMemberships(
  profileId: string,
  state: State,
): Promise<AccountMembership[]> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("group_memberships")
      .select(
        "id, role, email_opt_in, joined_at, group_id, groups!group_id(id, name, slug)",
      )
      .eq("profile_id", profileId)
      .eq("status", "active")
      .order("joined_at", { ascending: false });
    if (error || !data) return [];
    return (data as unknown as Array<{
      id: string;
      role: string;
      email_opt_in: boolean | null;
      joined_at: string;
      group_id: string;
      groups: { id: string; name: string; slug: string } | null;
    }>).map((r) => ({
      id: r.id,
      groupId: r.groups?.id ?? r.group_id,
      groupName: r.groups?.name ?? "",
      groupSlug: r.groups?.slug ?? "",
      role: r.role,
      joinedAt: r.joined_at,
      emailOptIn: r.email_opt_in ?? true,
    }));
  } catch {
    return [];
  }
}

export async function updateMemberRole(
  membershipId: string,
  newRole: "member" | "group_admin",
  state: State,
): Promise<{ error: string | null }> {
  try {
    const db = state.supabaseClient;
    const { data: existing } = await db
      .from("group_memberships")
      .select("role")
      .eq("id", membershipId)
      .maybeSingle();
    if ((existing as { role: string } | null)?.role === "group_owner") {
      return { error: "Cannot change the role of a group owner." };
    }
    const { error } = await db
      .from("group_memberships")
      .update({ role: newRole })
      .eq("id", membershipId);
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/** Group-scoped removal: deletes the membership row (was removeMember in groups.ts). */
export async function removeGroupMember(
  membershipId: string,
  state: State,
): Promise<{ error: string | null }> {
  try {
    const db = state.supabaseClient;
    const { data: existing } = await db
      .from("group_memberships")
      .select("role")
      .eq("id", membershipId)
      .maybeSingle();
    if ((existing as { role: string } | null)?.role === "group_owner") {
      return { error: "Cannot remove the group owner." };
    }
    const { error } = await db
      .from("group_memberships")
      .delete()
      .eq("id", membershipId);
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function banMember(
  membershipId: string,
  state: State,
): Promise<{ error: string | null }> {
  try {
    const db = state.supabaseClient;
    const { data: existing } = await db
      .from("group_memberships")
      .select("role")
      .eq("id", membershipId)
      .maybeSingle();
    if ((existing as { role: string } | null)?.role === "group_owner") {
      return { error: "Cannot ban the group owner." };
    }
    const { error } = await db
      .from("group_memberships")
      .update({ status: "banned" })
      .eq("id", membershipId);
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function departGroup(
  membershipId: string,
  profileId: string,
  state: State,
): Promise<{ error: string | null }> {
  try {
    const db = state.supabaseClient;
    const { data: existing, error: fetchError } = await db
      .from("group_memberships")
      .select("id, profile_id, role, group_id, status")
      .eq("id", membershipId)
      .maybeSingle();
    if (fetchError) return { error: fetchError.message };
    if (!existing) return { error: "Membership not found." };
    const row = existing as {
      id: string;
      profile_id: string;
      role: string;
      group_id: string;
      status: string;
    };
    if (row.profile_id !== profileId) return { error: "Not authorised." };
    if (row.role === "group_owner") {
      return { error: "Transfer group ownership before leaving." };
    }
    if (row.status !== "active") return { error: "Membership is not active." };
    const { error: updateError } = await db
      .from("group_memberships")
      .update({ status: "departed", departed_at: new Date().toISOString() })
      .eq("id", membershipId);
    if (updateError) return { error: updateError.message };
    // email_consents is append-only — insert an opt-out row rather than updating.
    await db
      .from("email_consents")
      .insert({
        group_id: row.group_id,
        profile_id: profileId,
        consent_type: "group_email",
        granted: false,
        source: "unsubscribe",
        consented_at: new Date().toISOString(),
      });
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}
