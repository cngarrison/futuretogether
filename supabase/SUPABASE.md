# Future Together — Supabase Guidelines

> **Scope:** Ongoing reference — naming conventions, RLS rules, roles, and design decisions.  
> **Table schemas:** See [`TABLE_REFERENCE.md`](./TABLE_REFERENCE.md). For canonical field definitions use the **Supabase MCP tools** (preferred), or read [`migrations/`](./migrations/) if MCP is unavailable.  
> **RLS policy patterns:** See [`RLS_PATTERNS.md`](./RLS_PATTERNS.md).  
> **Storage buckets + access policies:** See [`STORAGE.md`](./STORAGE.md).  
> **One-time project setup:** See [`PROJECT_SETUP.md`](./PROJECT_SETUP.md) for project config, DPA checklist, migration order, and seed data.  
> **Route structure + auth middleware:** See [`site/ROUTES.md`](../site/ROUTES.md).  
> **Supabase/Postgres skill:** Load `supabase-postgres-best-practices` for canonical guidance. Most relevant references for this file: `security-rls-basics.md`, `security-rls-performance.md`, `security-privileges.md`, `schema-primary-keys.md`, `schema-data-types.md`, `schema-constraints.md`, `schema-lowercase-identifiers.md`.

---

## 1. Naming Conventions

### 1.1 Namespace-first table naming

All table names use a **namespace prefix that comes first**. This keeps related tables grouped alphabetically, improves autocomplete, and makes schema intent clear at a glance.

| Namespace | Tables |
|---|---|
| `blog_` | `blog_articles`, `blog_series` |
| `email_` | `email_consents`, `email_sends` |
| `event_` | `event_registrations`, `event_slideshows` , `event_reminder_logs` |
| `group_` | `group_events`, `group_memberships`, `group_programs` |
| `site_` | `site_resources` |
| `user_` | `user_platform_roles` |
| *(none)* | `groups`, `profiles` — top-level entities; unambiguous without prefix |

**Do not** use unqualified names like `articles`, `events`, `memberships`, `roles` — they become ambiguous and unsortable as the schema grows.

### 1.2 Namespace-first field naming within tables

Apply a namespace prefix to fields when a table contains multiple fields in the same semantic group. The namespace comes first, so fields sort and group together.

```sql
-- ✓ Correct — namespace first; groups alphabetically; unambiguous next to the group's own `name`
location_country, location_name, location_region, location_state, location_suburb
email_consent_at, email_consent_ip, email_opt_in

-- ✗ Wrong — generic names; collide with other fields; don't group on sort
country, name, region, state, suburb
consent_at, consent_ip, opt_in
```

Unambiguous single-domain fields need no prefix: `id`, `slug`, `name`, `status`, `title`, `created_at`, `updated_at`.

### 1.3 Primary keys

> Skill: `schema-primary-keys.md`

```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
```

Always bare `id` — Supabase client codegen, PostgREST, and TypeScript types all assume this convention.

### 1.4 Foreign keys

- Standard: `{referenced_table_singular}_id` → `group_id`, `profile_id`, `event_id`
- Self-referential / disambiguated: `parent_group_id`, `created_by_id`, `sent_by_id`, `organiser_id`, `approved_by_id`

### 1.5 Timestamps and booleans

```sql
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()
```

Booleans use positive framing: `is_published`, `is_active`, `email_opt_in` — not `not_published`, `disabled`.

### 1.6 Enums as `text` + CHECK

> Skill: `schema-data-types.md`, `schema-constraints.md`

Never use Postgres `ENUM` types. Use `text` with a `CHECK` constraint:

```sql
status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','cancelled'))
```

Adding a value to a Postgres enum requires `ALTER TYPE`, which cannot run inside a transaction. `CHECK` constraints update via a standard `ALTER TABLE ... DROP CONSTRAINT ... ADD CONSTRAINT` with zero downtime.

---

## 2. RLS — Absolute Requirements

### Rule: Every table MUST have RLS enabled

> Skill: `security-rls-basics.md`

```sql
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
```

This is non-negotiable. A table with RLS enabled but no policies is **inaccessible by default** — Supabase blocks all access when no policy matches. This is the intended safe state while policies are being written.

**No table may be deployed without:**
1. `ENABLE ROW LEVEL SECURITY`
2. At least one policy
3. Explicit `GRANT` statements (see §2.2)

### 2.1 Auth function performance: always use `(SELECT auth.uid())`

> Skill: `security-rls-performance.md`

Wrap all `auth.*` function calls in `(SELECT ...)` so they are evaluated **once per query**, not once per row.

```sql
-- ✓ Correct — sub-select is a constant; evaluated once for the whole query
USING (profile_id = (SELECT auth.uid()))

-- ✗ Wrong — function called once per row; causes full table scan cost
USING (profile_id = auth.uid())
```

This applies to all auth functions: `auth.uid()`, `auth.jwt()`, `auth.role()`, `auth.email()`.

**Exception:** Only omit the `SELECT` wrapper when per-row evaluation is genuinely required by the policy logic. This is rare — document the reason with a comment.

### 2.2 Baseline REVOKE / GRANT

> Skill: `security-privileges.md`

Apply once at schema setup (see `migrations/001_schema_baseline.sql`). Per-table grants selectively restore access within the RLS boundary.

