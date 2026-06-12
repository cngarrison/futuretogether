-- ============================================================
-- Migration: 20260612000010_rls_content
-- Purpose:   RLS policies for content metadata tables:
--            blog_articles, blog_series, site_resources, event_slideshows
-- Ref:       supabase/RLS_PATTERNS.md
-- Pattern:   All content tables: public read (with filter) +
--            site_admin_all for writes.
-- ============================================================

-- ------------------------------------------------------------
-- blog_articles
-- Public: published articles only.
-- Site admins: full access (including drafts).
-- ------------------------------------------------------------

CREATE POLICY "public_read"
  ON public.blog_articles FOR SELECT
  USING (status = 'published');

CREATE POLICY "site_admin_all"
  ON public.blog_articles FOR ALL
  USING (public.is_site_admin());

-- ------------------------------------------------------------
-- blog_series
-- Public: all series visible (series index drives article grouping).
-- Site admins: full access.
-- ------------------------------------------------------------

CREATE POLICY "public_read"
  ON public.blog_series FOR SELECT
  USING (true);

CREATE POLICY "site_admin_all"
  ON public.blog_series FOR ALL
  USING (public.is_site_admin());

-- ------------------------------------------------------------
-- site_resources
-- Public: all resources visible.
-- Site admins: full access.
-- ------------------------------------------------------------

CREATE POLICY "public_read"
  ON public.site_resources FOR SELECT
  USING (true);

CREATE POLICY "site_admin_all"
  ON public.site_resources FOR ALL
  USING (public.is_site_admin());

-- ------------------------------------------------------------
-- event_slideshows
-- Public: published event_slideshows only.
-- Site admins: full access (including unpublished).
-- ------------------------------------------------------------

CREATE POLICY "public_read"
  ON public.event_slideshows FOR SELECT
  USING (is_published = true);

CREATE POLICY "site_admin_all"
  ON public.event_slideshows FOR ALL
  USING (public.is_site_admin());
