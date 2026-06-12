/**
 * site/utils/db/groups.ts
 *
 * Group entity CRUD, application workflow, approval, invite links, action tokens,
 * and email history. Moved from site/utils/groups.ts — no logic changes.
 */

import { createAdminClient } from "@/utils/supabase.ts";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { State } from "@/utils.ts";
import { buildEmailHtml, sendEmail, SITE_URL } from "@/utils/email.ts";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface GroupSummary {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  location_name: string | null;
  location_state: string | null;
  location_country: string | null;
  tier: string | null;
  tags: string[];
  member_count: number;
  cover_url: string;
  status: string;
  visibility: string;
}

export interface GroupDetail extends GroupSummary {
  group_type: string;
  location_suburb: string | null;
  location_region: string | null;
  lat: number | null;
  lng: number | null;
  website_url: string | null;
  created_at: string;
  approved_at: string | null;
  applicant_id: string | null;
  applicant_name: string | null;
  applicant_email: string | null;
  applicant_why: string | null;
  applicant_how: string | null;
}

export interface GroupApplication {
  name: string;
  group_type: "geographic" | "non-geographic";
  location_name?: string;
  location_suburb?: string;
  location_region?: string;
  tier_suggestion?: string;
  tagline: string;
  description: string;
  why_start: string;
  how_grow: string;
  website_url?: string;
  tags?: string[];
  applicant_id: string;
  coc_agreed: boolean;
}

export interface GroupDashboardStats {
  activeCount: number;
  pendingCount: number;
  totalMembers: number;
  newLast30Days: number;
  recentApplications: Array<{
    id: string;
    slug: string;
    name: string;
    status: string;
    created_at: string;
  }>;
}

export interface GroupEmailSend {
  id: string;
  subject: string;
  sent_at: string;
  recipient_count: number | null;
  sent_count: number | null;
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const FALLBACK_COVER = "/img/meetup-group-lg.webp";

const GROUP_SELECT = `
  id, slug, name, tagline, description,
  location_name, location_state, location_country, location_suburb, location_region,
  lat, lng,
  group_type, tier, tags,
  cover_image_path, status, visibility,
  website_url, created_at, approved_at,
  applicant_id, applicant_why, applicant_how
`;

const GROUP_ADMIN_SELECT = GROUP_SELECT +
  `, applicant_profile:profiles!applicant_id(name_first, name_last, email)`;

// ---------------------------------------------------------------------------
// Image resolution
// ---------------------------------------------------------------------------

export async function resolveGroupCoverImage(
  coverImagePath: string | null,
): Promise<string> {
  if (!coverImagePath) return FALLBACK_COVER;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from("groups")
      .createSignedUrl(coverImagePath, 3600);
    if (error || !data?.signedUrl) return FALLBACK_COVER;
    return data.signedUrl;
  } catch {
    return FALLBACK_COVER;
  }
}

// ---------------------------------------------------------------------------
// Member count helper
// ---------------------------------------------------------------------------

export async function getGroupMemberCount(
  groupId: string,
  db: SupabaseClient,
): Promise<number> {
  try {
    const { count, error } = await db
      .from("group_memberships")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("status", "active");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

async function rowToGroupSummary(
  row: Record<string, unknown>,
  db: SupabaseClient,
): Promise<GroupSummary> {
  const memberCount = await getGroupMemberCount(row.id as string, db);
  const cover_url = await resolveGroupCoverImage(
    (row.cover_image_path as string | null) ?? null,
  );
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    tagline: (row.tagline as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    location_name: (row.location_name as string | null) ?? null,
    location_state: (row.location_state as string | null) ?? null,
    location_country: (row.location_country as string | null) ?? null,
    tier: (row.tier as string | null) ?? null,
    tags: (row.tags as string[]) ?? [],
    member_count: memberCount,
    cover_url,
    status: row.status as string,
    visibility: row.visibility as string,
  };
}

async function rowToGroupDetail(
  row: Record<string, unknown>,
  db: SupabaseClient,
): Promise<GroupDetail> {
  const summary = await rowToGroupSummary(row, db);
  return {
    ...summary,
    group_type: (row.group_type as string) ?? "geographic",
    location_suburb: (row.location_suburb as string | null) ?? null,
    location_region: (row.location_region as string | null) ?? null,
    lat: (row.lat as number | null) ?? null,
    lng: (row.lng as number | null) ?? null,
    website_url: (row.website_url as string | null) ?? null,
    created_at: row.created_at as string,
    approved_at: (row.approved_at as string | null) ?? null,
    applicant_id: (row.applicant_id as string | null) ?? null,
    ...(() => {
      const p = row.applicant_profile as
        | { name_first: string | null; name_last: string | null; email: string }
        | null
        | undefined;
      if (!p) return { applicant_name: null, applicant_email: null };
      const name = [p.name_first, p.name_last].filter(Boolean).join(" ") ||
        null;
      return { applicant_name: name, applicant_email: p.email };
    })(),
    applicant_why: (row.applicant_why as string | null) ?? null,
    applicant_how: (row.applicant_how as string | null) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Public queries
// ---------------------------------------------------------------------------

export async function getPublicGroups(state: State): Promise<GroupSummary[]> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("groups")
      .select(GROUP_SELECT)
      .eq("status", "active")
      .eq("visibility", "public")
      .order("name", { ascending: true });
    if (error || !data) return [];
    return await Promise.all(
      data.map((row) => rowToGroupSummary(row as Record<string, unknown>, db)),
    );
  } catch {
    return [];
  }
}

export async function getGroupBySlug(
  slug: string,
  state: State,
): Promise<GroupDetail | null> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("groups")
      .select(GROUP_SELECT)
      .eq("slug", slug)
      .eq("status", "active")
      .neq("visibility", "private")
      .maybeSingle();
    if (error || !data) return null;
    return rowToGroupDetail(data as Record<string, unknown>, db);
  } catch {
    return null;
  }
}