```sql
-- Revoke default public access
REVOKE ALL ON SCHEMA public FROM anon;
REVOKE ALL ON SCHEMA public FROM authenticated;

-- Grant schema usage (required to access any table)
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- anon role: public-read tables only
GRANT SELECT ON TABLE groups TO anon;
GRANT SELECT ON TABLE group_programs TO anon;
GRANT SELECT ON TABLE group_events TO anon;
GRANT SELECT ON TABLE site_resources TO anon;
GRANT SELECT ON TABLE blog_articles TO anon;
GRANT SELECT ON TABLE blog_series TO anon;
GRANT SELECT ON TABLE event_slideshows TO anon;

-- authenticated role: full CRUD where RLS policies permit
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE group_memberships TO authenticated;
GRANT SELECT ON TABLE group_programs TO authenticated;  -- INSERT/UPDATE/DELETE via service role only
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE group_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE event_registrations TO authenticated;
-- (repeat for all remaining tables; keep in sync with 001_schema_baseline.sql)
```

### 2.3 Policy patterns

See [`RLS_PATTERNS.md`](./RLS_PATTERNS.md) for reusable templates: public read, own record, group member read, group admin write, site admin all, own membership, own registration, authenticated insert.

---

## 3. Storage

See [`STORAGE.md`](./STORAGE.md) for bucket structure, access matrix, and material generation flow.

---

## 4. Environment Variables

```bash
# .env (local) — never commit this file
# See .env.example for the full template
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>  # safe for client-side; RLS enforced
SUPABASE_SECRET_KEY=<secret-key>            # server-only; bypasses RLS — treat as root
```

**`SUPABASE_SECRET_KEY` rules:**
- Server-side only: Fresh routes, API handlers, migration scripts
- Never in islands, client JS, or any browser-reachable code
- Required for: seeding, admin operations that bypass RLS, webhook handlers

---

## 5. Roles

### Platform-level (stored in `user_platform_roles`)

| Role | Access |
|---|---|
| `site_owner` | Full platform access; non-delegatable; CNG only |
| `site_admin` | Approve/suspend groups; manage all members, content, email; can act as admin in any group |

### Group-level (stored in `group_memberships.role`)

| Role | Access |
|---|---|
| `group_owner` | All admin functions + ownership transfer + archive group |
| `group_admin` | Manage members, events, email, materials, settings |
| `member` | View group events (per visibility); receive emails (if opted in); register for events |

See [`site/ROUTES.md`](../site/ROUTES.md) for the corresponding middleware pattern and full route structure.

---

## 6. Migration File Conventions

- **One concern per file** — schema, RLS, and seed are separate migration files
- **Never modify a committed migration** — create a new numbered file instead
- **Run order matters** — schema before RLS; see [`PROJECT_SETUP.md`](./PROJECT_SETUP.md) for the full ordered file list
- **Seed migrations** guard with `ON CONFLICT DO NOTHING`
- **Idempotency** — use `CREATE TABLE IF NOT EXISTS`, `CREATE POLICY IF NOT EXISTS` where possible

---

## 8. Settings Table

The `settings` table is a key-value store for platform configuration values that need to be:
- Consistent across app restarts (unlike module-level variables)
- Accessible within database triggers and functions (unlike env vars)
- Environment-specific (unlike code constants)

### Access pattern

Always use the provided functions — never query the table directly:

```sql
-- Read
SELECT public.get_setting('global_group_id');   -- returns text | NULL

-- Write (service role only in practice)
SELECT public.set_setting('global_group_id', '<uuid>', 'UUID of ft-global group');
```

Both functions are `SECURITY DEFINER` with `SET search_path = public`.

### App-side access

For app code needing a settings value:
- Import `getGlobalGroupId()` from `@/utils/db/settings.ts` — lazy-cached per process
- For slug-based queries (e.g. filtering `ft-global` from group browse), use `FT_GLOBAL_GROUP_SLUG` from `@/utils/constants.ts` — no DB round-trip needed

### Seeded values

| Key | Value | Set by |
|---|---|---|
| `global_group_id` | UUID of `ft-global` group | `20260612000012_seed_global_group.sql` |

---

## 7. Key Design Decisions

| Decision | Rationale |
|---|---|
| `group_programs` / `group_events` split | `group_programs` is the template/programme record (title, description, scheduling defaults, `recurrence_rule`). `group_events` is the individual occurrence (date, location, capacity overrides). Keeps scheduling logic off the base record and supports recurring programmes with multiple instances. |
| `recurrence_rule` on `group_programs` | iCal RRULE text (e.g. `FREQ=MONTHLY;BYDAY=3TU`), nullable. Stored for future calendar/scheduling use; not yet enforced by the app. |
| `file_path` columns (`blog_articles`, `event_slideshows`) | Relative path within the git repo (e.g. `data/slideshows/tumbarumba.tsx`). DB stores metadata only; content files stay in git. Route loads DB metadata + filesystem content. Future: may become a Storage bucket path if CMS editing is added. |
| Global group instead of `NULL group_id` | Referential integrity throughout; newsletter opt-in = membership; uniform event queries; simpler RLS |
| FT newsletter = Global group opt-in | No `ft_email_opt_in` column on `profiles`; single opt-in model for all group emails |
| Enums as `text` + CHECK | See §1.6 |
| Bare `id` PK | Supabase codegen, PostgREST, TypeScript types all assume `id` |
| Single `public` schema | PostgREST exposes `public` by default; protection via RLS + GRANT, not schema separation |
| Deno KV retained for slideshows | Ephemeral WebSocket session state — not persistent data; Supabase Realtime is heavier than needed |
| Blog/slideshow content in git | Preserves authoring workflow; DB stores metadata only (slug, title, published_at, etc.) |
| EU Frankfurt region | GDPR baseline for international audience; all personal data stays in EU |
| `settings` table for platform config | UUID and other env-specific values need DB-level access (triggers) and cross-environment consistency; a KV table with SECURITY DEFINER functions is cleaner than hardcoded constants |
