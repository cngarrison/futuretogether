-- ============================================================
-- Migration: 20260612000009_rls_events
-- Purpose:   RLS policies for group_events, event_registrations,
--            event_reminder_logs.
-- Ref:       supabase/RLS_PATTERNS.md
-- ============================================================

-- ------------------------------------------------------------
-- group_events
-- Public: published events with public/featured visibility.
-- Group members: can read group-visibility events for their groups.
-- Group admins: can create and manage events for their group.
-- Site admins: full access.
-- ------------------------------------------------------------

-- Public read: published + completed events visible to anyone (anon + authenticated).
-- 'completed' allows past events to remain publicly accessible after they end.
CREATE POLICY "public_read"
  ON public.group_events FOR SELECT
  USING (
    status IN ('published', 'completed')
    AND visibility IN ('public', 'featured')
  );

-- Group member read: members can see group-scoped (non-public) events.
-- TO authenticated: anon has no SELECT on group_memberships; this policy must not apply to anon
-- or the EXISTS subquery will throw a permission error even when public_read would suffice.
CREATE POLICY "group_member_read"
  ON public.group_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_memberships gm
      WHERE gm.group_id = group_events.group_id
        AND gm.profile_id = (SELECT auth.uid())
        AND gm.status = 'active'
    )
  );

-- Group admins can insert events into their group (any status, including draft).
CREATE POLICY "group_admin_insert"
  ON public.group_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_memberships gm
      WHERE gm.group_id = group_events.group_id
        AND gm.profile_id = (SELECT auth.uid())
        AND gm.role IN ('group_admin', 'group_owner')
        AND gm.status = 'active'
    )
  );

-- Group admins can update events in their group.
CREATE POLICY "group_admin_update"
  ON public.group_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_memberships gm
      WHERE gm.group_id = group_events.group_id
        AND gm.profile_id = (SELECT auth.uid())
        AND gm.role IN ('group_admin', 'group_owner')
        AND gm.status = 'active'
    )
  );

-- Group admins can delete events in their group.
-- Note: prefer setting status='cancelled' over deletion.
CREATE POLICY "group_admin_delete"
  ON public.group_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_memberships gm
      WHERE gm.group_id = group_events.group_id
        AND gm.profile_id = (SELECT auth.uid())
        AND gm.role IN ('group_admin', 'group_owner')
        AND gm.status = 'active'
    )
  );

-- Site admins: full access.
CREATE POLICY "site_admin_all"
  ON public.group_events FOR ALL
  USING (public.is_site_admin());

-- ------------------------------------------------------------
-- event_registrations
-- Own: authenticated users can read/update (cancel) their own registrations.
-- Guest INSERT: anon users can register with profile_id = NULL.
-- Group admins: can manage all registrations for events in their group.
-- Site admins: full access.
-- ------------------------------------------------------------

-- Users can read their own registration rows.
CREATE POLICY "own_registration_read"
  ON public.event_registrations FOR SELECT
  USING (profile_id = (SELECT auth.uid()));

-- Authenticated users can register for events (profile_id must match).
CREATE POLICY "authenticated_insert"
  ON public.event_registrations FOR INSERT
  WITH CHECK (profile_id = (SELECT auth.uid()));

-- Guest (unauthenticated) registration: profile_id must be NULL.
CREATE POLICY "anon_guest_insert"
  ON public.event_registrations FOR INSERT
  WITH CHECK (profile_id IS NULL);

-- Users can cancel their own registration.
CREATE POLICY "own_registration_update"
  ON public.event_registrations FOR UPDATE
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));

-- Group admins can manage all registrations for their group's events.
CREATE POLICY "group_admin_all"
  ON public.event_registrations FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.group_events ge
      JOIN public.group_memberships gm ON gm.group_id = ge.group_id
      WHERE ge.id = event_registrations.event_id
        AND gm.profile_id = (SELECT auth.uid())
        AND gm.role IN ('group_admin', 'group_owner')
        AND gm.status = 'active'
    )
  );

-- Site admins: full access.
CREATE POLICY "site_admin_all"
  ON public.event_registrations FOR ALL
  USING (public.is_site_admin());

-- ------------------------------------------------------------
-- event_reminder_logs
-- Append-only internal audit table.
-- INSERT is service-role only (automated reminder system; no policy needed).
-- SELECT: site admins + group admins of the relevant group.
-- No UPDATE or DELETE policies.
-- ------------------------------------------------------------

-- Site admins can read all reminder logs.
CREATE POLICY "site_admin_read"
  ON public.event_reminder_logs FOR SELECT
  USING (public.is_site_admin());

-- Group admins can read reminder logs for registrations on their events.
CREATE POLICY "group_admin_read"
  ON public.event_reminder_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.event_registrations er
      JOIN public.group_events ge ON ge.id = er.event_id
      JOIN public.group_memberships gm ON gm.group_id = ge.group_id
      WHERE er.id = event_reminder_logs.registration_id
        AND gm.profile_id = (SELECT auth.uid())
        AND gm.role IN ('group_admin', 'group_owner')
        AND gm.status = 'active'
    )
  );

-- ------------------------------------------------------------
-- group_programs
-- Replaces programs_anon_select + programs_authenticated_select that were
-- removed from 20260612000004_tables_events. All program RLS lives here.
-- ------------------------------------------------------------

-- Anon: published programs with public visibility.
CREATE POLICY "anon_public_read"
  ON public.group_programs FOR SELECT TO anon
  USING (status = 'published' AND visibility = 'public');

-- Authenticated: published programs with public or unlisted visibility.
CREATE POLICY "authenticated_read"
  ON public.group_programs FOR SELECT TO authenticated
  USING (status = 'published' AND visibility IN ('public', 'unlisted'));

-- Group admins can read all programs for their group (including draft/archived).
CREATE POLICY "group_admin_read"
  ON public.group_programs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_memberships gm
      WHERE gm.group_id = group_programs.group_id
        AND gm.profile_id = (SELECT auth.uid())
        AND gm.role IN ('group_admin', 'group_owner')
        AND gm.status = 'active'
    )
  );

-- Group admins can create programs in their group.
CREATE POLICY "group_admin_insert"
  ON public.group_programs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_memberships gm
      WHERE gm.group_id = group_programs.group_id
        AND gm.profile_id = (SELECT auth.uid())
        AND gm.role IN ('group_admin', 'group_owner')
        AND gm.status = 'active'
    )
  );

-- Group admins can update programs in their group.
CREATE POLICY "group_admin_update"
  ON public.group_programs FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_memberships gm
      WHERE gm.group_id = group_programs.group_id
        AND gm.profile_id = (SELECT auth.uid())
        AND gm.role IN ('group_admin', 'group_owner')
        AND gm.status = 'active'
    )
  );

-- Group admins can delete programs in their group.
-- Note: prefer setting status = 'archived' over hard deletion.
CREATE POLICY "group_admin_delete"
  ON public.group_programs FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_memberships gm
      WHERE gm.group_id = group_programs.group_id
        AND gm.profile_id = (SELECT auth.uid())
        AND gm.role IN ('group_admin', 'group_owner')
        AND gm.status = 'active'
    )
  );

-- Site admins: full access to all programs.
CREATE POLICY "site_admin_all"
  ON public.group_programs FOR ALL
  USING (public.is_site_admin());
