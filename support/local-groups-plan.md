# Future Together — Local Groups: Requirements & Implementation Plan

**Version:** 0.2  
**Date:** 2026-06-12  
**Status:** Near-final — pending sign-off on Open Decisions (§16)  
**Context:** Following Tumbarumba community event (2026-06-11). Attendees expressed desire for local community action starting with a mailing list. This document defines the full local groups feature set and migration path.

---

## Changelog

| Version | Date | Changes |
|---|---|---|
| 0.1 | 2026-06-11 | Initial draft |
| 0.2 | 2026-06-12 | Roles taxonomy; schema decision (public + RLS); bare `id` PKs; unified `group_events` table; route structure (`/groups/` + `/admin/`); email from-address pattern; Global group replaces NULL group_id; `event_reminder_logs` table; table renames (blog_series, site_resources); FK naming convention; PDF Option C; AI content policy; BB attribution policy; organiser_id on events |

---

## 1. Overview

Future Together was conceived with local groups at its heart — geographically-rooted communities where people process, discuss, and act on AI's impact together. This plan defines what that means technically and operationally, from the immediate Tumbarumba mailing list through to a full multi-tier group system.

### Immediate need (unblocked today — no build required)

Create a Resend Audience called "Tumbarumba Community", manually add emails from the event sign-up sheet, and send a follow-up. This is independent of all software below.

### Scope of this plan

- Supabase as the unified backend (DB + Auth + Storage)
- Migration of all file-based content (`site/data/`) to Supabase
- Authentication (password + magic link) and role-based access control
- Group data model: geographic, non-geographic, and global types
- Group membership, roles, and row-level access control
- Group events (one-off and recurring)
- Group communication via Resend
- Promotional material generation (HTML + PDF)
- Support materials for admins and presenters
- Route structure and admin interfaces
- Legal and privacy (international scope)
- Governance and moderation

---

## 2. Strategic Decisions (Confirmed)

| Decision | Resolution |
|---|---|
| Backend | **Supabase** (Postgres + Auth + Storage + RLS) |
| Auth methods | **Email/password AND magic link** — user's choice at login |
| Group creation approval | **Manual approval by CNG** (Charlie Garrison) for now |
| Group founder | **Charlie Garrison** (FT founder) |
| Email provider | **Resend** (existing) |
| Member communication | **Email-only**; Slack may remain for group admins only |
| FT geographic scope | **International** — not Australia-only |
| Blog content | Markdown files in git; DB stores metadata only |
| Slideshow content | `.tsx` data files in git; DB stores metadata only |
| PDF generation | Start with browser print-to-PDF; escalate in Phase C |
| Supabase region | **EU (Frankfurt)** — GDPR baseline for global audience |
| Group email from-address | `group-{slug}@futuretogether.community` (dash delimiter) |
| Minimum age | **16 years** (GDPR standard) |
| AI-assisted content | **Permitted** to clarify the author's voice; not to originate content |
| BB promotion | **Low-key attribution** is fine (footer, credits); not promotional |
| FT free | Always free — no paywall, premium tiers, or monetisation |
| FT non-partisan | Politically, corporately, and religiously agnostic |

---

## 3. Architecture Changes

### 3.1 Supabase Integration

Supabase replaces Deno KV as the primary persistent data store. It provides:

- **Postgres** — relational queries, joins, full-text search, PostGIS geospatial
- **Auth** — magic link + email/password, session management, JWTs
- **Storage** — file buckets with path-based RLS
- **Row-Level Security** — database-level access control on every table
- **PostgREST** — auto-generated REST API from schema
- **Realtime** — optional; reserved for future live features

**Deno KV is retained** for the slideshow sync system (WebSocket command bus). This is appropriate: it's ephemeral session state, not persistent data, and Supabase Realtime would be heavier for this use case.

**Client:** `@supabase/supabase-js` added to `site/deno.json` imports. Auth state managed via Supabase JWT in httpOnly cookies (server-side session).

### 3.2 Postgres Schema Organisation

**Decision: single `public` schema with strict RLS on every table.**

Rationale for not using custom schemas (`ft_auth`, `ft_groups`, etc.) with Supabase:
- Supabase PostgREST exposes `public` by default; additional schemas require explicit `db_schema` config in `supabase/config.toml` and `schema` headers on API calls
- Supabase CLI migrations and auto-generated TypeScript types assume `public`
- Every migration and query would require schema prefixes, adding verbosity without benefit
- The protection from accidental `public` leakage is better achieved through: RLS on every table + `REVOKE ALL ON SCHEMA public FROM anon` + explicit per-table `GRANT`

**Mandatory RLS requirement:** Every table in `public` MUST have RLS enabled and at least one policy. Tables with no RLS are inaccessible by default (Supabase blocks unauthenticated reads when RLS is enabled but no policy exists). This requirement must be documented in a Supabase-specific guidelines file (see §3.2.1).

**Supabase Auth schema** (`auth.*`) remains as managed by Supabase internally.

#### 3.2.1 Supabase guidelines file

