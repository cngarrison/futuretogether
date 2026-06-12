# Future Together — Table Quick Reference

> **For canonical field definitions**, use the **Supabase MCP tools** (preferred), or read [`migrations/`](./migrations/) directly if MCP is unavailable.  
> This file is a token-efficient reference for writing RLS policies, FK constraints, and middleware logic. Full schema rationale and naming conventions are in [`SUPABASE.md`](./SUPABASE.md).  
> **Skill references:** `schema-foreign-key-indexes.md` — FK columns do **not** get indexes automatically; add them explicitly in migrations. `schema-primary-keys.md` for PK design rationale.

All tables: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` unless noted. Timestamps (`created_at`, `updated_at`) and purely descriptive text fields omitted.

---

## Relationships at a Glance

```
auth.users  (Supabase managed)
  └── profiles  (id = auth.users.id)
        ├── user_platform_roles  (profile_id)
        └── group_memberships  (profile_id)
              └── groups  (group_id)
                    ├── groups  (parent_group_id — self-referential)
                    ├── group_programs  (group_id)
                    │     └── group_events  (program_id)
                    │           ├── event_registrations  (event_id)
                    │           │     └── event_reminder_logs  (registration_id)
                    │           └── event_slideshows  (event_id)
                    ├── email_sends  (group_id)
                    └── email_consents  (group_id)

blog_series
  └── blog_articles  (series_id)

site_resources  (no FK to other project tables)
```

---

## `settings`

```sql
key         text PRIMARY KEY
value       text NOT NULL
description text
updated_at  timestamptz NOT NULL DEFAULT now()
```

> Platform key-value store. Access via `get_setting(key)` / `set_setting(key, value, description)` functions (both `SECURITY DEFINER`). No direct table access for anon/authenticated roles.
> Seeded values: `global_group_id` — UUID of the `ft-global` group, used by the `handle_new_auth_user` trigger.

---

## `profiles`

> Public mirror of `auth.users`. Populated automatically by the `handle_new_auth_user()` trigger on signup. Application code should not insert directly.

```sql
id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
email           text NOT NULL UNIQUE
-- Captured from raw_user_meta_data by handle_new_auth_user() trigger on signup:
name_first        text
name_last         text
age_confirmed     boolean DEFAULT false
location          text                           -- free-text 'City or region' (join form)
heard_from        text                           -- acquisition source (join form select)
interests         text[]                         -- topics of interest (join form multi-select)
wants_to_organise boolean DEFAULT false          -- wants to start a local group
has_password      boolean DEFAULT false          -- true once user sets a password via /account/
```

> `location` is unstructured free text; not geocoded. Structured `location_*` fields are a Phase C/D addition.  
> `interests` supports GIN-indexed containment queries: `interests @> ARRAY['AI safety and alignment']`.  
> `state.profile` in Fresh routes (type `UserProfile`) selects: `id, email, name_first, name_last, has_password, location, wants_to_organise`.

---

## `user_platform_roles`

```sql
profile_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
role        text CHECK (role IN ('site_owner','site_admin'))
UNIQUE(profile_id, role)
```

---

## `groups`

```sql
slug             text UNIQUE NOT NULL
group_type       text CHECK (group_type IN ('geographic','non-geographic','global'))
tier             text CHECK (tier IN ('local','regional','state','national','global','thematic'))
parent_group_id  uuid REFERENCES groups(id)  -- NULL only for ft-global
approved_by_id   uuid REFERENCES profiles(id)
status           text DEFAULT 'pending' CHECK (status IN ('pending','active','archived','suspended'))
visibility       text DEFAULT 'public'  CHECK (visibility IN ('public','unlisted','private'))
```

> The Global group (`slug = 'ft-global'`) is the only group with `parent_group_id = NULL`. All other groups descend from it.

---

## `group_memberships`

```sql
group_id       uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE
profile_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
role           text DEFAULT 'member' CHECK (role IN ('group_owner','group_admin','member'))
status         text DEFAULT 'active' CHECK (status IN ('active','pending','banned'))
email_opt_in   boolean NOT NULL DEFAULT true
source         text CHECK (source IN ('self-joined','invited','imported','admin-added'))
invited_by_id  uuid REFERENCES profiles(id)
UNIQUE(group_id, profile_id)
```

> FT newsletter opt-in = `group_memberships` row where `group_id = ft-global` and `email_opt_in = true`.

---

## `group_programs`

> **Programme record** — the template/descriptor for an event type. Holds title, description, location, timing, and recurring rule. All fields are program-level values; individual `group_events` occurrences inherit these and can override any field per-event.

```sql
slug              text NOT NULL
group_id          uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE
title             text NOT NULL
description       text
program_type      text NOT NULL DEFAULT 'one-off'
                    CHECK (program_type IN ('one-off','recurring'))
