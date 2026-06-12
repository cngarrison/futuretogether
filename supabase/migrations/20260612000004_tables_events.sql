-- ============================================================
-- Migration: 20260612000004_tables_events
-- Purpose:   programs, group_events, event_registrations, event_reminder_logs
-- Dependencies: groups (002), profiles (002)
-- Notes:
--   programs: one record per event programme (title, description, location, defaults).
--   group_events instances link to a program via program_id.
--   Location fields on group_programs are the primary values; group_events can override per-event.
--   default_* fields (timing/capacity) are genuine fallbacks when event instance fields are null.
--   event_registrations.profile_id is nullable for guest registrations.
--   event_reminder_logs is append-only; no updates.
-- ============================================================

-- ------------------------------------------------------------
-- programs
-- Template/programme record for a recurring or one-off event type.
-- group_events instances reference programs via program_id.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_programs (
  id                                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                                text NOT NULL,
  group_id                            uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title                               text NOT NULL,
  description                         text,
  program_type                        text NOT NULL DEFAULT 'one-off'
                                        CHECK (program_type IN ('one-off','recurring')),
  recurrence_rule                     text,             -- iCal RRULE e.g. 'FREQ=MONTHLY;BYDAY=3TU'
  seed_datetime                       timestamp,        -- naive local RRULE anchor (required for recurring)
  seed_timezone                       text,             -- IANA tz for seed + instance generation
  sequence                            smallint NOT NULL DEFAULT 1, -- distinguishes programs within a multi-sequence series
  slug_suffix                         text,             -- optional; appended to generated event slugs e.g. 'morning', 'pm'

  -- Location (program-level value; individual events can override per-event)
  location_type       text CHECK (location_type IN ('physical','online','hybrid')),
  location_name       text,
  location_address    text,
  meeting_link        text,

  -- Timing/capacity (program-level values; individual events override by setting the same field)
  duration_minutes            integer,
  capacity                    integer,
  is_registration_required    boolean NOT NULL DEFAULT true,
  registration_deadline_days  integer,

  -- Organiser (a FT profile; event-level organiser_id falls back to this when null)
  organiser_id                        uuid REFERENCES public.profiles(id),

  -- Presenters & assets
  presented_by                        text,
  sponsored_by                        text,
  poster_image_path                   text,
  slideshow_url                       text,
  more_info_path                      text,     -- full relative path, e.g. data/events/more-info/foo.md
  topics                              text[],
  resources                           jsonb NOT NULL DEFAULT '[]',

  -- Visibility & status
  visibility                          text NOT NULL DEFAULT 'public'
                                        CHECK (visibility IN ('public','unlisted','private')),
  status                              text NOT NULL DEFAULT 'draft'
                                        CHECK (status IN ('draft','published','archived')),

  created_by_id                       uuid REFERENCES public.profiles(id),
  created_at                          timestamptz NOT NULL DEFAULT now(),
  updated_at                          timestamptz NOT NULL DEFAULT now(),

  UNIQUE (group_id, slug, sequence)
);

CREATE INDEX IF NOT EXISTS idx_group_programs_slug
  ON public.group_programs (slug);
CREATE INDEX IF NOT EXISTS idx_group_programs_group_id
  ON public.group_programs (group_id);
CREATE INDEX IF NOT EXISTS idx_group_programs_status_visibility
  ON public.group_programs (status, visibility);
CREATE INDEX IF NOT EXISTS idx_group_programs_group_slug
  ON public.group_programs (group_id, slug);
