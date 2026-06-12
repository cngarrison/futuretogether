-- ============================================================
-- Migration: 20260612000001_schema_baseline
-- Purpose:   Baseline privilege lockdown for the public schema.
--            Revokes default public access; re-grants USAGE so
--            roles can access tables when explicitly granted.
--            Per-table GRANTs are applied in each table migration.
-- Must run: BEFORE any table migrations.
-- ============================================================

-- Revoke all default public access.
-- Without this, any unauthenticated request can attempt to call
-- functions in public — even if RLS is enabled on all tables.
REVOKE ALL ON SCHEMA public FROM anon;
REVOKE ALL ON SCHEMA public FROM authenticated;

-- Grant schema USAGE so roles can reference objects within public.
-- This is required for any subsequent per-table SELECT/INSERT grants.
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Sequences: service_role needs USAGE to insert into tables with generated PKs
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================================
-- Shared utility: auto-update updated_at on row modification.
-- Referenced by BEFORE UPDATE triggers on tables with updated_at.
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
