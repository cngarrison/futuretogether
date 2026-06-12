# Future Together — Supabase Project Setup

> **One-time setup reference** — project configuration, DPA checklist, migration order, and seed bootstrap.  
> Ongoing conventions and RLS rules: see [`SUPABASE.md`](./SUPABASE.md).  
> **Skill references:** `conn-pooling.md` + `conn-limits.md` (configure connection pooling at project setup), `schema-foreign-key-indexes.md` (add FK indexes in migrations — not automatic), `query-missing-indexes.md` + `query-partial-indexes.md` (index strategy when writing schema migrations).

---

## 1. Project Configuration

| Setting | Value |
|---|---|
| Region | EU (Frankfurt) — `eu-central-1` |
| Auth methods | Email/password **and** magic link (both active simultaneously) |
| Session duration | 7 days default; 30 days with "remember me" |
| Schema | Single `public` schema — no custom schemas |
| Client | `@supabase/supabase-js` via `site/deno.json` imports |
| Auth session | Supabase JWT in httpOnly cookies (server-side session) |

### Why single `public` schema

Supabase PostgREST exposes `public` by default. Additional schemas require explicit `db_schema` config in `supabase/config.toml` and `schema` headers on every API call. Protection against unintended exposure is better achieved through strict RLS + explicit `GRANT` per table than through schema separation.

---

## 2. Pre-requisites Before Storing Personal Data

- [ ] Sign **Supabase DPA** (Data Processing Agreement) in the Supabase dashboard under Settings → Legal
- [ ] Sign **Resend DPA** before sending emails containing personal data
- [ ] Confirm project region is EU Frankfurt (`eu-central-1`) — required for GDPR baseline
- [ ] Document internal breach notification procedure (GDPR requires 72-hour notification to supervisory authority if a breach affects EU residents)

---

## 3. Migration Creation Order

Tables must be created in FK dependency order. RLS migrations follow their corresponding schema migration.

0. `settings` — no FKs; must exist before handle_new_auth_user trigger is defined
1. `blog_series` — no FKs to other project tables
2. `groups` — self-referential `parent_group_id`; add the FK as a separate `ALTER TABLE` after the table is created
3. `profiles` — references `auth.users`
4. `user_platform_roles` — references `profiles`
5. `group_memberships` — references `groups`, `profiles`
6. `group_programs` — references `groups`
7. `group_events` — references `groups`, `profiles`, `group_programs`
8. `event_registrations` — references `group_events`, `profiles`
9. `event_reminder_logs` — references `event_registrations`
10. `blog_articles` — references `blog_series`
11. `site_resources` — no FKs
12. `event_slideshows` — references `group_events`
13. `email_sends` — references `groups`, `profiles`
14. `email_consents` — references `profiles`, `groups`

---

## 4. Migration File List

Migration filenames use the Supabase CLI timestamp format: `YYYYMMDDHHmmss_description.sql`.
Never modify a committed migration — create a new numbered file instead.

```
supabase/migrations/
  20260612000001_schema_baseline.sql    -- REVOKE/GRANT baseline + update_updated_at() fn (run first)
  20260612000002_tables_core.sql        -- settings (KV store), blog_series, profiles (+auth trigger), user_platform_roles, groups
  20260612000003_tables_memberships.sql -- group_memberships
  20260612000004_tables_events.sql      -- group_events, event_registrations, event_reminder_logs
  20260612000005_tables_content.sql     -- blog_articles, site_resources, event_slideshows
  20260612000006_tables_comms.sql       -- email_sends, email_consents
  20260612000007_rls_profiles.sql       -- RLS: profiles, user_platform_roles
  20260612000008_rls_groups.sql         -- RLS: groups, group_memberships
  20260612000009_rls_events.sql         -- RLS: group_events, event_registrations, event_reminder_logs
  20260612000010_rls_content.sql        -- RLS: blog_articles, blog_series, site_resources, event_slideshows
  20260612000011_rls_comms.sql          -- RLS: email_sends, email_consents
  20260612000012_seed_global_group.sql  -- Seed: ft-global group + set global_group_id setting
  -- After seed: run scripts/onboard-site-owner.ts to create CNG's auth user + site_owner role
```

---

## 5. Seed Bootstrap

**The Global group must be seeded before any other data** — all groups and events require a valid `group_id`. The seed migration handles this automatically.

### Step 1: Run the seed migration

Apply `20260612000012_seed_global_group.sql` via Supabase CLI or dashboard SQL editor. This:
- Inserts the `ft-global` group
- Calls `set_setting('global_group_id', <uuid>)` so the `handle_new_auth_user` trigger can auto-enrol new users

### Step 2: Onboard the site owner

Run the onboarding script (requires `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in environment or `site/.env.local`):

```bash
deno run --allow-env --allow-net --allow-read scripts/onboard-site-owner.ts
```

This script:
- Creates (or locates) the auth.users record for `charlie@futuretogether.community`
- Grants `site_owner` platform role
- Grants `group_owner` role in ft-global

Optionally set `SITE_OWNER_PASSWORD` env var to create a password-enabled account. Without it, magic link is the only login method.

### Step 3: Seed content data (groups, programs, events, slideshows)

Run the content migration script from the `site/` directory:

```bash
cd site && deno task seed
```

This runs `scripts/migrate-content.ts` (requires `SUPABASE_URL` and `SUPABASE_SECRET_KEY`). It seeds:
- Local groups (e.g. Tumbarumba)
- `group_programs` records (programme templates)
- `group_events` occurrences linked to those programmes
- `event_slideshows` metadata
- `blog_articles`, `blog_series`, and `site_resources`

> **Note:** `group_programs` is not seeded via a SQL migration — it is populated by `migrate-content.ts`.

### Step 4: Additional groups (manual)

For groups not covered by the seed script, create via Supabase dashboard or future `/admin/groups/` route once Phase A is complete. Use the admin fast-path (bypasses approval flow).
