-- ============================================================
-- Migration: 20260624000001_profiles_metadata
-- Purpose:   Add metadata JSONB column to profiles.
--            Update auth trigger to populate metadata.source_form
--            from raw_user_meta_data on user creation.
--
-- source_form values:
--   'join-form'    — /join page (magic-link OTP flow)
--   'signup-form'  — /signup page (password flow)
--   'unknown'      — legacy / OAuth / other provider
-- ============================================================

-- 1. Add metadata column.
--    Stores arbitrary tracking/provenance data as JSONB.
--    NOT NULL with empty-object default so existing rows are valid immediately.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Update handle_new_auth_user to populate metadata.
--    Full function body required — CREATE OR REPLACE replaces the whole function.
--    All other behaviour is unchanged from 20260612000002_tables_core.
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
    has_password, metadata
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
    ),
    jsonb_build_object(
      'source_form',
      COALESCE(NEW.raw_user_meta_data->>'source_form', 'unknown')
    )
  )
  ON CONFLICT (id) DO NOTHING;

  -- Add new user to the Global group (ft-global) automatically.
  -- Guard: only runs if global_group_id setting has been seeded.
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
    NULL;
  END;

  -- Optional secondary group auto-enrolment.
  -- When a user signs up via /join?group_id=<uuid>, the group UUID is stored
  -- in raw_user_meta_data so the trigger can auto-join them without a second
  -- round-trip after email confirmation.
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
      NULL;
    WHEN undefined_table THEN
      NULL;
  END;

  RETURN NEW;
END;
$$;
