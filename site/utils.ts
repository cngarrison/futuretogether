import { createDefine } from "fresh";
import type { SupabaseClient, User } from "@supabase/supabase-js";

// This specifies the type of "ctx.state" which is used to share
// data among middlewares, layouts and routes.

export type UserAuth = User; // alias Supabase User - might extend UserAuth later

export interface UserProfile {
  id: string;
  email: string;
  name_first: string | null;
  name_last: string | null;
  has_password: boolean;
  location: string | null;
  wants_to_organise: boolean;
}

/** Minimal group context attached to state by /groups/[slug]/admin/_middleware.ts.
 * GroupDetail from utils/groups.ts is a structural superset — assignable without cast. */
export interface GroupInfo {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  cover_url: string;
  member_count: number;
  status: string;
  visibility: string;
}

/** Group membership context attached to state by /groups/[slug]/admin/_middleware.ts */
export interface GroupMembershipInfo {
  id: string;
  role: "group_owner" | "group_admin" | "member";
  status: string;
  email_opt_in: boolean;
}

export interface State {
  user: UserAuth | null;
  profile: UserProfile | null;
  supabaseClient: SupabaseClient;
  /** Set by /groups/[slug]/admin/_middleware.ts */
  group?: GroupInfo;
  /** Set by /groups/[slug]/admin/_middleware.ts; null when isSiteAdminBypass is true */
  membership?: GroupMembershipInfo | null;
  /** True when a site admin views a group admin page without being a group member */
  isSiteAdminBypass?: boolean;
  /** Set by admin route handlers to drive the breadcrumb bar in the admin layout */
  adminBreadcrumbs?: Array<{ label: string; href?: string }>;
}

export const define = createDefine<State>();
