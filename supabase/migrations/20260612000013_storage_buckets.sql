-- ft-o1k.13: Supabase Storage — buckets and RLS policies
--
-- Bucket structure (all private — public access via explicit anon policies below):
--
--   groups/
--     {group-id}/
--       cover.webp                           anon-readable if group is public+active
--       programs/
--         {program-id}/
--           cover.webp                       anon-readable if group is public+active
--           handout.html / handout.pdf       member-readable
--           poster.html / poster.pdf         member-readable
--           social-card.webp                 admin-only
--       events/
--         {event-id}/
--           poster.webp                      anon-readable if event is public+published
--           handout.html / handout.pdf       member-readable
--           poster.html / poster.pdf         member-readable
--           social-card.webp                 admin-only
--       support/
--         starter-kit.pdf                    group-admin-only
--         facilitation-guide.pdf
--
--   admin/
--     templates/
--       handout-template.html                site-admin-only
--       poster-template.html
--       social-card-template.html
--
-- Path extraction (Postgres arrays are 1-indexed):
--   (storage.foldername(name))[1]  = group-id
--   (storage.foldername(name))[2]  = 'programs' | 'events' | 'support' | NULL (top-level file)
--   (storage.foldername(name))[3]  = program-id | event-id
--
-- RLS performance: auth.uid() is wrapped in (SELECT ...) throughout — evaluated once per query.
-- See SUPABASE.md §2.1.

-- ============================================================
-- Buckets
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'groups',
    'groups',
    false,
    10485760,  -- 10 MiB per file
    ARRAY['image/webp', 'image/jpeg', 'image/png', 'text/html', 'application/pdf']
  ),
  (
    'admin',
    'admin',
    false,
    10485760,  -- 10 MiB per file
    ARRAY['text/html', 'application/pdf']
  )
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- groups bucket — anon read (public assets only)
-- ============================================================

-- Anon can read group-level cover image for public, active groups.
-- Path shape: {group-id}/cover.webp  →  foldername depth = 1
CREATE POLICY "groups_anon_select_group_cover"
ON storage.objects FOR SELECT TO anon
USING (
  bucket_id = 'groups'
  AND storage.filename(name) = 'cover.webp'
  AND array_length(storage.foldername(name), 1) = 1
  AND EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id::text = (storage.foldername(name))[1]
      AND g.visibility = 'public'
      AND g.status = 'active'
  )
);

-- Anon can read program-level cover image when the parent group is public and active.
-- Path shape: {group-id}/programs/{program-id}/cover.webp  →  foldername depth = 3
CREATE POLICY "groups_anon_select_program_cover"
ON storage.objects FOR SELECT TO anon
USING (
  bucket_id = 'groups'
  AND storage.filename(name) = 'cover.webp'
  AND array_length(storage.foldername(name), 1) = 3
  AND (storage.foldername(name))[2] = 'programs'
  AND EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id::text = (storage.foldername(name))[1]
      AND g.visibility = 'public'
      AND g.status = 'active'
  )
);

-- Anon can read event poster for public/featured published events.
-- Path shape: {group-id}/events/{event-id}/poster.webp  →  foldername depth = 3
CREATE POLICY "groups_anon_select_event_poster"
ON storage.objects FOR SELECT TO anon
USING (
  bucket_id = 'groups'
  AND storage.filename(name) = 'poster.webp'
  AND array_length(storage.foldername(name), 1) = 3
  AND (storage.foldername(name))[2] = 'events'
  AND EXISTS (
    SELECT 1 FROM group_events ge
    WHERE ge.id::text = (storage.foldername(name))[3]
      AND ge.visibility IN ('public', 'featured')
      AND ge.status = 'published'
  )
);


-- ============================================================
-- groups bucket — authenticated reads
-- ============================================================