recurrence_rule   text              -- iCal RRULE e.g. 'FREQ=MONTHLY;BYDAY=3TU' (nullable)
-- Location (program-level value; events override per-occurrence)
location_type     text CHECK (location_type IN ('physical','online','hybrid'))
location_name     text
location_address  text
meeting_link      text
-- Timing/capacity (events override; code falls back to 60min / 30cap / 1day if both null)
duration_minutes            integer
capacity                    integer
registration_deadline_days  integer
presented_by      text
sponsored_by      text
poster_image_path text
slideshow_url     text
more_info_path    text              -- e.g. 'data/events/more-info/foo.md'
topics            text[]
resources         jsonb NOT NULL DEFAULT '[]'
visibility        text NOT NULL DEFAULT 'public'
                    CHECK (visibility IN ('public','unlisted','private'))
status            text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','published','archived'))
UNIQUE(group_id, slug)
```

---

## `group_events`

> **Occurrence record** — a single scheduled instance of a `group_programs` programme. Nullable fields inherit from the parent programme when null; code-level fallbacks apply when both are null (duration=60min, capacity=30, deadline=1day).

```sql
slug                        text NOT NULL
group_id                    uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE
program_id                  uuid NOT NULL REFERENCES group_programs(id)
event_date                  timestamptz               -- nullable; the occurrence date/time
timezone                    text NOT NULL DEFAULT 'Australia/Sydney'
duration_minutes            integer                   -- nullable; falls back to program default
registration_deadline_days  integer                   -- nullable; falls back to program default
title                       text                      -- nullable; falls back to program.title
location_type               text CHECK (location_type IN ('physical','online','hybrid'))
location_name               text
location_address            text
meeting_link                text
capacity                    integer                   -- nullable; falls back to program default
is_registration_required    boolean NOT NULL DEFAULT true
organiser_id                uuid REFERENCES profiles(id)
created_by_id               uuid REFERENCES profiles(id)
visibility                  text NOT NULL DEFAULT 'public'
                              CHECK (visibility IN ('public','unlisted','private'))
status                      text NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','published','cancelled','completed'))
UNIQUE(group_id, slug)
```

> FT-wide events (e.g. `discuss-our-future`) have `group_id` pointing to the Global group.

---

## `event_registrations`

```sql
event_id    uuid NOT NULL REFERENCES group_events(id) ON DELETE CASCADE
profile_id  uuid REFERENCES profiles(id)  -- NULL for unauthenticated guest registrations
email       text NOT NULL
name_first  text
name_last   text
status      text DEFAULT 'registered' CHECK (status IN ('registered','cancelled','attended'))
source      text DEFAULT 'web' CHECK (source IN ('web','admin-added'))
```

---

## `event_reminder_logs`

```sql
registration_id  uuid NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE
reminder_type    text NOT NULL  -- '1-day' | '1-hour' | 'custom'
```

---

## `blog_series`

```sql
slug        text UNIQUE NOT NULL
title       text NOT NULL
description text
part_count  integer
```

---

## `blog_articles`

```sql
slug          text UNIQUE NOT NULL
title         text NOT NULL
author        text
excerpt       text
published_at  timestamptz
status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published'))
tags          text[]
og_image      text
file_path     text            -- relative path to .md content file in git, e.g. 'data/blog/my-post.md'
series_id     uuid REFERENCES blog_series(id)
series_part   integer
```

---

## `site_resources`

```sql
slug           text UNIQUE NOT NULL
title          text NOT NULL
resource_type  text CHECK (resource_type IN ('article','book','video','tool','guide'))
url            text
description    text
tags           text[]
is_featured    boolean NOT NULL DEFAULT false
sort_order     integer
category       text
```

---

## `event_slideshows`

```sql
slug              text UNIQUE NOT NULL
title             text NOT NULL
event_id          uuid REFERENCES group_events(id)
file_path         text NOT NULL   -- relative path to .tsx data file in git, e.g. 'data/slideshows/foo.tsx'
slide_count       integer
duration_minutes  integer
description       text
is_published      boolean NOT NULL DEFAULT false
```

---

## `email_sends`

```sql
group_id    uuid REFERENCES groups(id)
sent_by_id  uuid NOT NULL REFERENCES profiles(id)
```

---

## `email_consents`

```sql
profile_id    uuid NOT NULL REFERENCES profiles(id)
consent_type  text CHECK (consent_type IN ('group_email','ft_newsletter'))
group_id      uuid REFERENCES groups(id)
granted       boolean NOT NULL
source        text  -- 'signup'|'join-group'|'imported'|'admin-added'|'unsubscribe'
```
