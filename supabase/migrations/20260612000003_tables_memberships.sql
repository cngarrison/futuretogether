-- ============================================================
-- Migration: 20260612000003_tables_memberships
-- Purpose:   group_memberships table.
-- Dependencies: groups (20260612000002), profiles (20260612000002)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.group_memberships (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id            uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  profile_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role                text NOT NULL DEFAULT 'member'
                        CHECK (role IN ('group_owner','group_admin','member')),
  -- 'departed' = user-initiated soft-delete; row kept for audit / possible rejoin
  status              text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','pending','banned','departed')),
  email_opt_in        boolean NOT NULL DEFAULT true,
  source              text CHECK (source IN ('self-joined','invited','imported','admin-added')),
  joined_at           timestamptz NOT NULL DEFAULT now(),
  departed_at         timestamptz,            -- set when status transitions to 'departed'
  invited_by_id       uuid REFERENCES public.profiles(id),
  -- GDPR consent is recorded in email_consents table (not here).
  UNIQUE (group_id, profile_id)
);

-- FK indexes (not auto-created by Postgres).
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id
  ON public.group_memberships (group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_profile_id
  ON public.group_memberships (profile_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_invited_by_id
  ON public.group_memberships (invited_by_id);
-- Partial index: departed memberships — used for audit and possible-rejoin queries.
CREATE INDEX IF NOT EXISTS idx_group_memberships_departed
  ON public.group_memberships (group_id, profile_id)
  WHERE status = 'departed';
-- Partial index: active memberships are the overwhelming majority of lookups.
CREATE INDEX IF NOT EXISTS idx_group_memberships_active
  ON public.group_memberships (group_id, profile_id)
  WHERE status = 'active';
-- Used by RLS policies checking admin role for a given group.
CREATE INDEX IF NOT EXISTS idx_group_memberships_admin_lookup
  ON public.group_memberships (profile_id, group_id, role)
  WHERE status = 'active' AND role IN ('group_admin', 'group_owner');

ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.group_memberships TO authenticated;
GRANT ALL ON TABLE public.group_memberships    TO service_role;
