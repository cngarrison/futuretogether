-- ============================================================
-- Migration: 20260612000012_seed_global_group
-- Purpose:   Seed the Global group (ft-global) and register
--            its UUID in the settings table so the
--            handle_new_auth_user trigger can auto-enrol
--            new users as members.
-- Run order: After all schema + RLS migrations (001–011).
-- Note:      CNG's auth.users record must be created via the
--            Supabase console or scripts/onboard-site-owner.ts
--            before the user_platform_roles and group_memberships
--            rows below can be applied.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Global group
-- The only group with parent_group_id = NULL.
-- Visibility 'unlisted' — hidden from /groups browse.
-- Uses gen_random_uuid() so the UUID is environment-specific;
-- the UUID is captured into settings immediately after INSERT.
-- ------------------------------------------------------------
DO $$
DECLARE
  v_global_group_id uuid;
BEGIN
  INSERT INTO public.groups (
    slug, name, group_type, tier,
    parent_group_id, visibility, status
  )
  VALUES (
    'ft-global',
    'Future Together Global',
    'global', 'global',
    NULL,
    'unlisted',
    'active'
  )
  ON CONFLICT (slug) DO NOTHING;

  -- Capture the UUID (works whether just inserted or already existed)
  SELECT id INTO v_global_group_id
  FROM public.groups
  WHERE slug = 'ft-global';

  -- Register in settings so handle_new_auth_user trigger can use it
  PERFORM public.set_setting(
    'global_group_id',
    v_global_group_id::text,
    'UUID of the Global group (ft-global). Used by handle_new_auth_user trigger to auto-enrol new users.'
  );

  -- ------------------------------------------------------------
  -- 1b. Populate content fields on the Global group
  -- ------------------------------------------------------------
  UPDATE public.groups SET
    tagline       = 'The future is arriving. Let''s face it together.',
    description   = 'A global community of people paying attention to AI-driven change — and doing something about it. You don''t have to figure this out alone.',
    location_name = 'Global / Online'
  WHERE id = v_global_group_id;

  -- ------------------------------------------------------------
  -- 1c. Seed the 'Discuss Our Future' recurring programme
  -- The Global group''s flagship monthly online meetup.
  -- Third Wednesday of each month; time alternates for time zones.
  -- ------------------------------------------------------------
  INSERT INTO public.group_programs (
    slug, slug_suffix, sequence, group_id, title, description,
    program_type, recurrence_rule, seed_datetime, seed_timezone,
    location_type, location_name,
    duration_minutes, slideshow_url,
    visibility, status
  )
  VALUES (
    'discuss-our-future',
    'morning',
    1,
    v_global_group_id,
    'Discuss Our Future: Preparing for AI''s Impact',
    'Every month, a group of people gather online to talk honestly about what AI is doing to society — and what we can do about it. Not the hype. Not the doom. The structural changes unfolding right now: in how we work, how we access food, how our communities hold together. The timeline has accelerated — we''re talking one to three years, not some distant future. This isn''t about whether you personally use AI. It''s about the broader shifts already affecting all of us. No product pitch. No agenda. Just people figuring this out together.',
    'recurring',
    'FREQ=MONTHLY;BYDAY=3WE;INTERVAL=2', 
    '2026-07-15T10:00:00', 
    'Australia/Sydney',
    'online',
    'Online via Jitsi',
    60,
    'https://futuretogether.community/slideshow/discuss-our-future-slideshow-conversation.html',
    'public',
    'published'
  )
  ON CONFLICT (group_id, slug, sequence) DO NOTHING;

  INSERT INTO public.group_programs (
    slug, slug_suffix, sequence, group_id, title, description,
    program_type, recurrence_rule, seed_datetime, seed_timezone,
    location_type, location_name,
    duration_minutes, slideshow_url,
    visibility, status
  )
  VALUES (
    'discuss-our-future',
    'evening',
    2,
    v_global_group_id,
    'Discuss Our Future: Preparing for AI''s Impact',
    'Every month, a group of people gather online to talk honestly about what AI is doing to society — and what we can do about it. Not the hype. Not the doom. The structural changes unfolding right now: in how we work, how we access food, how our communities hold together. The timeline has accelerated — we''re talking one to three years, not some distant future. This isn''t about whether you personally use AI. It''s about the broader shifts already affecting all of us. No product pitch. No agenda. Just people figuring this out together.',
    'recurring',
    'FREQ=MONTHLY;BYDAY=3WE;INTERVAL=2', 
    '2026-08-19T18:00:00', 
    'Australia/Sydney',
    'online',
    'Online via Jitsi',
    60,
    'https://futuretogether.community/slideshow/discuss-our-future-slideshow-conversation.html',
    'public',
    'published'
  )
  ON CONFLICT (group_id, slug, sequence) DO NOTHING;

END;
$$;

-- ------------------------------------------------------------
-- 2. CNG as site_owner and Global group owner
-- Requires CNG's auth.users record to already exist.
-- Run scripts/onboard-site-owner.ts first to create the auth
-- user, then apply the SQL below (the script handles this).
-- Placeholder UUIDs below are replaced by the onboarding script.
-- This block is intentionally left as a comment template;
-- the onboarding script executes these inserts directly.
-- ------------------------------------------------------------
-- See: scripts/onboard-site-owner.ts