CREATE INDEX IF NOT EXISTS idx_group_programs_organiser_id
  ON public.group_programs (organiser_id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.group_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.group_programs
  ADD CONSTRAINT chk_recurring_seed_fields
  CHECK (program_type = 'one-off' OR (seed_datetime IS NOT NULL AND seed_timezone IS NOT NULL));

ALTER TABLE public.group_programs ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.group_programs TO anon;
GRANT ALL    ON TABLE public.group_programs TO authenticated;
GRANT ALL    ON TABLE public.group_programs TO service_role;

-- NOTE: programs_anon_select and programs_authenticated_select have been moved to
-- 20260612000009_rls_events.sql where all group_programs RLS now lives cohesively.

-- ------------------------------------------------------------
-- group_events
-- Individual event instances linked to a programs record.
-- Nullable timing/location/capacity fields fall back to program defaults.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_events (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                        text NOT NULL,
  group_id                    uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  program_id                  uuid NOT NULL REFERENCES public.group_programs(id),

  event_date                  timestamp,
  timezone                    text NOT NULL DEFAULT 'Australia/Sydney',

  -- DEPRECATED: Title override (nullable — falls back to program.title when null)
  title                       text,

  -- Location
  location_type               text CHECK (location_type IN ('physical','online','hybrid')),
  location_name               text,
  location_address            text,
  meeting_link                text,

  -- Registration/Timing (nullable — falls back to program defaults when null)
  duration_minutes            integer,
  capacity                    integer,
  is_registration_required    boolean,
  registration_deadline_days  integer,

  -- Organiser (a FT profile; usually group admin but can be delegated)
  organiser_id                uuid REFERENCES public.profiles(id),
  -- Track organiser event reminders on group_events.
  -- Timestamptz columns: null = not sent; value = when sent.
  organiser_reminded_day_before  timestamptz,
  organiser_reminded_hour_before timestamptz,

  -- Content overrides (nullable — falls back to program fields when null)
  -- Resolution: COALESCE(group_events.field, group_programs.field)
  presented_by                text,
  sponsored_by                text,
  poster_image_path           text,
  slideshow_url               text,
  more_info_path              text,     -- full relative path, e.g. data/events/more-info/foo.md
  topics                      text[],
  resources                   jsonb,

  -- Visibility & status
  visibility                  text NOT NULL DEFAULT 'public'
                                CHECK (visibility IN ('public','unlisted','private','featured')),
  status                      text NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft','published','cancelled','completed')),

  -- Metadata
  created_by_id               uuid REFERENCES public.profiles(id),
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (group_id, slug)
);

-- FK indexes.
CREATE INDEX IF NOT EXISTS idx_group_events_group_id
  ON public.group_events (group_id);
CREATE INDEX IF NOT EXISTS idx_group_events_program_id
  ON public.group_events (program_id);
CREATE INDEX IF NOT EXISTS idx_group_events_organiser_id
  ON public.group_events (organiser_id);
CREATE INDEX IF NOT EXISTS idx_group_events_created_by_id
  ON public.group_events (created_by_id);
-- Common query: upcoming published events ordered by date.
CREATE INDEX IF NOT EXISTS idx_group_events_published_date
  ON public.group_events (event_date ASC)
  WHERE status = 'published';
-- Public/featured events without group membership check.
CREATE INDEX IF NOT EXISTS idx_group_events_public_featured
  ON public.group_events (event_date ASC)
  WHERE status = 'published' AND visibility IN ('public', 'unlisted');
CREATE INDEX IF NOT EXISTS idx_group_events_featured
  ON public.group_events (event_date ASC)
  WHERE status = 'published' AND visibility = 'featured';

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.group_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.group_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.group_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.group_events TO authenticated;
GRANT ALL ON TABLE public.group_events         TO service_role;

-- ------------------------------------------------------------
-- event_registrations
-- profile_id is nullable to support guest (unauthenticated) registrations.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES public.group_events(id) ON DELETE CASCADE,
  profile_id      uuid REFERENCES public.profiles(id),  -- null = guest registration
  email           text NOT NULL,
  name_first      text,
  name_last       text,
  status          text NOT NULL DEFAULT 'registered'
                    CHECK (status IN ('registered','cancelled','attended')),
  source          text NOT NULL DEFAULT 'web'
                    CHECK (source IN ('web','admin-added')),
  interests       text,           -- engagement: topics the attendee selected
  heard_from      text,           -- engagement: how they found Future Together
  registered_at   timestamptz NOT NULL DEFAULT now(),
  cancelled_at    timestamptz
);

-- FK indexes.
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id
  ON public.event_registrations (event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_profile_id
  ON public.event_registrations (profile_id);
-- Partial index: active (non-cancelled) registrations per event.
CREATE INDEX IF NOT EXISTS idx_event_registrations_active
  ON public.event_registrations (event_id)
  WHERE status = 'registered';

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON TABLE public.event_registrations TO authenticated;
-- Unauthenticated (anon) INSERT for guest registrations (profile_id = NULL).
GRANT INSERT ON TABLE public.event_registrations TO anon;
GRANT ALL ON TABLE public.event_registrations  TO service_role;

-- ------------------------------------------------------------
-- event_reminder_logs
-- Append-only audit of sent reminders. No UPDATE or DELETE.
-- Supports multiple reminder types per registration (1-day, 1-hour, etc.).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_reminder_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id     uuid NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  reminder_type       text NOT NULL,  -- '1-day' | '1-hour' | 'custom'
  sent_at             timestamptz NOT NULL DEFAULT now(),
  resend_message_id   text            -- Resend API message ID for delivery tracking
);

CREATE INDEX IF NOT EXISTS idx_event_reminder_logs_registration_id
  ON public.event_reminder_logs (registration_id);

ALTER TABLE public.event_reminder_logs ENABLE ROW LEVEL SECURITY;

-- Append-only: INSERT is service-role only (automated reminder system).
-- Authenticated SELECT granted; policies restrict to admins — see RLS migration.
GRANT SELECT ON TABLE public.event_reminder_logs TO authenticated;
GRANT ALL ON TABLE public.event_reminder_logs  TO service_role;

-- ------------------------------------------------------------
-- get_next_available_event_id(p_program_slug)
--
-- Returns the group_events.slug (= EventConfig.id, date-suffixed) of
-- the next available event for a given program canonical slug.
--
-- "Available" means:
--   • ge.status = 'published'
--   • registration deadline has not passed
--       (ge.event_date - deadline_days > now())
--   • capacity not reached
--       (active registration count < capacity)
--
-- Used by site/utils/events.ts getNextAvailableEvent().
-- Replaces the previous Deno KV NEXT_EVENT_KEY pointer approach.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_next_available_event_id(p_program_slug text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ge.id
  FROM   public.group_events   ge
  JOIN   public.group_programs gp ON ge.program_id = gp.id
  WHERE  gp.slug = p_program_slug
    AND  ge.status = 'published'
    AND  (ge.event_date AT TIME ZONE ge.timezone)
           - COALESCE(
               ge.registration_deadline_days,
               gp.registration_deadline_days,
               1
             ) * INTERVAL '1 day'
         > now()
    AND  (
           SELECT COUNT(*)
           FROM   public.event_registrations er
           WHERE  er.event_id = ge.id
             AND  er.status   = 'registered'
         ) < COALESCE(ge.capacity, gp.capacity, 30)
  ORDER  BY ge.event_date ASC
  LIMIT  1
$$;

GRANT EXECUTE ON FUNCTION public.get_next_available_event_id(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_next_available_event_id(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_available_event_id(text) TO service_role;
