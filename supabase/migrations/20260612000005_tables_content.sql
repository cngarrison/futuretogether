-- ============================================================
-- Migration: 20260612000005_tables_content
-- Purpose:   Content metadata tables.
-- Tables:    blog_articles, site_resources, event_slideshows
-- Dependencies:
--   blog_series    (created in 20260612000002_tables_core)
--   group_events   (created in 20260612000004_tables_events)
-- Note: All content files (markdown, .tsx) stay in git.
--       These tables store metadata only.
-- ============================================================

-- ------------------------------------------------------------
-- blog_articles
-- Metadata for blog posts. Markdown content lives in git under site/data/blog/.
-- Route reads metadata from DB and content from filesystem.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blog_articles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  title           text NOT NULL,
  author          text,
  excerpt         text,
  series_id       uuid REFERENCES public.blog_series(id),
  series_part     integer,
  published_at    timestamptz,
  status          text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','published')),
  file_path       text,
  tags            text[],
  og_image        text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- FK index.
CREATE INDEX IF NOT EXISTS idx_blog_articles_series_id
  ON public.blog_articles (series_id);
-- Common query: published articles ordered by date descending.
CREATE INDEX IF NOT EXISTS idx_blog_articles_published_at
  ON public.blog_articles (published_at DESC)
  WHERE status = 'published';

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.blog_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.blog_articles TO anon;
GRANT SELECT ON TABLE public.blog_articles TO authenticated;
-- INSERT/UPDATE/DELETE: site admin only (via service role operations)
GRANT ALL ON TABLE public.blog_articles        TO service_role;

-- ------------------------------------------------------------
-- site_resources
-- Reference links, books, videos, and tools for the /resources page.
-- No FK dependencies.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_resources (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  title           text NOT NULL,
  resource_type   text CHECK (resource_type IN ('article','book','video','tool','guide')),
  category        text,
  sort_order      integer,
  is_featured     boolean NOT NULL DEFAULT false,
  url             text,
  description     text,
  tags            text[],
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Partial index: featured resources for homepage/sidebar display.
CREATE INDEX IF NOT EXISTS idx_site_resources_featured
  ON public.site_resources (sort_order ASC NULLS LAST)
  WHERE is_featured = true;

ALTER TABLE public.site_resources ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.site_resources TO anon;
GRANT SELECT ON TABLE public.site_resources TO authenticated;
-- INSERT/UPDATE/DELETE: site admin only (via service role operations)
GRANT ALL ON TABLE public.site_resources       TO service_role;

-- ------------------------------------------------------------
-- event_slideshows
-- Metadata for presentation slideshows. .tsx data files stay in git.
-- Route loads metadata from DB and slide content from the .tsx module.
-- file_path is relative to the site/ root, e.g. 'data/slideshows/tumbarumba.tsx'
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_slideshows (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text UNIQUE NOT NULL,
  title             text NOT NULL,
  event_id          uuid REFERENCES public.group_events(id),
  file_path         text NOT NULL,
  slide_count       integer,
  duration_minutes  integer,
  description       text,
  is_published      boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_slideshows_event_id
  ON public.event_slideshows (event_id);

ALTER TABLE public.event_slideshows ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.event_slideshows TO anon;
GRANT SELECT ON TABLE public.event_slideshows TO authenticated;
-- INSERT/UPDATE/DELETE: site admin only (via service role operations)
GRANT ALL ON TABLE public.event_slideshows     TO service_role;