Create `supabase/SUPABASE.md` documenting:
- Absolute requirement: RLS enabled on every table, no exceptions
- Pattern for common RLS policies (public read, group-member read, group-admin write)
- `REVOKE` / `GRANT` baseline setup
- Migration file conventions
- Environment variables required (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`)

### 3.3 Data Migration: `site/data/` → Supabase

| Current file | Migration target | Notes |
|---|---|---|
| `data/events/*.yaml` | `group_events` table | Migrated as Global group events |
| `data/resources.ts` | `site_resources` table | TS object array → rows |
| `data/series.ts` | `blog_series` table | Small; straightforward |
| `data/slideshows/*.tsx` | `event_slideshows` table (metadata only) | `.tsx` files stay in git |
| `site/blog/*.md` | `blog_articles` table (metadata only) | Markdown files stay in git |

**Slideshow files** (e.g. `tumbarumba-june-2026.tsx` — 80KB) contain complex structured slide data. Migrating to DB records would break the authoring workflow. The `event_slideshows` table stores metadata (slug, title, event_id, is_published); routes load the `.tsx` module for slide content. Phase B: slideshow templates may support `{{group_name}}` token substitution for group-customised versions.

**Blog files** stay in git. `blog_articles` table stores metadata (slug, title, author, published_at, tags, og_image, series_id, status). Routes load metadata from DB and markdown content from file.

### 3.4 Supabase Storage (Buckets)

Storage replaces `site/static/` for user-generated and generated assets. Brand assets (logo, favicon, charts) remain in git.

**Bucket structure — paths drive RLS policies:**

```
groups/
  {group-id}/
    cover.webp
    promotional/
      {event-id}/
        handout.html
        handout.pdf
        poster.html
        poster.pdf
        social-card.webp
    support/                        # group-admin-only downloads
      starter-kit.pdf
      facilitation-guide.pdf

events/
  {event-id}/
    poster.webp
    handout.pdf

members/
  {user-id}/
    avatar.webp                     # Phase D

admin/
  templates/
    handout-template.html
    poster-template.html
    social-card-template.html
```

**RLS on storage paths:**

| Path | Read | Write |
|---|---|---|
| `groups/{gid}/*` | group members | group admins + site admins |
| `groups/{gid}/support/*` | group admins only | site admins |
| `events/*` | public | group admins + site admins |
| `admin/templates/*` | site admins | site admins |
| `members/{uid}/*` | owner only | owner + site admins |

---

## 4. Authentication & Roles

### 4.1 Login methods (user's choice)

Supabase Auth supports both simultaneously. The login UI offers:
1. **Email + password** — persistent credential; suits users who prefer it
2. **Magic link** — one-click email login; no password required

A user can have both: setting a password doesn't disable magic link. Session duration: 7 days default; "remember me" option: 30 days.

### 4.2 Route auth middleware

Two middleware files; separate, clean scopes:

```
routes/
  admin/
    _middleware.ts        # checks: site_admin or site_owner role
  groups/
    [slug]/
      admin/
        _middleware.ts    # checks: group_admin or group_owner for THIS slug
                          # ctx.params.slug available; passes ctx.state.membership
```

Fresh v2 provides `ctx.params.slug` in middleware, enabling the group-scoped check.

API routes follow the same structure:
```
routes/
  api/
    admin/
      _middleware.ts      # site_admin check
    groups/
      [slug]/
        _middleware.ts    # group_admin check
```

### 4.3 Role taxonomy

Two scopes: **platform-level** (stored in `user_platform_roles`) and **group-level** (stored in `group_memberships.role`).

#### Platform-level roles

| Role | Capabilities |
|---|---|
| `site_owner` | Full platform access. Same privileges as `site_admin` for now; distinct role allows future privilege differentiation and is non-delegatable |
| `site_admin` | Approve/suspend groups; manage all members; manage all content (blog, resources, slideshows); manage email templates; platform analytics; can act as admin in any group |

#### Group-level roles

| Role | Capabilities |
|---|---|
| `group_owner` | All admin functions for their group; transfer ownership; archive group; same as `group_admin` plus ownership-specific actions |
| `group_admin` | Manage members; send group emails; create/manage events; generate promotional materials; manage group settings |
| `member` | View group events (per visibility setting); receive group emails (if opted in); register for events; access member resources |

#### RBAC approach

The table-based role model above IS proper RBAC — roles, role assignments, and permission checks enforced at both application and database (RLS) levels. A framework (Permit.io, Casbin) would be over-engineering at this scale. The implementation is:
- Platform roles: checked in middleware via `user_platform_roles` table
- Group roles: checked in middleware via `group_memberships` table (with slug → group_id lookup)
- Both enforced again at DB layer via RLS policies

### 4.4 Staff route migration

The existing `routes/staff/` becomes `routes/admin/`. The `staff/_middleware.ts` password check is replaced by Supabase session + `site_owner`/`site_admin` role check. All existing staff functionality is preserved under the new path.

---

## 5. Database Design

### 5.1 Field naming conventions

- **Primary keys:** `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` — bare `id` (industry standard; Supabase client, TypeScript codegen, and query patterns all assume this)
- **Foreign keys:** `{referenced_table_singular}_id` — e.g. `group_id`, `profile_id`, `event_id`
- **Self-referential FKs:** `parent_group_id`, `created_by_id`, `updated_by_id`, `sent_by_id`, `organiser_id`
- **Timestamps:** `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`
- **Booleans:** positive framing — `is_published`, `is_active`, `email_opt_in`
- **Enums stored as text** with CHECK constraints (avoids Postgres enum migration pain)

### 5.2 Table: profiles

```sql
CREATE TABLE profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               text NOT NULL UNIQUE,
  name_first          text,
  name_last           text,
  age_confirmed       boolean DEFAULT false,    -- 16+ confirmation on signup
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
-- No ft_email_opt_in: handled via Global group membership opt-in
```

### 5.3 Table: user_platform_roles

```sql
CREATE TABLE user_platform_roles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role                text NOT NULL CHECK (role IN ('site_owner', 'site_admin')),
  granted_at          timestamptz DEFAULT now(),
  granted_by_id       uuid REFERENCES profiles(id),
  UNIQUE(profile_id, role)
);
```

### 5.4 Table: groups

```sql
CREATE TABLE groups (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text UNIQUE NOT NULL,
  name                text NOT NULL,
  description         text,
  group_type          text NOT NULL CHECK (group_type IN ('geographic', 'non-geographic', 'global')),

  -- Geographic fields (null for non-geographic/global)
  location_name       text,           -- 'Tumbarumba, NSW, Australia'
  location_suburb     text,
  location_region     text,           -- 'Snowy Mountains'
  location_state      text,           -- 'NSW'
  location_country    text,           -- 'Australia'
  lat                 numeric(9,6),
  lng                 numeric(9,6),

  -- Hierarchy (all groups except the Global group have a parent)
  parent_group_id     uuid REFERENCES groups(id),
  tier                text CHECK (tier IN ('local','regional','state','national','global','thematic')),

  -- Non-geographic metadata
  website_url         text,           -- For organisation groups (e.g. Red Cross)

  -- Assets
  cover_image_path    text,           -- Supabase Storage path
  tags                text[],

  -- Status & visibility
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','active','archived','suspended')),
  visibility          text NOT NULL DEFAULT 'public'
                        CHECK (visibility IN ('public','unlisted','private')),

  -- Lifecycle
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  approved_at         timestamptz,
  approved_by_id      uuid REFERENCES profiles(id),
  archived_at         timestamptz,
  last_activity_at    timestamptz
);
```

**Global group:** One seeded record with `group_type = 'global'`, `tier = 'global'`, `parent_group_id = NULL`. All other groups have `parent_group_id` set (at minimum to the Global group, or to their geographic parent). FT-wide events belong to this group.

**Pros of Global group vs NULL:**
- No nullable `group_id` FK — referential integrity throughout
- FT newsletter opt-in is just `group_memberships.email_opt_in` for the Global group
- Event queries are uniform: all events belong to a group
- Simpler RLS: no special-casing for NULL

**Cons:**
- Must seed the Global group before any other data
- Slightly more complex group hierarchy display (filter out Global group from public browse)

### 5.5 Table: group_memberships

```sql
CREATE TABLE group_memberships (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id            uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  profile_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role                text NOT NULL DEFAULT 'member'
                        CHECK (role IN ('group_owner','group_admin','member')),
  status              text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','pending','banned')),
  email_opt_in        boolean NOT NULL DEFAULT true,
  source              text CHECK (source IN ('self-joined','invited','imported','admin-added')),
  joined_at           timestamptz DEFAULT now(),
  invited_by_id       uuid REFERENCES profiles(id),
  UNIQUE(group_id, profile_id)
);
```

FT-wide newsletter opt-in: membership of the Global group with `email_opt_in = true`.

### 5.6 Table: group_events

All events — FT-wide and group-level — live in this single table. FT-wide events (e.g. `discuss-our-future`) have `group_id` pointing to the Global group.

```sql
CREATE TABLE group_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text NOT NULL,
  group_id            uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title               text NOT NULL,
  description         text,
  event_type          text NOT NULL DEFAULT 'one-off'
                        CHECK (event_type IN ('one-off','recurring')),
  recurrence_rule     text,               -- iCal RRULE string; null for one-off
  parent_event_id     uuid REFERENCES group_events(id),  -- recurring instance → template

  -- Timing
  event_date          timestamptz,
  duration_minutes    integer DEFAULT 60,
  timezone            text DEFAULT 'Australia/Sydney',
  registration_deadline_days integer DEFAULT 1,

  -- Location
  location_type       text CHECK (location_type IN ('physical','online','hybrid')),
  location_name       text,
  location_address    text,
  meeting_link        text,

  -- Registration
  capacity            integer,
  is_registration_required boolean DEFAULT true,

  -- Organiser (profile in FT; usually group admin, can be delegated)
  organiser_id        uuid REFERENCES profiles(id),
  presented_by        text,           -- display name (may differ from organiser)
  sponsored_by        text,

  -- Visibility & status
  visibility          text NOT NULL DEFAULT 'group'
                        CHECK (visibility IN ('group','public','featured')),
  status              text NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','published','cancelled','completed')),

  -- Assets
  poster_image_path   text,
  slideshow_url       text,
  resources           jsonb DEFAULT '[]',  -- [{label, url, type, description}]

  -- Metadata
  more_info_file      text,           -- migrated from YAML
  created_by_id       uuid REFERENCES profiles(id),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),

  UNIQUE(group_id, slug)
);
```

### 5.7 Table: event_registrations

```sql
CREATE TABLE event_registrations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            uuid NOT NULL REFERENCES group_events(id) ON DELETE CASCADE,
  profile_id          uuid REFERENCES profiles(id),  -- null for guest registrations
  email               text NOT NULL,
  name_first          text,
  name_last           text,
  status              text NOT NULL DEFAULT 'registered'
                        CHECK (status IN ('registered','cancelled','attended')),
  registered_at       timestamptz DEFAULT now(),
  cancelled_at        timestamptz,
  source              text DEFAULT 'web' CHECK (source IN ('web','admin-added'))
);
```

### 5.8 Table: event_reminder_logs

Separate from registrations; supports multiple reminder types per registration.

```sql
CREATE TABLE event_reminder_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id     uuid NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  reminder_type       text NOT NULL,      -- '1-day' | '1-hour' | 'custom'
  sent_at             timestamptz DEFAULT now(),
  resend_message_id   text                -- Resend API message ID for tracking
);
```

### 5.9 Content tables

```sql
-- Blog articles: metadata only; markdown content stays in git
CREATE TABLE blog_articles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  title           text NOT NULL,
  author          text,
  excerpt         text,
  published_at    timestamptz,
  status          text DEFAULT 'draft' CHECK (status IN ('draft','published')),
  tags            text[],
  og_image        text,
  series_id       uuid REFERENCES blog_series(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Blog series
CREATE TABLE blog_series (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  title           text NOT NULL,
  description     text
);

-- Site resources (reference links, books, tools)
CREATE TABLE site_resources (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  title           text NOT NULL,
  resource_type   text,  -- 'article' | 'book' | 'video' | 'tool' | 'guide'
  url             text,
  description     text,
  tags            text[],
  is_featured     boolean DEFAULT false,
  sort_order      integer,
  created_at      timestamptz DEFAULT now()
);

-- Slideshows: metadata only; .tsx data files stay in git
CREATE TABLE event_slideshows (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  title           text NOT NULL,
  event_id        uuid REFERENCES group_events(id),
  file_path       text NOT NULL,    -- relative path to .tsx data file
  is_published    boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);
```

### 5.10 Communication tables

```sql
-- Log of all group email sends
CREATE TABLE email_sends (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        uuid REFERENCES groups(id),
  sent_by_id      uuid NOT NULL REFERENCES profiles(id),
  subject         text NOT NULL,
  body_markdown   text NOT NULL,
  resend_batch_id text,
  recipient_count integer,
  sent_at         timestamptz DEFAULT now()
);

-- Consent audit trail (GDPR compliance)
CREATE TABLE email_consents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid NOT NULL REFERENCES profiles(id),
  consent_type    text NOT NULL CHECK (consent_type IN ('group_email','ft_newsletter')),
  group_id        uuid REFERENCES groups(id),
  granted         boolean NOT NULL,
  consented_at    timestamptz DEFAULT now(),
  ip_address      text,
  source          text  -- 'signup' | 'join-group' | 'imported' | 'admin-added' | 'unsubscribe'
);
```

---

## 6. Group Types & Hierarchy

### 6.1 Geographic groups

```
global  (FT Global — the online community; parent_group_id = NULL)
  └── national       e.g. 'Future Together Australia'
        └── state    e.g. 'Future Together NSW'
              └── regional  e.g. 'Snowy Mountains & Riverina'
                    └── local  e.g. 'Tumbarumba Community'
```

- Hierarchy is optional: a local group can exist without any parent other than Global
- `parent_group_id` supports the hierarchy but does not enforce completeness
- Phase A: flat structure (local groups only, all children of Global)
- Phase C: hierarchy UI, regional grouping, aggregate event promotion

**Geocoding:** On group creation, location fields geocoded to lat/lng via Nominatim (OpenStreetMap — free, no key). Stored for map display and proximity search.

### 6.2 Non-geographic groups

Organisation- or interest-based. `group_type = 'non-geographic'`, `tier = 'thematic'`, location fields null. Identical to geographic groups in all other respects (membership, events, email).

Examples: Australian Red Cross interest group, Healthcare Workers, Educators.

### 6.3 Global group

One seeded record:
- `group_type = 'global'`, `tier = 'global'`, `slug = 'ft-global'`
- `parent_group_id = NULL` — the only group with no parent
- `visibility = 'unlisted'` — does not appear in `/groups` browse
- All FT-wide events (`discuss-our-future`, Tumbarumba) belong to this group
- FT newsletter = email to Global group members with `email_opt_in = true`
- New FT registrants are added as members of Global group (`source: 'self-joined'`)

As local groups grow, the Global group transitions from being the primary community hub to a coordination and announcement layer.

---

## 7. Group Lifecycle

### 7.1 Creation & approval

**Application form** (`/groups/start`):
- Group name
- Group type (geographic / non-geographic)
- Location (if geographic) — free text; geocoded on save
- Tier suggestion
- Description (public-facing)
- Why do you want to start this group?
- How do you plan to grow and run it?
- Agree to Code of Conduct (required)

**Flow:**
1. Form submitted → group created `status: pending`
2. Email to `charlie@futuretogether.community`: "New group application: [name]" with approve/decline action links
3. **Approve** → `status: active`; welcome email + starter kit to founder
4. **Decline** → email to founder with reason + encouragement to reapply

**Admin fast-path:** Site admins can create groups directly (bypasses approval). Used for: Global group seed, Tumbarumba seed, Red Cross pilot.

### 7.2 Route & URL structure

Fresh file routing: literal paths (e.g. `start.tsx`) always take precedence over dynamic `[slug].tsx`.

```
/groups/                    # Public: browse all active public groups
/groups/start               # Public: group application form
/groups/[slug]/             # Public: group page (events, member count, join)
/groups/[slug]/admin/       # Group admin (middleware: group_admin/owner)
  .../members/
  .../events/
  .../events/[id]/
  .../email/
  .../materials/
  .../settings/
  .../support/

/admin/                     # Site admin (middleware: site_owner/admin)
  .../groups/               # All groups: approve, suspend, list
  .../groups/[slug]/        # Site admin view of specific group
  .../members/
  .../events/
  .../content/              # blog_articles, site_resources, event_slideshows metadata
  .../email/                # FT-wide newsletter compose

/events/[slug]/             # Public: event detail page (existing; FT-wide events)
/account/                   # Member self-service
/account/groups/            # My groups; email preferences per group
/account/data/              # GDPR: export personal data
/account/delete/            # GDPR: account deletion

/api/groups/[slug]/...      # Group-scoped API (same auth as group admin pages)
/api/admin/...              # Site admin API
```

### 7.3 Discoverability

**`/groups`** — card grid of all active public groups:
- Filter by: country, state/region
- Search by: location name (Postgres full-text search)
- Phase C: map view (Leaflet.js + PostGIS proximity query)

**`/groups/[slug]`** — public group page:
- Cover image, name, location, description
- Upcoming public events
- Member count
- Join / Request to join button
- Contact organiser (proxied — does not expose admin email)

**Visibility:**
- `public` — appears in `/groups` browse + accessible by direct link
- `unlisted` — direct link only; suitable for pilots, informal groups (e.g. Global group)
- `private` — page exists but requires membership; invitations only

### 7.4 Lifecycle management

- `last_activity_at` updated on: email sent, event published, member joined
- 3 months inactivity → nudge email to group owner
- 6 months inactivity → second nudge + archival warning
- 9 months inactivity → auto-archive; members notified
- Archived groups retain all data; reactivatable by site admin

**Ownership transfer:**
1. Owner nominates current group admin as successor
2. Nominee receives confirmation email → accepts
3. Roles swap; former owner becomes group admin (or member, their choice)
4. Site admin can force-transfer in exceptional circumstances

**Deletion:** Groups are never hard-deleted; they are archived. On user account deletion, membership records are anonymised (`email → [deleted]`, `name_first/last → [deleted user]`).

---

## 8. Communication

### 8.1 Group email: admin → members

The existing `staff/emails/compose.tsx` (plain-text markdown + HTML preview + "send test" to composer) is the direct model for group email. The group admin version lives at `/groups/[slug]/admin/email/`.

**Compose flow:**
1. Write subject + body (markdown; rendered to clean HTML)
2. Preview panel shows rendered email
3. "Send test" → sends to composing admin's own email
4. Recipient count shown: "Will send to N members (M opted out)"
5. Confirm → send via Resend
6. Send logged in `email_sends`; consent log updated if first send to imported members

**From address:** `group-{slug}@futuretogether.community`
- Dash delimiter: looks professional; no spam filter concerns (unlike `+`)
- Wildcard routing configured on Resend domain: `*@futuretogether.community` routes to the platform
- Replies → group admin's email (Reply-To header)

**Rate limit:** 5 group emails/week (configurable per group by site admin)

**Unsubscribe:** Resend one-click unsubscribe header + footer link — legal requirement globally. Unsubscribe events → Resend webhook → `email_opt_in = false` in `group_memberships`. Member remains in group; admin sees opt-out count but not identities.

**Imported members** (e.g. Tumbarumba sign-up sheet): first email must explain how they were added, confirm their consent, and include one-click unsubscribe. Consent logged as `source: 'imported'`.

### 8.2 FT-wide newsletter

- **No separate opt-in field on `profiles`** — handled via Global group `email_opt_in`
- Members of Global group with `email_opt_in = true` receive the newsletter
- Composed via `/admin/email/` (site admin only)
- Sent via Resend; same markdown + HTML preview pattern

### 8.3 Automated notifications

**To members:**
- "You've been added to [Group]" — on import/admin-add; includes one-click unsubscribe
- "New event in [Group]: [Title]" — on event published
- "Reminder: [Event] is tomorrow" — 1 day before (existing system; logs to `event_reminder_logs`)
- "Reminder: [Event] starts in 1 hour" — 1 hour before
- "[Event] resources" — manual trigger by admin post-event

**To group admins:**
- "New member joined [Group]" — daily digest (not per-join)
- "Your group application has been approved"
- "Inactivity warning for [Group]" — at 3 and 6 months

**To site admin:**
- "New group application: [Name]" — immediate
- "[Group] reached [milestone] members" — at 10, 50, 100

### 8.4 Slack

Current state: Slack group exists, quiet, low engagement.

- **No investment** in Slack integration
- **Keep open** as an informal group-admins-only space (inter-admin communication)
- **Not positioned** as a channel for regular members — email is the primary channel
- Revisit when 5+ active groups exist: assess whether inter-admin communication needs a better tool

---

## 9. Promotional Material Generation

### 9.1 Concept

Group admins generate print-ready and digital promotional materials customised for their group or a specific event. Based on the `support/tumba-event/tumbarumba-handout.html` model: print-CSS-based, QR codes, local details — proven to work well in the field.

### 9.2 Material types

| Material | Format | Use case |
|---|---|---|
| Event handout | A4 | Take-home summary; QR to event page + resources |
| Event poster | A3/A4 | Physical display: venue, date, speaker |
| Social card | 1200×630px | Facebook, LinkedIn, email banner |
| "Join our group" flyer | A5 | Letterbox drops, community noticeboards |
| Group one-pager | A4 | What is FT, what our group does, how to join |

### 9.3 Template system

HTML templates stored in `admin/templates/` (Supabase Storage; site-admin managed):
- `{{placeholder}}` tokens replaced with group/event data
- FT brand CSS (teal, amber, warm white, Plus Jakarta Sans)
- Print-optimised `@media print` rules
- QR codes: use existing `QRCode` island for `.tsx` templates; for server-side rendering, use Deno QR library or inject the existing `/qrcode.js` script

**Generation flow:**
1. Admin visits `/groups/[slug]/admin/materials/` (or event-specific materials)
2. Selects material type
3. Reviews preview — group/event data substituted into template
4. Optionally edits any fields
5. Clicks Generate → server renders HTML → saves to `groups/{group-id}/promotional/{event-id}/`
6. Download links provided; also accessible from group/event admin page

Materials can be regenerated at any time (e.g. if event details change). Previous versions overwritten.

### 9.4 PDF generation options

**Option A — Server-side headless browser (Puppeteer/Playwright):**
- Renders HTML → PDF server-side
- High fidelity; fonts, layout, QR codes render correctly
- Adds Chromium binary dependency
- Best output quality; recommended for Phase C when multiple groups are active

**Option B — Print-to-PDF instructions (Phase A/B):**
- Deliver HTML only; instruct admins: File → Print → Save as PDF
- Zero server complexity
- Less reliable for non-technical admins; print settings vary between browsers
- Sufficient for early phase

**Option C — PDF template library:**
- CNG designs the PDF to their satisfaction using the current process (iterate until layout is correct)
- Save as a PDF template with placeholder tokens
- Server-side library (e.g. `pdf-lib` — available for Deno) replaces tokens in the PDF binary
- Avoids HTML → PDF rendering inconsistency entirely
- Best for print-critical layouts (fixed footers, page breaks, precise positioning)
- **Recommended for the handout and poster** once the design is finalised

**Decision:** Start with Option B for Phase A/B. Evaluate Option C vs Option A for Phase C based on how many materials are being generated and how often admins struggle with print settings.

---

## 10. Support Materials

### For group admins (delivered on group approval)

**Starter kit** (email with links to Storage-hosted PDFs):

- **"Running Your Future Together Group"** guide:
  - Suggested meeting formats: discussion circles, watch-and-discuss, action planning
  - How to facilitate (not lecture): open questions, active listening, handling tangents
  - Handling difficult conversations: the doom-poster, the denier, the recruiter
  - Promoting locally: noticeboards, library, local Facebook, letterbox drops, local paper
  - Media enquiries: what to say, what not to say, escalate to Charlie

- **Facilitation guide** (two pages):
  - Opening, keeping time, closing with action
  - The "parking lot" for off-topic threads
  - Suggested discussion questions per topic area

- **"Using the slideshow system"** guide:
  - Available slideshows and what audiences they suit
  - Controller view access and operation
  - Technical requirements
  - How to request a custom version

### For event presenters

- **Presenter notes** for each slideshow (in speaker view of the slideshow system)
- **"Adapting the talk for your community"** — rural vs urban, demographic considerations
- **Q&A preparation** — the 15 hardest questions and suggested framings
- **Room setup guide** — sign-up sheet template, QR code to join group, seating, AV checklist

### Delivery

- **Phase A/B:** Email on group approval with links to Storage-hosted PDFs
- **Phase B+:** `/groups/[slug]/admin/support/` — admin resource hub (Getting Started, Running Events, Communication, Promoting FT, Generated Materials library)

### Social media support (later phase)

Group admins will benefit from social post templates. CNG currently uses Claude (via BB) for top-level FT posts; group admins could be offered a similar workflow via support resources. This is **Phase D** — not an immediate requirement.

---

## 11. Admin Interfaces

### 11.1 Site admin (`/admin/` — migrated from `/staff/`)

| Existing route | New route | Status |
|---|---|---|
| `staff/index.tsx` | `admin/index.tsx` | Keep; add group stats to dashboard |
| `staff/login.tsx` | `admin/login.tsx` → `/login` | Migrate to shared Supabase auth |
| `staff/emails/` | `admin/email/` | Keep; extend for FT-wide newsletter |
| `staff/members/` | `admin/members/` | Keep; add group membership view; bulk import |
| `staff/events/` | `admin/events/` | Keep; extend with group filter |
| `staff/_middleware.ts` | `admin/_middleware.ts` | Update to Supabase session + site role check |
| `staff/_layout.tsx` | `admin/_layout.tsx` | Keep; update branding |

**New site admin routes:**
- `admin/groups/index.tsx` — list all groups (pending/active/archived); approve/decline
- `admin/groups/[slug].tsx` — group detail: members, events, email history, status controls
- `admin/content/` — manage blog_articles, site_resources, event_slideshows metadata

### 11.2 Group admin (`/groups/[slug]/admin/`)

Group-scoped; accessible to `group_owner` and `group_admin` only (enforced by `_middleware.ts` checking `group_memberships`).

- `admin/index.tsx` — dashboard: member count, upcoming events, recent activity
- `admin/members/` — list, invite (tokenised link), bulk import (CSV), role change, remove
- `admin/events/` — create, edit, publish events
- `admin/events/[id]/` — event detail and management
- `admin/email/` — compose, send test, send to group; email history
- `admin/materials/` — generate and download promotional materials
- `admin/settings/` — name, description, cover image, visibility, tags
- `admin/support/` — downloadable admin support materials

### 11.3 Member self-service (`/account/`)

- `account/index.tsx` — display name, email, password, notification preferences
- `account/groups/` — my groups; leave group; email opt-in per group
- `account/data/` — export all personal data as JSON (GDPR right of access)
- `account/delete/` — account deletion (anonymises membership records)

---

## 12. Legal & Privacy (International)

### 12.1 Applicable frameworks

Design to **GDPR** standard (highest bar) and compliance with other frameworks follows.

| Framework | Jurisdiction | Key requirement |
|---|---|---|
| GDPR | EU/EEA | Consent, right to erasure, data portability |
| UK GDPR | UK | Post-Brexit equivalent |
| Australian Privacy Act | Australia | APP principles, breach notification |
| CASL | Canada | Express consent for commercial email |
| CAN-SPAM | USA | Unsubscribe mechanism, honest sender |
| CCPA | California | Right to know, delete, opt out of sale |

### 12.2 Data requirements

**Consent:**
- All email opt-ins logged in `email_consents` (timestamp, IP, source, checkbox text shown)
- Imported members' first email explains how they were added and provides unsubscribe
- Separate consent for group emails and FT newsletter (Global group membership)

**Data subject rights (implement at Phase A launch):**
- Right to access: `/account/data/` — export personal data as JSON
- Right to erasure: `/account/delete/` — anonymises records
- Right to rectification: `/account/` — edit name, email
- Right to object: unsubscribe links in all emails + `/account/groups/` opt-out controls

**Data processing agreements:**
- Supabase DPA: sign before storing personal data
- Resend DPA: sign before sending emails with personal data

**Breach notification:**
- Document response procedure before launch
- GDPR: 72-hour notification to supervisory authority if breach affects EU residents

### 12.3 Privacy Policy & Terms of Service

**Required before any group feature goes live:**

- `/privacy` — Privacy Policy (what data, why, retention, third-party processors, international transfers, rights)
- `/terms` — Terms of Service for group founders (CoC agreement, content guidelines, FT's rights to suspend)

Both pages currently missing from Phase 1 navigation — add to footer.

### 12.4 Minimum age

16 years (GDPR Article 8 standard). Age confirmation checkbox on signup. No verification — standard practice at this scale.

---

## 13. Governance & Moderation

### Code of Conduct

Group founders agree to CoC on application. Published at `/groups/code-of-conduct`.

Key provisions:
- No political or partisan framing
- No doom-framing without action
- Honest about uncertainty; no invented statistics
- No harassment or personal attacks
- Refer media enquiries to FT admin
- AI-assisted content is fine; AI-generated content presented as original is not

### Escalation path

| Concern | First response | Escalation |
|---|---|---|
| Member behaviour | Group admin removes | FT site admin |
| Admin behaviour | FT site admin | CNG |
| Group going rogue | Site admin suspends group | CNG decides |
| Misinformation | Site admin warning | Suspend on repeat |
| Media enquiry | Group admin refers to CNG | CNG handles |

### Site admin controls (via `/admin/groups/`):
- Suspend group (blocks all activity, members notified)
- Archive group (graceful wind-down)
- Remove member from any group
- Transfer ownership
- Override group settings

### Group admin controls:
- Remove member from their group
- Ban member (cannot rejoin without admin approval)
- Set group to private temporarily
- Cannot access other groups' data or FT-wide data

---

## 14. Implementation Phasing

### Immediate (this week — no build required)
- [ ] Create Resend Audience: "Tumbarumba Community"
- [ ] Add emails from event sign-up sheet manually
- [ ] Send follow-up / welcome email to Tumba attendees

### Phase A — Foundation
_Supabase + Auth + Groups MVP_

- [ ] Create `supabase/SUPABASE.md` (schema, RLS rules, env vars, migration conventions)
- [ ] Supabase project setup (Frankfurt region, auth config, email templates)
- [ ] `@supabase/supabase-js` added to `site/deno.json`
- [ ] Migrate `routes/staff/` → `routes/admin/`; update `_middleware.ts` to Supabase session + site role
- [ ] Auth routes: `/login`, `/logout`, `/signup`, `/auth/callback` (magic link handler)
- [ ] Member self-service: `/account/` (name, email, password, age confirmation)
- [ ] DB migrations: all tables from §5 with RLS enabled
- [ ] Seed: Global group (`ft-global`), CNG as `site_owner`, CNG as `group_owner` of Global group
- [ ] Migrate `data/events/*.yaml` → `group_events` (group_id = Global group)
- [ ] Migrate `data/resources.ts` → `site_resources`
- [ ] Migrate `data/series.ts` → `blog_series`
- [ ] Create `blog_articles` metadata rows from existing blog markdown filenames
- [ ] Create `event_slideshows` metadata rows from existing `.tsx` files
- [ ] Update all routes that read from `data/` to read from Supabase instead
- [ ] Tumbarumba group created (admin fast-path); CNG as group_owner
- [ ] Bulk import: CSV upload → `group_memberships` (`source: imported`) for Tumba
- [ ] Welcome email for imported members (first email with consent/unsubscribe)
- [ ] `/groups/` browse page (active public groups)
- [ ] `/groups/[slug]/` public group page
- [ ] `/groups/start` application form + approval email to CNG
- [ ] `/admin/groups/` site admin group management (approve, list, detail)
- [ ] Supabase Storage: buckets created with RLS policies
- [ ] `/privacy` and `/terms` pages (content to be written)
- [ ] Email consent logging in `email_consents`

### Phase B — Group Management & Communication
_Prerequisite: Phase A complete; at least 2 active groups_

- [ ] `/groups/[slug]/admin/` dashboard and all sub-routes
- [ ] Group email composer (adapted from `/admin/email/`; includes send-test to composer)
- [ ] `email_sends` logging
- [ ] Resend unsubscribe webhook → `email_opt_in = false`
- [ ] Member invite via tokenised email link (expires 7 days)
- [ ] Group events: create, publish, manage (one-off)
- [ ] Event registrations scoped to group events
- [ ] `event_reminder_logs` for multi-reminder tracking
- [ ] Promotional material generation: HTML templates, token substitution, Storage save
  - Event handout, event poster, "Join our group" flyer
- [ ] QR code integration in templates
- [ ] `/groups/[slug]/admin/support/` with downloadable support materials
- [ ] `/account/groups/` — member group management + email opt-out per group
- [ ] `/account/data/` — GDPR data export
- [ ] `/account/delete/` — account deletion with anonymisation
- [ ] Location search on `/groups/` (Postgres full-text)
- [ ] `visibility: 'featured'` events appear on main FT events feed
- [ ] `/admin/content/` — manage blog_articles, site_resources, event_slideshows metadata

### Phase C — Growth Features
_Prerequisite: Phase B complete; 5+ active groups_

- [ ] Recurring group events (iCal RRULE; instance generation)
- [ ] Map view on `/groups/` (Leaflet.js + PostGIS proximity query)
- [ ] Geographic hierarchy UI (parent/child group relationships)
- [ ] Server-side PDF generation (Puppeteer OR pdf-lib template replacement — evaluate at time)
- [ ] Social card generation (webp export)
- [ ] Admin analytics: member growth, event attendance, email engagement stats
- [ ] "Groups near you" suggestion on FT event registration
- [ ] `/groups/code-of-conduct` public page
- [ ] Site admin can cross-post FT-wide events to selected groups
- [ ] Slideshow token substitution (`{{group_name}}`, `{{event_date}}` in `.tsx` files)
- [ ] Inactivity detection and nudge emails
- [ ] Ownership transfer flow

### Phase D — Platform Maturity

- [ ] Non-geographic group full support (Red Cross pilot etc.)
- [ ] Group event series (recurring template management UI)
- [ ] Member profile (optional bio; opt-in only)
- [ ] Email digest: weekly activity summary option for members
- [ ] Multi-timezone event display for international groups
- [ ] Group admin social post templates / AI-assisted post generation
- [ ] Group-level Plausible analytics
- [ ] Inter-admin community tool evaluation (Slack replacement assessment)

---

## 15. Memory & Documentation Updates (post-finalisation)

The following BB memory and documentation files will need updating once Phase A is underway:

| File | Update required |
|---|---|
| `events.md` | Replace YAML-based event process with Supabase + `/admin/events/` workflow |
| `futuretogether-progress.md` | Add local groups progress tracking |
| `GUIDELINES.md` | Update Phase 1 checklist; add local groups to Phase 2; update nav if needed |
| `supabase/SUPABASE.md` | New file (create in Phase A) |
| `site/deno.json` | Add Supabase client import |

Memory file updates should be done at the start of each phase, not before.

---

## 16. Open Decisions

| # | Question | Recommendation | Status |
|---|---|---|---|
| 1 | Blog content: markdown in git + DB metadata? | Yes — preserve authoring workflow | ✅ Confirmed |
| 2 | Slideshow content: .tsx in git + DB metadata? | Yes; Phase C adds token substitution | ✅ Confirmed |
| 3 | PDF generation approach | Start with print-to-PDF; evaluate Option C (pdf-lib) vs Option A (Puppeteer) in Phase C | ✅ Confirmed |
| 4 | Supabase region | EU Frankfurt | ✅ Confirmed |
| 5 | Group email from-address | `group-{slug}@futuretogether.community` | ✅ Confirmed |
| 6 | Minimum age | 16 years | ✅ Confirmed |

All open decisions resolved. No blockers to Phase A.

---

## 17. Out of Scope

- **Monetisation:** FT is always free — no paywall, premium tiers, or paid features
- **Political/partisan content:** FT remains agnostic on politics, corporate positioning, and religion
- **BB promotion:** Low-key attribution is fine; no promotional placement
- **Custom group domains:** (e.g. `tumbarumba.futuretogether.community`) — out of scope; can revisit
- **Third-party analytics sharing:** No group or member data shared with third parties
- **AI-originated content:** AI-assisted content that clarifies the author's voice is fine; AI-generated content presented as original human writing is not
- **Paywall or premium features for groups**
- **Real-time group chat:** Not email; out of scope
- **Video hosting:** Use existing YouTube/Jitsi links
- **Group-level Stripe or payment integration**

---

_Document: `support/local-groups-plan.md` — update as decisions are made and phases progress._  
_Next action: CNG sign-off → create Beads epics for Phase A._