-- Group members can read all non-support, non-social-card paths in their group.
-- Covers: group cover, programs/* (handouts, posters), events/* (poster, handouts, posters).
-- Excludes: support/ (admin-only) and social-card.* (admin-only).
CREATE POLICY "groups_member_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'groups'
  AND (storage.foldername(name))[2] IS DISTINCT FROM 'support'
  AND storage.filename(name) NOT LIKE 'social-card%'
  AND EXISTS (
    SELECT 1 FROM group_memberships gm
    WHERE gm.group_id::text = (storage.foldername(name))[1]
      AND gm.profile_id = (SELECT auth.uid())
      AND gm.status = 'active'
  )
);

-- Group admins and site admins can read ALL paths in their group,
-- including support/ docs and social-card assets excluded from member access.
CREATE POLICY "groups_admin_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'groups'
  AND (
    EXISTS (
      SELECT 1 FROM group_memberships gm
      WHERE gm.group_id::text = (storage.foldername(name))[1]
        AND gm.profile_id = (SELECT auth.uid())
        AND gm.role IN ('group_admin', 'group_owner')
        AND gm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM user_platform_roles upr
      WHERE upr.profile_id = (SELECT auth.uid())
        AND upr.role IN ('site_admin', 'site_owner')
    )
  )
);


-- ============================================================
-- groups bucket — authenticated writes (admin only)
-- ============================================================

CREATE POLICY "groups_admin_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'groups'
  AND (
    EXISTS (
      SELECT 1 FROM group_memberships gm
      WHERE gm.group_id::text = (storage.foldername(name))[1]
        AND gm.profile_id = (SELECT auth.uid())
        AND gm.role IN ('group_admin', 'group_owner')
        AND gm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM user_platform_roles upr
      WHERE upr.profile_id = (SELECT auth.uid())
        AND upr.role IN ('site_admin', 'site_owner')
    )
  )
);

CREATE POLICY "groups_admin_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'groups'
  AND (
    EXISTS (
      SELECT 1 FROM group_memberships gm
      WHERE gm.group_id::text = (storage.foldername(name))[1]
        AND gm.profile_id = (SELECT auth.uid())
        AND gm.role IN ('group_admin', 'group_owner')
        AND gm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM user_platform_roles upr
      WHERE upr.profile_id = (SELECT auth.uid())
        AND upr.role IN ('site_admin', 'site_owner')
    )
  )
);

CREATE POLICY "groups_admin_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'groups'
  AND (
    EXISTS (
      SELECT 1 FROM group_memberships gm
      WHERE gm.group_id::text = (storage.foldername(name))[1]
        AND gm.profile_id = (SELECT auth.uid())
        AND gm.role IN ('group_admin', 'group_owner')
        AND gm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM user_platform_roles upr
      WHERE upr.profile_id = (SELECT auth.uid())
        AND upr.role IN ('site_admin', 'site_owner')
    )
  )
);


-- ============================================================
-- admin bucket — site admins only (all operations)
-- ============================================================

CREATE POLICY "admin_site_admin_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'admin'
  AND EXISTS (
    SELECT 1 FROM user_platform_roles upr
    WHERE upr.profile_id = (SELECT auth.uid())
      AND upr.role IN ('site_admin', 'site_owner')
  )
);

CREATE POLICY "admin_site_admin_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'admin'
  AND EXISTS (
    SELECT 1 FROM user_platform_roles upr
    WHERE upr.profile_id = (SELECT auth.uid())
      AND upr.role IN ('site_admin', 'site_owner')
  )
);

CREATE POLICY "admin_site_admin_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'admin'
  AND EXISTS (
    SELECT 1 FROM user_platform_roles upr
    WHERE upr.profile_id = (SELECT auth.uid())
      AND upr.role IN ('site_admin', 'site_owner')
  )
);

CREATE POLICY "admin_site_admin_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'admin'
  AND EXISTS (
    SELECT 1 FROM user_platform_roles upr
    WHERE upr.profile_id = (SELECT auth.uid())
      AND upr.role IN ('site_admin', 'site_owner')
  )
);
