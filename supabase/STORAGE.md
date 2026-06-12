# Future Together — Supabase Storage

> Bucket structure and access policies for this project.  
> RLS policy patterns: [`RLS_PATTERNS.md`](./RLS_PATTERNS.md). Overall conventions: [`SUPABASE.md`](./SUPABASE.md).  
> **Skill references:** `security-rls-basics.md`, `security-rls-performance.md` — Storage policies follow the same rules as table RLS, including the `(SELECT auth.uid())` performance requirement.

**Brand assets stay in git.** `site/static/` (logo, favicon, OG images) is git-tracked. Supabase Storage is for user-generated and programmatically-generated content only.

---

## Buckets

| Bucket | Visibility | Purpose |
|---|---|---|
| `groups` | Private (RLS) | Group cover images; program and event promotional assets; admin support docs |
| `admin` | Private (RLS) | Site-admin-only HTML templates for material generation |

**`members` bucket** (Phase D): Member avatars. Not created yet — YAGNI until routes exist.

All buckets are **private**. Public access where needed is granted via explicit `TO anon` RLS policies, not by making a bucket public. This allows public access to be conditional on DB state (e.g. group visibility, event status).

---

## Bucket structure

```
groups/
  {group-id}/
    cover.webp                      ← group hero image
    programs/
      {program-id}/
        cover.webp                  ← program series art
        handout.html / handout.pdf  ← shared program handout (all instances)
        poster.html / poster.pdf
        social-card.webp
    events/
      {event-id}/
        poster.webp                 ← event-specific poster
        handout.html / handout.pdf  ← event-specific handout (overrides program if present)
        poster.html / poster.pdf
        social-card.webp
    support/
      starter-kit.pdf               ← group-admin-only downloads
      facilitation-guide.pdf

admin/
  templates/
    handout-template.html           ← site-admin-only source templates
    poster-template.html
    social-card-template.html
```

**Path conventions:**
- `{group-id}`, `{program-id}`, and `{event-id}` are UUIDs matching the DB `id` columns
- `programs/` and `events/` are siblings under the group — flat, not nested (simplifies RLS path extraction)
- Program-level assets are shared across all event instances; event-level assets are instance-specific overrides

---

## Access matrix

| Path | Anon | Group member | Group admin | Site admin |
|---|---|---|---|---|
| `groups/{gid}/cover.webp` | ✅ if group public+active | ✅ | ✅ | ✅ |
| `groups/{gid}/programs/{pid}/cover.webp` | ✅ if group public+active | ✅ | ✅ | ✅ |
| `groups/{gid}/programs/{pid}/handout.*` | ❌ | ✅ | ✅ | ✅ |
| `groups/{gid}/programs/{pid}/poster.*` | ❌ | ✅ | ✅ | ✅ |
| `groups/{gid}/programs/{pid}/social-card.*` | ❌ | ❌ | ✅ | ✅ |
| `groups/{gid}/events/{eid}/poster.webp` | ✅ if event public+published | ✅ | ✅ | ✅ |
| `groups/{gid}/events/{eid}/handout.*` | ❌ | ✅ | ✅ | ✅ |
| `groups/{gid}/events/{eid}/poster.*` | ❌ | ✅ | ✅ | ✅ |
| `groups/{gid}/events/{eid}/social-card.*` | ❌ | ❌ | ✅ | ✅ |
| `groups/{gid}/support/*` | ❌ | ❌ | ✅ | ✅ |
| `admin/templates/*` | ❌ | ❌ | ❌ | ✅ |

**Notes:**
- Unlisted and private groups: cover images are **not** publicly accessible (anon policy requires `visibility = 'public'`)
- Private group events: posters are **not** publicly accessible (anon policy requires event `visibility IN ('public','featured')` and `status = 'published'`)
- Social cards are admin-only: generated for sharing by admins, not for general member download
- Site admin = `site_admin` or `site_owner` role in `user_platform_roles`
- Group admin = `group_admin` or `group_owner` role in `group_memberships` for that group
- Server-side uploads (via `SUPABASE_SECRET_KEY` / admin client) bypass RLS entirely

---

## RLS policy approach

Storage policies are in [`migrations/20260612000013_storage_buckets.sql`](./migrations/20260612000013_storage_buckets.sql).

Path extraction uses `storage.foldername()` (returns a Postgres array, 1-indexed) and `storage.filename()`:

```sql
-- For path: {group-id}/events/{event-id}/poster.webp
(storage.foldername(name))[1]  →  group-id
(storage.foldername(name))[2]  →  'events'
(storage.foldername(name))[3]  →  event-id
storage.filename(name)         →  'poster.webp'
```

All `auth.uid()` calls are wrapped in `(SELECT auth.uid())` per SUPABASE.md §2.1.

Membership checks join against `group_memberships` using the group-id extracted from the path:

```sql
EXISTS (
  SELECT 1 FROM group_memberships gm
  WHERE gm.group_id::text = (storage.foldername(name))[1]
    AND gm.profile_id = (SELECT auth.uid())
    AND gm.status = 'active'
)
```

---

## config.toml (local dev)

Buckets are declared in `supabase/config.toml` so `supabase db reset` creates them locally:

```toml
[storage.buckets.groups]
public = false
file_size_limit = "10MiB"
allowed_mime_types = ["image/webp", "image/jpeg", "image/png", "text/html", "application/pdf"]

[storage.buckets.admin]
public = false
file_size_limit = "10MiB"
allowed_mime_types = ["text/html", "application/pdf"]
```

RLS policies are applied by the migration on `db reset` — `config.toml` handles bucket creation only.

---

## Production deployment

Buckets and policies are created via `supabase db push`, which applies the migration to the production database. No manual dashboard steps required.

```bash
supabase db push   # applies outstanding migrations including 000013_storage_buckets.sql
```

Verify in the Supabase Dashboard → Storage after push.

---

## Material generation flow

Promotional materials are generated server-side and saved to Storage:

1. Admin visits `/groups/[slug]/admin/materials/` (or event-specific materials page)
2. Selects material type; server substitutes group/event/program data into HTML template from `admin/templates/`
3. Server saves rendered HTML (and later PDF) to `groups/{group-id}/programs/{program-id}/` or `groups/{group-id}/events/{event-id}/`
4. Download links served from Storage signed URLs (for private paths) or direct public-URL (for public assets)

Materials can be regenerated at any time; previous versions are overwritten.

**PDF generation:** Print-to-PDF instructions (Phase A/B). Server-side Puppeteer or `pdf-lib` template replacement evaluated in Phase C. See `support/local-groups-plan.md` §9.4 for the decision rationale.