export async function getGroupBySlugAdmin(
  slug: string,
): Promise<GroupDetail | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("groups")
      .select(GROUP_ADMIN_SELECT)
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    return rowToGroupDetail(data as unknown as Record<string, unknown>, admin);
  } catch {
    return null;
  }
}

export async function getGroupIdBySlugAdmin(
  slug: string,
): Promise<GroupDetail | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("groups")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    return rowToGroupDetail(data as unknown as Record<string, unknown>, admin);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Group application
// ---------------------------------------------------------------------------

export async function createGroupApplication(
  app: GroupApplication,
): Promise<{ groupId: string | null; error: string | null }> {
  try {
    const admin = createAdminClient();
    const slug = app.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(
      /^-+|-+$/g,
      "",
    );
    const { data, error } = await admin
      .from("groups")
      .insert({
        name: app.name,
        slug,
        group_type: app.group_type,
        location_name: app.location_name ?? null,
        location_suburb: app.location_suburb ?? null,
        location_region: app.location_region ?? null,
        website_url: app.website_url ?? null,
        tier: app.tier_suggestion ?? null,
        tagline: app.tagline,
        description: app.description,
        status: "pending",
        visibility: "public",
        tags: app.tags ?? [],
        applicant_id: app.applicant_id,
        applicant_why: app.why_start,
        applicant_how: app.how_grow,
      })
      .select("id")
      .single();
    if (error) return { groupId: null, error: error.message };
    const groupId = (data as { id: string }).id;

    // Geocode (non-fatal)
    if (app.group_type === "geographic" && app.location_name) {
      try {
        const query = [
          app.location_name,
          app.location_suburb,
          app.location_region,
        ].filter(Boolean).join(", ");
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${
            encodeURIComponent(query)
          }&format=json&limit=1`,
          {
            headers: {
              "User-Agent": `FutureTogether/1.0 (${
                Deno.env.get("FT_SITE_OWNER_EMAIL") ??
                  "charlie@futuretogether.community"
              })`,
            },
          },
        );
        const geoData = await geoRes.json() as Array<
          { lat: string; lon: string }
        >;
        if (geoData?.[0]) {
          await admin.from("groups").update({
            lat: parseFloat(geoData[0].lat),
            lng: parseFloat(geoData[0].lon),
          }).eq("id", groupId);
        }
      } catch { /* non-fatal */ }
    }

    // Email notification (fire-and-forget)
    let applicantDisplayName = "Unknown";
    let applicantEmail = "";
    try {
      const { data: profileData } = await admin.from("profiles").select(
        "name_first, name_last, email",
      ).eq("id", app.applicant_id).maybeSingle();
      if (profileData) {
        const p = profileData as {
          name_first: string | null;
          name_last: string | null;
          email: string;
        };
        applicantDisplayName =
          [p.name_first, p.name_last].filter(Boolean).join(" ") || p.email;
        applicantEmail = p.email;
      }
    } catch { /* non-fatal */ }

    const locationParts = [
      app.location_suburb,
      app.location_region,
      app.location_name,
    ].filter(Boolean);
    const locationDisplay = locationParts.length > 0
      ? locationParts.join(", ")
      : "—";
    const [approveUrl, declineUrl] = await Promise.all([
      buildGroupActionUrl("approve", groupId),
      buildGroupActionUrl("decline", groupId),
    ]);

    const emailContent = `
      <h2 style="margin:0 0 20px;font-size:22px;color:#1c1a18;">New group application</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#4b5563;">A new group application has been submitted and is awaiting your review.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr><td style="padding:10px 0;border-bottom:1px solid #e8e3db;width:38%;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;">Group name</td><td style="padding:10px 0;border-bottom:1px solid #e8e3db;">${app.name}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #e8e3db;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;">Type</td><td style="padding:10px 0;border-bottom:1px solid #e8e3db;">${app.group_type}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #e8e3db;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;">Location</td><td style="padding:10px 0;border-bottom:1px solid #e8e3db;">${locationDisplay}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #e8e3db;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;">Applicant</td><td style="padding:10px 0;border-bottom:1px solid #e8e3db;">${applicantDisplayName}${
      applicantEmail
        ? ` &lt;<a href="mailto:${applicantEmail}">${applicantEmail}</a>&gt;`
        : ""
    }</td></tr>
      </table>
      <h3 style="margin:0 0 8px;font-size:16px;color:#1c1a18;">Description</h3>
      <p style="margin:0 0 24px;font-size:15px;color:#4b5563;white-space:pre-wrap;">${app.description}</p>
      <h3 style="margin:0 0 8px;font-size:16px;color:#1c1a18;">Why start this group?</h3>
      <p style="margin:0 0 24px;font-size:15px;color:#4b5563;white-space:pre-wrap;">${app.why_start}</p>
      <h3 style="margin:0 0 8px;font-size:16px;color:#1c1a18;">How do they plan to grow it?</h3>
      <p style="margin:0 0 32px;font-size:15px;color:#4b5563;white-space:pre-wrap;">${app.how_grow}</p>
      <p style="text-align:center;margin:0 0 12px;">
        <a href="${approveUrl}" class="btn btn-teal" style="margin-right:8px;">Approve &rarr;</a>
        <a href="${declineUrl}" class="btn" style="background:#721c24;margin-left:8px;">Decline &rarr;</a>
      </p>
      <p style="text-align:center;margin:8px 0 0;font-size:13px;color:#6b7280;">Or <a href="${SITE_URL}/admin/groups/${slug}">review in admin</a></p>
    `;
    sendEmail({
      to: Deno.env.get("FT_SITE_OWNER_EMAIL") ??
        "charlie@futuretogether.community",
      subject: `New group application: ${app.name}`,
      html: buildEmailHtml(emailContent, `New group application: ${app.name}`),
      replyTo: applicantEmail || undefined,
    }).catch((err) =>
      console.error("DbGroups: admin notification email failed:", err)
    );

    return { groupId, error: null };
  } catch (err) {
    return {
      groupId: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// Admin queries
// ---------------------------------------------------------------------------

export async function getGroupDashboardStatsAdmin(): Promise<
  GroupDashboardStats
> {
  try {
    const admin = createAdminClient();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString();
    const [activeRes, pendingRes, membersRes, newRes, recentRes] = await Promise
      .all([
        admin.from("groups").select("*", { count: "exact", head: true }).eq(
          "status",
          "active",
        ),
        admin.from("groups").select("*", { count: "exact", head: true }).eq(
          "status",
          "pending",
        ),
        admin.from("group_memberships").select("*", {
          count: "exact",
          head: true,
        }).eq("status", "active"),
        admin.from("groups").select("*", { count: "exact", head: true }).in(
          "status",
          ["active", "pending"],
        ).gte("created_at", thirtyDaysAgo),
        admin.from("groups").select("id, slug, name, status, created_at").order(
          "created_at",
          { ascending: false },
        ).limit(5),
      ]);
    return {
      activeCount: activeRes.count ?? 0,
      pendingCount: pendingRes.count ?? 0,
      totalMembers: membersRes.count ?? 0,
      newLast30Days: newRes.count ?? 0,
      recentApplications: (recentRes.data ?? []) as Array<
        {
          id: string;
          slug: string;
          name: string;
          status: string;
          created_at: string;
        }
      >,
    };
  } catch {
    return {
      activeCount: 0,
      pendingCount: 0,
      totalMembers: 0,
      newLast30Days: 0,
      recentApplications: [],
    };
  }
}

export async function suspendGroupAdmin(
  groupId: string,
  _adminId: string,
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient();
    const { data: groupRow } = await admin.from("groups").select("name").eq(
      "id",
      groupId,
    ).maybeSingle();
    const groupName = (groupRow as { name: string } | null)?.name ??
      "the group";
    const { error } = await admin.from("groups").update({ status: "suspended" })
      .eq("id", groupId);
    if (error) return { error: error.message };
    const { data: members } = await admin
      .from("group_memberships")
      .select("profiles(name_first, name_last, email)")
      .eq("group_id", groupId)
      .eq("status", "active");
    if (members && members.length > 0) {
      for (const m of members) {
        const profile = (m as unknown as {
          profiles: {
            name_first: string | null;
            name_last: string | null;
            email: string;
          } | null;
        }).profiles;
        if (!profile?.email) continue;
        const memberName =
          [profile.name_first, profile.name_last].filter(Boolean).join(" ") ||
          "there";
        sendEmail({
          to: profile.email,
          subject: `Important update about ${groupName}`,
          html: buildEmailHtml(
            `<h2>${groupName} has been temporarily suspended</h2><p>Hi ${memberName}, we'll be in touch.</p>`,
            `Update: ${groupName} has been temporarily suspended`,
          ),
        }).catch((err) => console.error("suspendGroup email:", err));
      }
    }
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function reactivateGroupAdmin(
  groupId: string,
  _adminId: string,
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("groups")
      .update({ status: "active", approved_at: new Date().toISOString() })
      .eq("id", groupId);
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function getGroupEmailHistory(
  groupId: string,
  state: State,
): Promise<GroupEmailSend[]> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db
      .from("email_sends")
      .select("id, subject, sent_at, recipient_count, sent_count")
      .eq("group_id", groupId)
      .order("sent_at", { ascending: false })
      .limit(20);
    if (error) return [];
    return (data ?? []) as GroupEmailSend[];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Action tokens
// ---------------------------------------------------------------------------

export async function generateGroupActionToken(
  action: string,
  groupId: string,
  expiresAt: number,
): Promise<string> {
  const secret = Deno.env.get("FT_TOKEN_SECRET") ?? "ft-dev-secret";
  const message = `${action}:${groupId}:${expiresAt}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-")
    .replace(/\//g, "_").replace(/=/g, "");
}

export async function verifyGroupActionToken(
  action: string,
  groupId: string,
  expiresAt: number,
  token: string,
): Promise<boolean> {
  if (Date.now() > expiresAt) return false;
  const expected = await generateGroupActionToken(action, groupId, expiresAt);
  return expected === token;
}

export async function buildGroupActionUrl(
  action: "approve" | "decline",
  groupId: string,
): Promise<string> {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const token = await generateGroupActionToken(action, groupId, expiresAt);
  return `${SITE_URL}/admin/groups/action?action=${action}&id=${groupId}&expires=${expiresAt}&token=${token}`;
}

export async function getGroupsForAdmin(): Promise<GroupDetail[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("groups").select(GROUP_SELECT)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    const groups = await Promise.all(
      data.map((row) =>
        rowToGroupDetail(row as Record<string, unknown>, admin)
      ),
    );
    groups.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime();
    });
    return groups;
  } catch {
    return [];
  }
}

export async function approveGroupAdmin(
  groupId: string,
  approverId: string,
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient();
    const { data: groupRow } = await admin.from("groups").select(
      "applicant_id, slug, name",
    ).eq("id", groupId).maybeSingle();
    const gr = groupRow as {
      applicant_id: string | null;
      slug: string;
      name: string;
    } | null;
    const applicantId = gr?.applicant_id ?? null;
    const groupSlug = gr?.slug ?? "";
    const groupName = gr?.name ?? "";
    const { error } = await admin.from("groups").update({
      status: "active",
      approved_at: new Date().toISOString(),
      approved_by_id: approverId,
    }).eq("id", groupId);
    if (error) return { error: error.message };
    if (applicantId) {
      await admin.from("group_memberships").upsert(
        {
          group_id: groupId,
          profile_id: applicantId,
          role: "group_owner",
          status: "active",
          email_opt_in: true,
          source: "admin-added",
        },
        { onConflict: "group_id,profile_id" },
      );
      try {
        const { data: op } = await admin.from("profiles").select(
          "name_first, name_last, email",
        ).eq("id", applicantId).maybeSingle();
        if (op) {
          const p = op as {
            name_first: string | null;
            name_last: string | null;
            email: string;
          };
          const ownerName =
            [p.name_first, p.name_last].filter(Boolean).join(" ") || "there";
          sendEmail({
            to: p.email,
            subject: `Your Future Together group has been approved`,
            html: buildEmailHtml(
              `<h2>Your group has been approved! 🎉</h2><p>Hi ${ownerName}, <strong>${groupName}</strong> is now live. <a href="${SITE_URL}/groups/${groupSlug}/admin/">Open your admin panel</a>.</p>`,
              `${groupName} is now live`,
            ),
          }).catch((err) => console.error("approveGroup welcome email:", err));
        }
      } catch { /* non-fatal */ }
    }
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

const DECLINE_REASON_MAP: Record<string, string> = {
  spam: "The application appeared to be spam or not genuine.",
  marketing:
    "The application appeared to be commercial or marketing in nature.",
  duplicate: "There is already an existing group serving your area.",
  incomplete:
    "The application was incomplete. You're welcome to reapply with more detail.",
  other:
    "After review, we are unable to approve this application at this time.",
};

export async function declineGroupAdmin(
  groupId: string,
  reason: string,
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient();
    const { data: groupRow } = await admin.from("groups").select(
      "name, applicant_id",
    ).eq("id", groupId).maybeSingle();
    const gr = groupRow as { name: string; applicant_id: string | null } | null;
    const groupName = gr?.name ?? "your group";
    const applicantId = gr?.applicant_id ?? null;
    const { error } = await admin.from("groups").update({
      status: "archived",
      archived_at: new Date().toISOString(),
    }).eq("id", groupId);
    if (error) return { error: error.message };
    if (applicantId) {
      try {
        const { data: profileData } = await admin.from("profiles").select(
          "name_first, name_last, email",
        ).eq("id", applicantId).maybeSingle();
        if (profileData) {
          const p = profileData as {
            name_first: string | null;
            name_last: string | null;
            email: string;
          };
          const applicantName =
            [p.name_first, p.name_last].filter(Boolean).join(" ") || "there";
          const reasonText = DECLINE_REASON_MAP[reason] ??
            DECLINE_REASON_MAP["other"];
          sendEmail({
            to: p.email,
            subject: `Update on your Future Together group application`,
            html: buildEmailHtml(
              `<h2>Update on your group application</h2><p>Hi ${applicantName}, thank you for applying to start <strong>${groupName}</strong>. After review, we're unable to approve this application. ${reasonText}</p>`,
              `Update on your ${groupName} application`,
            ),
          }).catch((err) => console.error("declineGroup email:", err));
        }
      } catch { /* non-fatal */ }
    }
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ---------------------------------------------------------------------------
// Invite links
// ---------------------------------------------------------------------------

