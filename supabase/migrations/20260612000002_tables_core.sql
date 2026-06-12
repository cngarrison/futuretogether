-- ============================================================
-- Migration: 20260612000002_tables_core
-- Purpose:   Core entity tables and auth trigger.
-- Tables:    settings, blog_series, profiles, user_platform_roles, groups
-- Dependency order within this file:
--   0. settings          — no FK dependencies; must exist before handle_new_auth_user
--   1. blog_series       — no FK dependencies
--   2. profiles             — references auth.users (pre-existing)
--   3. auth trigger      — fires on auth.users INSERT → inserts into profiles
--   4. user_platform_roles — references profiles
--   5. groups            — references profiles (approved_by_id);
--                          self-ref parent_group_id added via ALTER after CREATE
-- ============================================================

-- ------------------------------------------------------------
-- settings
-- Key-value store for platform configuration.
-- Access via get_setting() / set_setting() functions only.
-- Raw table is service-role-only; functions are SECURITY DEFINER.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
  key         text PRIMARY KEY,
  value       text NOT NULL,
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- No GRANT to anon/authenticated — access via functions only.
-- Service role has full access by default.
GRANT ALL ON TABLE public.settings             TO service_role;

-- RLS policy: deny all direct access (access goes via SECURITY DEFINER functions)
CREATE POLICY "settings_no_direct_access"
  ON public.settings
  FOR ALL
  USING (false);

