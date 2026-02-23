/**
 * Member management for Future Together community.
 *
 * Members are stored in Deno KV with email as the primary key.
 * A member record is created when someone:
 *   (a) submits the /join membership form directly, or
 *   (b) registers for an event and ticks "join the community"
 *
 * Key structure:
 *   ["member", email]   → Member  (primary; email normalised to lowercase)
 *   ["member_id", id]   → email   (reverse lookup by UUID if needed)
 */

import { getKv } from "./kv.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MemberRole = "member" | "organiser";
export type MemberSource = "join_form" | "event_registration";

export interface Member {
  id: string;
  email: string;          // always lowercase
  firstName: string;
  lastName: string;
  joinedAt: string;       // ISO timestamp
  updatedAt: string;      // ISO timestamp
  role: MemberRole;
  source: MemberSource;   // first point of contact
  status?: "active" | "removed"; // omitted = active (backward compat)
  interests: string[];    // selected topic labels
  heardFrom?: string;     // how they found Future Together
  location?: string;      // city / region (optional)
}

export interface MemberInput {
  email: string;
  firstName: string;
  lastName: string;
  role?: MemberRole;
  source: MemberSource;
  interests?: string[];
  heardFrom?: string;
  location?: string;
}

export interface MemberResult {
  success: boolean;
  member?: Member;
  /** true if a new record was created; false if the email already existed */
  created: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getMemberByEmail(
  email: string,
): Promise<Member | null> {
  const kv = await getKv();
  const result = await kv.get<Member>(["member", email.toLowerCase()]);
  return result.value;
}

export async function getMemberById(id: string): Promise<Member | null> {
  const kv = await getKv();
  const emailResult = await kv.get<string>(["member_id", id]);
  if (!emailResult.value) return null;
  return getMemberByEmail(emailResult.value);
}

export async function getAllMembers(): Promise<Member[]> {
  const kv = await getKv();
  const members: Member[] = [];
  const iter = kv.list<Member>({ prefix: ["member"] });
  for await (const { value } of iter) {
    members.push(value);
  }
  return members.sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
}

/** All members regardless of status. */
export async function getMemberCount(): Promise<number> {
  const members = await getAllMembers();
  return members.length;
}

/** Active (non-removed) members only. */
export async function getActiveMembers(): Promise<Member[]> {
  const all = await getAllMembers();
  return all.filter((m) => m.status !== "removed");
}

/** Soft-remove a member by email. The record is retained for data integrity. */
export async function removeMember(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  const kv = await getKv();
  const emailKey = email.toLowerCase().trim();
  const existing = await getMemberByEmail(emailKey);

  if (!existing) {
    return { success: false, error: "Member not found" };
  }
  if (existing.status === "removed") {
    return { success: false, error: "Member already removed" };
  }

  const updated: Member = {
    ...existing,
    status: "removed",
    updatedAt: new Date().toISOString(),
  };

  const result = await kv.set(["member", emailKey], updated);
  return result.ok ? { success: true } : { success: false, error: "KV write failed" };
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

/**
 * Create a new member, or update an existing one.
 *
 * - If the email already exists, only upgrades the role to "organiser"
 *   (never downgrades) and merges any new interests.
 * - Returns created: true only when a brand-new record is written.
 */
export async function createMember(input: MemberInput): Promise<MemberResult> {
  const kv = await getKv();
  const emailKey = input.email.toLowerCase().trim();

  const existing = await getMemberByEmail(emailKey);

  if (existing) {
    const upgradeRole = input.role === "organiser" &&
      existing.role !== "organiser";
    const newInterests = (input.interests ?? []).filter(
      (i) => !existing.interests.includes(i),
    );

    if (upgradeRole || newInterests.length > 0) {
      const updated: Member = {
        ...existing,
        role: upgradeRole ? "organiser" : existing.role,
        interests: [...existing.interests, ...newInterests],
        heardFrom: existing.heardFrom ?? input.heardFrom,
        location: existing.location ?? input.location,
        updatedAt: new Date().toISOString(),
      };
      await kv.set(["member", emailKey], updated);
      return { success: true, member: updated, created: false };
    }

    return { success: true, member: existing, created: false };
  }

  // Brand-new member
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const member: Member = {
    id,
    email: emailKey,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    joinedAt: now,
    updatedAt: now,
    role: input.role ?? "member",
    source: input.source,
    interests: input.interests ?? [],
    heardFrom: input.heardFrom?.trim(),
    location: input.location?.trim(),
  };

  const atomic = kv.atomic()
    .set(["member", emailKey], member)
    .set(["member_id", id], emailKey);

  const result = await atomic.commit();
  if (!result.ok) {
    return { success: false, created: false, error: "Failed to create member" };
  }

  return { success: true, member, created: true };
}
