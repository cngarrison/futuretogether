-- ============================================================
-- Migration: 20260612000006_tables_comms
-- Purpose:   Communication and compliance audit tables.
-- Tables:    email_sends, email_consents
-- Dependencies: groups (002), profiles (002)
-- Both tables are append-only audit logs: no UPDATE or DELETE.
-- ============================================================

-- ------------------------------------------------------------
-- email_sends
-- Log of every group email sent via the platform.
-- Append-only: never update or delete a send record.
-- group_id is nullable to support FT-wide newsletter sends
-- (which aren't scoped to a single group).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_sends (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id            uuid REFERENCES public.groups(id),  -- null = FT-wide newsletter
  sent_by_id          uuid NOT NULL REFERENCES public.profiles(id),
  subject             text NOT NULL,
  body_markdown       text NOT NULL,
  resend_batch_id     text,     -- Resend API batch ID for delivery tracking
  recipient_count     integer,
  sent_count          integer,   -- confirmed delivered (Resend)
  failed_count        integer,   -- delivery failures
  recipient_emails    text[],    -- snapshot of who received it
  sent_at             timestamptz NOT NULL DEFAULT now()
);

-- FK indexes.
CREATE INDEX IF NOT EXISTS idx_email_sends_group_id
  ON public.email_sends (group_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_sent_by_id
  ON public.email_sends (sent_by_id);

ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON TABLE public.email_sends TO authenticated;
-- No UPDATE or DELETE grants; records are immutable once written.
GRANT ALL ON TABLE public.email_sends          TO service_role;

-- ------------------------------------------------------------
-- email_consents
-- GDPR compliance audit trail for all email consent events.
-- Append-only: records are never modified or deleted.
-- Captures both opt-in (granted=true) and opt-out (granted=false) events.
-- group_id nullable: consent_type='ft_newsletter' applies to Global group.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_consents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid NOT NULL REFERENCES public.profiles(id),
  consent_type    text NOT NULL
                    CHECK (consent_type IN ('group_email','ft_newsletter')),
  group_id        uuid REFERENCES public.groups(id),
  granted         boolean NOT NULL,  -- true = opt-in, false = opt-out
  consented_at    timestamptz NOT NULL DEFAULT now(),
  ip_address      text,
  -- Where the consent event originated:
  source          text CHECK (source IN
                    ('signup','join-group','imported','admin-added','unsubscribe'))
);

-- FK indexes.
CREATE INDEX IF NOT EXISTS idx_email_consents_profile_id
  ON public.email_consents (profile_id);
CREATE INDEX IF NOT EXISTS idx_email_consents_group_id
  ON public.email_consents (group_id);

ALTER TABLE public.email_consents ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON TABLE public.email_consents TO authenticated;
-- No UPDATE or DELETE grants; records are immutable once written.
GRANT ALL ON TABLE public.email_consents       TO service_role;