-- get_setting: read a value by key. Returns NULL if not found.
CREATE OR REPLACE FUNCTION public.get_setting(p_key text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM public.settings WHERE key = p_key;
$$;

-- set_setting: upsert a key-value pair.
CREATE OR REPLACE FUNCTION public.set_setting(
  p_key         text,
  p_value       text,
  p_description text DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.settings (key, value, description)
  VALUES (p_key, p_value, p_description)
  ON CONFLICT (key) DO UPDATE
    SET value       = EXCLUDED.value,
        description = COALESCE(EXCLUDED.description, public.settings.description),
        updated_at  = now();
$$;

-- ------------------------------------------------------------
-- blog_series
-- Created before blog_articles (which has a FK to it).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blog_series (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  title       text NOT NULL,
  description text,
  part_count  integer
);

ALTER TABLE public.blog_series ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.blog_series TO anon;
GRANT SELECT ON TABLE public.blog_series TO authenticated;
GRANT ALL ON TABLE public.blog_series          TO service_role;
-- INSERT/UPDATE/DELETE: service role only (via site admin operations)

-- ------------------------------------------------------------
-- profiles
-- Public mirror of auth.users. Populated automatically via
-- the handle_new_auth_user() trigger defined below.
-- Application code should NOT insert directly; use Supabase Auth.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text NOT NULL UNIQUE,
  name_first      text,
  name_last       text,
  age_confirmed   boolean NOT NULL DEFAULT false,  -- 16+ GDPR confirmation at signup

  -- Member join page: profile enrichment fields.
  -- Populated by the auth trigger from raw_user_meta_data on signup.
  -- `location` is free-text ("City or region" on the join form); not geocoded.
  -- Structured location_* fields and lat/lng can be added in Phase C/D when
  -- geocoding and proximity search are needed.
  location          text,                           -- free-text 'City or region'
  heard_from        text,                           -- acquisition source (how they found FT)
  interests         text[],                         -- topics of interest (multi-select)
  wants_to_organise boolean NOT NULL DEFAULT false, -- wants to start a local group
  has_password      boolean NOT NULL DEFAULT false, -- true once user explicitly sets a password via /account/

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_interests ON public.profiles USING GIN (interests);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles             TO service_role;
-- INSERT: handled exclusively by the auth trigger below.
-- DELETE: cascades from auth.users deletion (ON DELETE CASCADE on PK).

-- ------------------------------------------------------------
-- Auth trigger: mirror auth.users → public.profiles on signup.
--
-- Fires AFTER INSERT on auth.users (managed by Supabase).
-- Extracts from the new auth.users row (NEW):
--   NEW.id                   → profiles.id
--   NEW.email                → profiles.email
--   NEW.raw_user_meta_data   → name_first, name_last (from metadata keys)
--                            → age_confirmed (boolean)
--                            → location (free-text city/region)
--                            → heard_from (acquisition source)
--                            → interests (jsonb array → text[])
--                            → wants_to_organise (boolean)
--   NEW.raw_app_meta_data    → provider info; not stored in profiles (reserved for future use)
--
-- SECURITY DEFINER: runs with the function owner's privileges so it
-- can INSERT into public.profiles even though the trigger fires in the
-- auth schema context.
-- Fixed search_path: prevents search-path hijack attacks.
-- ON CONFLICT DO NOTHING: safe to replay if migration re-runs.
--
-- Global group auto-enrolment:
-- After inserting into profiles, the function also inserts a group_memberships
-- row for the Global group (ft-global). The global_group_id setting must be
-- seeded by 20260612000012_seed_global_group.sql before this runs.
-- Guards: undefined_table exception caught if group_memberships doesn't exist yet.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_global_group_id        uuid;
  v_secondary_group_id     uuid;
  v_secondary_validated_id uuid;
BEGIN
  INSERT INTO public.profiles (
    id, email, name_first, name_last, age_confirmed,
    location, heard_from, interests, wants_to_organise,
    has_password
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name_first',
    NEW.raw_user_meta_data->>'name_last',
    COALESCE(
      (NEW.raw_user_meta_data->>'age_confirmed')::boolean,
      false
    ),
    NEW.raw_user_meta_data->>'location',
    NEW.raw_user_meta_data->>'heard_from',
    ARRAY(
      SELECT jsonb_array_elements_text(
        COALESCE(NEW.raw_user_meta_data->'interests', '[]'::jsonb)
      )
    ),
    COALESCE(
      (NEW.raw_user_meta_data->>'wants_to_organise')::boolean,
      false
    ),
    COALESCE(
      (NEW.raw_user_meta_data->>'has_password')::boolean,
      false
    )
  )
  ON CONFLICT (id) DO NOTHING;

  -- Add new user to the Global group (ft-global) automatically.
  -- Guard: only runs if global_group_id setting has been seeded.
  -- group_memberships table is created in a later migration; this
  -- reference resolves at runtime, not at migration parse time.
  BEGIN
    v_global_group_id := public.get_setting('global_group_id')::uuid;
    IF v_global_group_id IS NOT NULL THEN
      INSERT INTO public.group_memberships (
        group_id, profile_id, role, status, email_opt_in, source
      )
      VALUES (
        v_global_group_id,
        NEW.id,
        'member',
        'active',
        true,
        'self-joined'
      )
      ON CONFLICT (group_id, profile_id) DO NOTHING;
    END IF;
  EXCEPTION WHEN undefined_table THEN
    -- group_memberships not yet created (migration ordering); skip safely.
    NULL;
  END;

  -- Optional secondary group auto-enrolment.
  --
  -- When a new user signs up via /join?group_id=<uuid> (e.g. from a group page),
  -- the group UUID is stored in raw_user_meta_data so the trigger can join them
  -- automatically without requiring a second round-trip after email confirmation.
  --
  -- Security: the group must be status='active' AND visibility='public'.
  --   - Excludes archived/suspended groups (status check)
  --   - Excludes private groups and the global group which is 'unlisted' (visibility check)
  --   - Role is always 'member' — no privilege escalation possible
  --   - Invalid UUID format is caught and silently skipped
  --
  -- Guard: silently skipped if group_id is absent, malformed, or fails validation.
  BEGIN
    v_secondary_group_id := (NEW.raw_user_meta_data->>'group_id')::uuid;

    IF v_secondary_group_id IS NOT NULL THEN
      SELECT id INTO v_secondary_validated_id
      FROM public.groups
      WHERE id         = v_secondary_group_id
        AND status     = 'active'
        AND visibility = 'public';

      IF FOUND THEN
        INSERT INTO public.group_memberships (
          group_id, profile_id, role, status, email_opt_in, source
        )
        VALUES (
          v_secondary_validated_id,
          NEW.id,
          'member',
          'active',
          true,
          'self-joined'
        )
        ON CONFLICT (group_id, profile_id) DO NOTHING;
      END IF;
    END IF;
  EXCEPTION
    WHEN invalid_text_representation THEN
      -- group_id in metadata was not a valid UUID; skip silently.
      NULL;
    WHEN undefined_table THEN
      -- group_memberships not yet created (migration ordering); skip safely.
      NULL;
  END;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ------------------------------------------------------------
-- user_platform_roles
-- Platform-level roles: site_owner and site_admin.
-- Separate table so a user can hold multiple platform roles,
-- and so the role list can be extended without schema changes.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_platform_roles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role          text NOT NULL CHECK (role IN ('site_owner', 'site_admin')),
  granted_at    timestamptz NOT NULL DEFAULT now(),
  granted_by_id uuid REFERENCES public.profiles(id),
  UNIQUE (profile_id, role)
);

-- Postgres does NOT auto-create indexes for FK columns.
CREATE INDEX IF NOT EXISTS idx_user_platform_roles_profile_id
  ON public.user_platform_roles (profile_id);
CREATE INDEX IF NOT EXISTS idx_user_platform_roles_granted_by_id
  ON public.user_platform_roles (granted_by_id);

ALTER TABLE public.user_platform_roles ENABLE ROW LEVEL SECURITY;

-- Use SECURITY DEFINER helper function instead of anon GRANT
---GRANT SELECT ON TABLE public.user_platform_roles TO anon;
GRANT SELECT ON TABLE public.user_platform_roles TO authenticated;
GRANT ALL    ON TABLE public.user_platform_roles TO service_role;
-- INSERT/UPDATE/DELETE: service role only

-- ------------------------------------------------------------
-- groups
-- approved_by_id references profiles (must exist first).
-- parent_group_id is self-referential: added via ALTER TABLE
-- after CREATE to avoid a forward-reference error.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.groups (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text UNIQUE NOT NULL,
  name                text NOT NULL,
  tagline             text,
  description         text,
  group_type          text NOT NULL
                        CHECK (group_type IN ('geographic', 'non-geographic', 'global')),

  -- Geographic fields (null for non-geographic/global groups)
  location_name       text,           -- e.g. 'Tumbarumba, NSW, Australia'
  location_suburb     text,
  location_region     text,           -- e.g. 'Snowy Mountains'
  location_state      text,           -- e.g. 'NSW'
  location_country    text,           -- e.g. 'Australia'
  lat                 numeric(9,6),
  lng                 numeric(9,6),

  -- Hierarchy: all groups except the Global group have a parent.
  -- FK added below after table creation (self-referential).
  parent_group_id     uuid,
  tier                text CHECK (tier IN ('local','regional','state','national','global','thematic')),

  -- Non-geographic metadata
  website_url         text,

  -- Assets (Supabase Storage paths)
  cover_image_path    text,
  tags                text[],

  -- Status & visibility
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','active','archived','suspended')),
  visibility          text NOT NULL DEFAULT 'public'
                        CHECK (visibility IN ('public','unlisted','private')),

  -- Application answers submitted via /groups/start.
  -- applicant_id is the logged-in user who submitted the form.
  -- why/how are stored directly; name/email are resolved via the profiles FK.
  -- Note: intentionally on the groups table (not a separate applications table)
  -- to keep Phase A simple. Phase B may extract to pending_applications if needed.
  applicant_id    uuid REFERENCES public.profiles(id),  -- who submitted the form
  applicant_why   text,    -- "Why do you want to start this group?"
  applicant_how   text,    -- "How do you plan to grow and run it?"

  -- Lifecycle
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  approved_at         timestamptz,
  approved_by_id      uuid REFERENCES public.profiles(id),
  archived_at         timestamptz,
  last_activity_at    timestamptz
);

-- Add self-referential FK after table creation.
ALTER TABLE public.groups
  ADD CONSTRAINT groups_parent_group_id_fkey
  FOREIGN KEY (parent_group_id) REFERENCES public.groups(id);

-- FK and common query indexes.
CREATE INDEX IF NOT EXISTS idx_groups_parent_group_id
  ON public.groups (parent_group_id);
CREATE INDEX IF NOT EXISTS idx_groups_approved_by_id
  ON public.groups (approved_by_id);
-- Status + visibility are the primary filter on /groups browse.
CREATE INDEX IF NOT EXISTS idx_groups_status_visibility
  ON public.groups (status, visibility);
CREATE INDEX IF NOT EXISTS idx_groups_slug
  ON public.groups (slug);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.groups TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.groups TO authenticated;
-- DELETE is admin-only via service role; groups are archived, never hard-deleted.
GRANT ALL ON TABLE public.groups               TO service_role;
