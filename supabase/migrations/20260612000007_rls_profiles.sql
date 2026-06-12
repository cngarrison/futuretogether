-- ============================================================
-- Migration: 20260612000007_rls_profiles
-- Purpose:   RLS policies for profiles and user_platform_roles.
-- Ref:       supabase/RLS_PATTERNS.md
-- Rule:      All auth.uid() calls wrapped in (SELECT auth.uid())
--            so they are evaluated once per query, not once per row.
--            See: security-rls-performance.md
-- ============================================================

-- ------------------------------------------------------------
-- is_site_admin()
-- SECURITY DEFINER helper used by all admin RLS policies.
--
-- Why SECURITY DEFINER?
-- Admin policies on both `profiles` and `user_platform_roles` need
-- to query user_platform_roles to check the caller's role.
-- Without SECURITY DEFINER, querying user_platform_roles from
-- within a user_platform_roles policy triggers infinite recursion
-- (Postgres evaluates all SELECT policies in OR-fashion and cannot
-- short-circuit). Running as SECURITY DEFINER bypasses RLS on the
-- inner query, breaking the cycle.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_site_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_platform_roles
    WHERE profile_id = (SELECT auth.uid())
      AND role IN ('site_admin', 'site_owner')
  );
$$;

-- ------------------------------------------------------------
-- profiles
-- Own record: each user can read and update their own row.
-- Site admins can read and update all profile rows.
-- INSERT: not exposed; exclusively handled by the auth trigger
--         (handle_new_auth_user) which runs SECURITY DEFINER.
-- DELETE: cascades from auth.users; no policy needed.
-- ------------------------------------------------------------

-- Users can read their own row.
CREATE POLICY "own_record_read"
  ON public.profiles FOR SELECT
  USING (id = (SELECT auth.uid()));

-- Users can update their own row (name_first/last, age_confirmed, etc.).
CREATE POLICY "own_record_update"
  ON public.profiles FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Site admins can read all profile rows (for member management).
CREATE POLICY "site_admin_read_all"
  ON public.profiles FOR SELECT
  USING (public.is_site_admin());

-- Site admins can update any profile row (e.g. suspend, verify).
CREATE POLICY "site_admin_update"
  ON public.profiles FOR UPDATE
  USING (public.is_site_admin())
  WITH CHECK (public.is_site_admin());

-- ------------------------------------------------------------
-- user_platform_roles
-- Users can read their own roles (needed for middleware role checks).
-- Only site admins (and service role) can grant/revoke roles.
-- The site_admin_all policy intentionally allows a site admin to
-- read all platform roles — needed for the admin member list.
-- ------------------------------------------------------------

-- Users can read their own platform roles.
CREATE POLICY "own_roles_read"
  ON public.user_platform_roles FOR SELECT
  USING (profile_id = (SELECT auth.uid()));

-- Site admins have full access to all platform roles.
CREATE POLICY "site_admin_all"
  ON public.user_platform_roles FOR ALL
  USING (public.is_site_admin())
  WITH CHECK (public.is_site_admin());
