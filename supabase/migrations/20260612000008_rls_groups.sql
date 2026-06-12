-- ============================================================
-- Migration: 20260612000008_rls_groups
-- Purpose:   RLS policies for groups and group_memberships.
-- Ref:       supabase/RLS_PATTERNS.md
-- ============================================================

-- ------------------------------------------------------------
-- is_group_member()
-- SECURITY DEFINER helper used by member_read_unlisted on groups.
--
-- Why SECURITY DEFINER?
-- When anon queries the `groups` table, Postgres evaluates all
-- SELECT policies including member_read_unlisted. The EXISTS
-- subquery against group_memberships requires SELECT permission
-- on that table, which anon does not have. Running as SECURITY
-- DEFINER bypasses that permission check; anon still sees no rows
-- because auth.uid() is NULL and will never match.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_memberships
    WHERE group_id = p_group_id
      AND profile_id = (SELECT auth.uid())
      AND status = 'active'
  );
$$;

-- ------------------------------------------------------------
-- is_group_admin()
-- SECURITY DEFINER helper used by group admin RLS policies.
--
-- Why SECURITY DEFINER?
-- Admin policies on group_memberships need to query group_memberships
-- to check the caller's role. Without SECURITY DEFINER, querying
-- group_memberships from within a group_memberships policy triggers
-- infinite recursion (same pattern as is_site_admin for user_platform_roles).
-- Running as SECURITY DEFINER bypasses RLS on the inner query, breaking
-- the cycle.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_memberships
    WHERE group_id = p_group_id
      AND profile_id = (SELECT auth.uid())
      AND role IN ('group_admin', 'group_owner')
      AND status = 'active'
  );
$$;

-- ------------------------------------------------------------
-- groups
-- Public: any visitor can read active public groups.
-- Members: can also read unlisted groups they belong to.
-- Authenticated: can submit a group application (INSERT, status='pending').
-- Group admins: can update their own group settings.
-- Site admins: full access.
-- DELETE: groups are never hard-deleted; they are archived via status.
-- ------------------------------------------------------------

-- Public read: active groups with public visibility (anon + authenticated).
CREATE POLICY "public_read"
  ON public.groups FOR SELECT
  USING (status = 'active' AND visibility = 'public');

-- Member read: members can see unlisted/private groups they belong to.
CREATE POLICY "member_read_unlisted"
  ON public.groups FOR SELECT
  USING (public.is_group_member(groups.id));

-- Authenticated insert: any signed-in user can apply to start a group.
-- Application starts as 'pending'; approved by site admin.
CREATE POLICY "authenticated_insert"
  ON public.groups FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND status = 'pending'
  );

-- Group admin update: group admins/owners can edit their group settings.
CREATE POLICY "group_admin_update"
  ON public.groups FOR UPDATE
  USING (public.is_group_admin(groups.id));

-- Site admins: full access (approve/suspend/archive/create directly).
CREATE POLICY "site_admin_all"
  ON public.groups FOR ALL
  USING (public.is_site_admin());

-- ------------------------------------------------------------
-- group_memberships
-- Own: members can read and update their own membership (e.g. email_opt_in).
-- Group admins: can read all memberships and manage (add/remove/change role).
-- Self-join: authenticated users can add themselves as 'member'.
-- Self-leave: members can delete their own membership.
-- Site admins: full access.
-- Role escalation prevention: the own_membership_update policy restricts
--   WITH CHECK to the same role value to block self-promotion.
--   Enforced additionally at the application layer.
-- ------------------------------------------------------------

-- Members can read their own membership row.
CREATE POLICY "own_membership_read"
  ON public.group_memberships FOR SELECT
  USING (profile_id = (SELECT auth.uid()));

-- Group admins can read all memberships for groups they administer.
CREATE POLICY "group_admin_read"
  ON public.group_memberships FOR SELECT
  USING (public.is_group_admin(group_memberships.group_id));

-- Authenticated users can join a group as a regular member.
CREATE POLICY "authenticated_self_join"
  ON public.group_memberships FOR INSERT
  WITH CHECK (
    profile_id = (SELECT auth.uid())
    AND source = 'self-joined'
    AND role = 'member'
    AND status = 'active'
  );

-- Members can update their own membership preferences (e.g. email_opt_in).
-- WITH CHECK prevents self-escalating to admin/owner roles.
CREATE POLICY "own_membership_update"
  ON public.group_memberships FOR UPDATE
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (
    profile_id = (SELECT auth.uid())
    AND role = 'member'  -- Members may not self-promote; admin changes go via group_admin_manage
  );

-- Members can leave a group (delete their own membership row).
CREATE POLICY "own_membership_delete"
  ON public.group_memberships FOR DELETE
  USING (profile_id = (SELECT auth.uid()));

-- Group admins can fully manage memberships within their group.
CREATE POLICY "group_admin_manage"
  ON public.group_memberships FOR ALL
  USING (public.is_group_admin(group_memberships.group_id));

-- Site admins: full access.
CREATE POLICY "site_admin_all"
  ON public.group_memberships FOR ALL
  USING (public.is_site_admin());
