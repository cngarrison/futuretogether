-- ============================================================
-- Migration: 20260612000011_rls_comms
-- Purpose:   RLS policies for email_sends and email_consents.
-- Ref:       supabase/RLS_PATTERNS.md
-- Both tables are append-only audit logs.
-- No UPDATE or DELETE policies on either table.
-- ============================================================

-- ------------------------------------------------------------
-- email_sends
-- Senders can read their own send history.
-- Group admins can read email history for their groups.
-- Group admins can send (INSERT) emails scoped to their group.
-- Site admins: full access.
-- ------------------------------------------------------------

-- Senders can see their own outbound email log.
CREATE POLICY "own_sends_read"
  ON public.email_sends FOR SELECT
  USING (sent_by_id = (SELECT auth.uid()));

-- Group admins can read the send history for their group.
CREATE POLICY "group_admin_read"
  ON public.email_sends FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_memberships gm
      WHERE gm.group_id = email_sends.group_id
        AND gm.profile_id = (SELECT auth.uid())
        AND gm.role IN ('group_admin', 'group_owner')
        AND gm.status = 'active'
    )
  );

-- Group admins can send emails for their group.
-- Enforces sent_by_id = caller to prevent spoofing.
CREATE POLICY "group_admin_insert"
  ON public.email_sends FOR INSERT
  WITH CHECK (
    sent_by_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.group_memberships gm
      WHERE gm.group_id = email_sends.group_id
        AND gm.profile_id = (SELECT auth.uid())
        AND gm.role IN ('group_admin', 'group_owner')
        AND gm.status = 'active'
    )
  );

-- Site admins: full access (including FT-wide newsletter sends where group_id IS NULL).
CREATE POLICY "site_admin_all"
  ON public.email_sends FOR ALL
  USING (public.is_site_admin());

-- ------------------------------------------------------------
-- email_consents
-- GDPR append-only audit. Records are never modified or deleted.
-- Users can read and insert their own consent records.
-- Site admins: full access for compliance queries.
-- ------------------------------------------------------------

-- Users can read their own consent history.
CREATE POLICY "own_consents_read"
  ON public.email_consents FOR SELECT
  USING (profile_id = (SELECT auth.uid()));

-- Users can record their own consent events.
-- Enforces profile_id = caller to prevent spoofing consent for others.
CREATE POLICY "own_consents_insert"
  ON public.email_consents FOR INSERT
  WITH CHECK (profile_id = (SELECT auth.uid()));

-- Site admins: full access (compliance queries, imported member consent logging).
CREATE POLICY "site_admin_all"
  ON public.email_consents FOR ALL
  USING (public.is_site_admin());
