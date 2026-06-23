-- ============================================================
-- Migration: 20260623000001_rls_invited_join
-- Purpose:   Add RLS policy allowing authenticated users to
--            insert their own group_memberships row when joining
--            via an invite token (source = 'invited').
--
-- Background:
--   The existing authenticated_self_join policy only permits
--   source = 'self-joined'. The invite flow (joinGroup called
--   from /groups/[slug]/join?token=...) inserts with source =
--   'invited', which was blocked.
--
--   Security rationale for using RLS (not admin client):
--   * profile_id = auth.uid() — user can only join as themselves
--   * role = 'member'         — no privilege escalation
--   * status = 'active'       — standard active membership
--   * source = 'invited'      — correctly identifies the join path
--   The invite token itself is validated and consumed at the
--   application layer (redeemInviteToken) before joinGroup is
--   called, so the token-gating is enforced before this INSERT.
-- ============================================================

CREATE POLICY "authenticated_invited_join"
  ON public.group_memberships FOR INSERT
  WITH CHECK (
    profile_id = (SELECT auth.uid())
    AND source = 'invited'
    AND role = 'member'
    AND status = 'active'
  );
