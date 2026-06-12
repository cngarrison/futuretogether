/**
 * Audit log utility — Supabase implementation.
 *
 * Records consequential admin actions for both platform admins (/admin/)
 * and group admins (/groups/[slug]/admin/).
 *
 * Backed by the `audit_logs` table (see migrations/20260621000001_audit_logs.sql).
 *
 * Usage:
 *   import { logAdminAction } from "@/utils/db/audit-log.ts";
 *   await logAdminAction(ctx.state, { ... });
 *
 * Non-fatal: errors are logged to console but never thrown.
 *
 * @deprecated staff-log.ts (Deno KV) — use this module instead.
 */

import type { State } from "@/utils.ts";
import { hasPlatformRole } from "@/utils/auth.ts";
import { createAdminClient } from "@/utils/supabase.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuditAction =
  // Group lifecycle
  | "group.approved"
  | "group.rejected"
  | "group.suspended"
  | "group.archived"
  // Events
  | "event.created"
  | "event.published"
  | "event.cancelled"
  | "event.updated"
  | "event.instances_generated"
  // Programs
  | "program.created"
  | "program.published"
  | "program.updated"
  | "program.archived"
  // Members
  | "member.added"
  | "member.removed"
  | "member.banned"
  | "member.role_changed"
  | "member.invited"
  | "member.data_exported"
  // Email
  | "email.sent"
  // Settings
  | "settings.updated";

export type AuditResourceType =
  | "group"
  | "event"
  | "program"
  | "member"
  | "email"
  | "settings";

export type AuditActorRole =
  | "site_owner"
  | "site_admin"
  | "group_owner"
  | "group_admin";

export interface AuditEntry {
  actor_id: string;
  actor_role: AuditActorRole;
  action: AuditAction;
  resource_type: AuditResourceType;
  /** UUID of the affected row (nullable). */
  resource_id?: string;
  /** Human-readable label for UI display (nullable). */
  resource_slug?: string;
  /** Group context — required for group-scoped actions. */
  group_id?: string;
  /** Action-specific detail blob. */
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the platform role for a user ID.
 * Checks site_owner first; falls back to site_admin.
 * Useful at platform-admin call sites where the middleware only confirms
 * that isSiteAdmin() is true, not which specific role.
 */
export async function resolvePlatformRole(
  profileId: string,
): Promise<"site_owner" | "site_admin"> {
  const isOwner = await hasPlatformRole(profileId, "site_owner");
  return isOwner ? "site_owner" : "site_admin";
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

/**
 * Insert an audit log entry.
 * Non-fatal: logs errors to console but never throws.
 */
export async function logAdminAction(
  _state: State,
  entry: AuditEntry,
): Promise<void> {
  // Also write to console so entries appear in Deno Deploy log viewer.
  console.log(
    `[audit] ${entry.actor_role} ${entry.actor_id} → ${entry.action}`,
    entry.resource_slug ?? entry.resource_id ?? "",
    entry.group_id ? `(group: ${entry.group_id})` : "",
  );

  // Use the service-role admin client for the insert so audit logging is
  // not dependent on the request user's JWT state or RLS policy evaluation.
  // All call sites are behind auth middleware, but using the admin client
  // is more robust and semantically correct (the server writes audit records).
  try {
    const { error } = await createAdminClient().from("audit_logs").insert({
      actor_id: entry.actor_id,
      actor_role: entry.actor_role,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id ?? null,
      resource_slug: entry.resource_slug ?? null,
      group_id: entry.group_id ?? null,
      metadata: entry.metadata ?? null,
    });
    if (error) {
      console.error("[audit] insert failed:", error.message);
    }
  } catch (err) {
    console.error("[audit] unexpected error:", err);
  }
}