export async function generateInviteLink(
  groupId: string,
  groupSlug: string,
  createdById: string,
  email: string | undefined,
  state: State,
): Promise<{ url: string | null; error: string | null }> {
  try {
    const db = state.supabaseClient;
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes).map((b) =>
      b.toString(16).padStart(2, "0")
    ).join("");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString();
    const { error } = await db.from("group_invites").insert({
      group_id: groupId,
      token,
      email: email ?? null,
      created_by_id: createdById,
      expires_at: expiresAt,
    });
    if (error) return { url: null, error: error.message };
    return {
      url: `${SITE_URL}/groups/${groupSlug}/join?token=${token}`,
      error: null,
    };
  } catch (err) {
    return {
      url: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export function sendInviteEmail(
  inviteUrl: string,
  recipientEmail: string,
  groupName: string,
  senderName: string,
): void {
  sendEmail({
    to: recipientEmail,
    subject: `You're invited to join ${groupName}`,
    html: buildEmailHtml(
      `<h2>You're invited to join ${groupName}</h2><p>${senderName} has invited you to join <strong>${groupName}</strong> on Future Together. <a href="${inviteUrl}">Accept invitation &rarr;</a> (link expires in 7 days, single use).</p>`,
      `Invitation to join ${groupName}`,
    ),
  }).catch((err) => console.error("DbGroups: sendInviteEmail failed:", err));
}

export async function redeemInviteToken(
  token: string,
  usedById: string,
  state: State,
): Promise<{ groupId: string | null; error: string | null }> {
  try {
    const db = state.supabaseClient;
    const { data, error } = await db.from("group_invites").select(
      "id, group_id, expires_at, used_at",
    ).eq("token", token).maybeSingle();
    if (error || !data) return { groupId: null, error: "Invalid invite link." };
    const row = data as {
      id: string;
      group_id: string;
      expires_at: string;
      used_at: string | null;
    };
    if (row.used_at) {
      return {
        groupId: null,
        error: "This invite link has already been used.",
      };
    }
    if (new Date(row.expires_at) < new Date()) {
      return { groupId: null, error: "This invite link has expired." };
    }
    await db.from("group_invites").update({
      used_at: new Date().toISOString(),
      used_by_id: usedById,
    }).eq("id", row.id);
    return { groupId: row.group_id, error: null };
  } catch (err) {
    return {
      groupId: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
