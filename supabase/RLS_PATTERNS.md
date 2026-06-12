# Future Together — RLS Policy Patterns

> Reusable policy templates for this project. All patterns follow the rules in [`SUPABASE.md`](./SUPABASE.md) — particularly the `(SELECT auth.uid())` performance requirement (§2.1) and the RLS absolute requirement (§2).  
> Skill references: `security-rls-basics.md` (RLS fundamentals), `security-rls-performance.md` (the `SELECT` wrapper rule and subquery optimisation).

Add new patterns here as tables get policies. Group related patterns together; note which tables they apply to.

---

## Policy naming convention

`{scope}_{action}` — e.g. `public_read`, `own_record_update`, `group_member_read`, `site_admin_all`.

---

## Public read

Rows readable by anyone (including unauthenticated). Used on: `groups`, `group_programs`, `group_events`, `site_resources`, `blog_articles`, `blog_series`, `event_slideshows`.

```sql
CREATE POLICY "public_read"
  ON groups FOR SELECT
  USING (status = 'active' AND visibility = 'public');
```

For `group_events` — both `published` (upcoming) and `completed` (past) events are publicly visible.
`cancelled` and `draft` events are excluded:

```sql
CREATE POLICY "public_read"
  ON group_events FOR SELECT
  USING (
    status IN ('published', 'completed')
    AND visibility IN ('public', 'featured')
  );
```

For `group_programs` (anon sees published+public only; authenticated also sees unlisted):

```sql
-- anon
CREATE POLICY "programs_anon_select"
  ON group_programs FOR SELECT TO anon
  USING (status = 'published' AND visibility = 'public');

-- authenticated
CREATE POLICY "programs_authenticated_select"
  ON group_programs FOR SELECT TO authenticated
  USING (status = 'published' AND visibility IN ('public', 'unlisted'));
```

---

## Own record

User can only read or update their own row. Used on: `profiles`.

```sql
CREATE POLICY "own_record_read"
  ON profiles FOR SELECT
  USING (id = (SELECT auth.uid()));

CREATE POLICY "own_record_update"
  ON profiles FOR UPDATE
  USING (id = (SELECT auth.uid()));
```

---

## Group member read

Members of a group can read its content; public/featured rows are open to all. Used on: `group_events`.

```sql
CREATE POLICY "group_member_read"
  ON group_events FOR SELECT
  USING (
    visibility = 'public'
    OR EXISTS (
      SELECT 1 FROM group_memberships gm
      WHERE gm.group_id = group_events.group_id
        AND gm.profile_id = (SELECT auth.uid())
        AND gm.status = 'active'
    )
  );
```

---

## Group admin write

INSERT and UPDATE require `group_admin` or `group_owner` role. For DELETE, apply the same `EXISTS` check as UPDATE. Used on: `group_events`, `group_memberships` (admin changes).

```sql
CREATE POLICY "group_admin_insert"
  ON group_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_memberships gm
      WHERE gm.group_id = group_events.group_id
        AND gm.profile_id = (SELECT auth.uid())
        AND gm.role IN ('group_admin', 'group_owner')
        AND gm.status = 'active'
    )
  );

CREATE POLICY "group_admin_update"
  ON group_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_memberships gm
      WHERE gm.group_id = group_events.group_id
        AND gm.profile_id = (SELECT auth.uid())
        AND gm.role IN ('group_admin', 'group_owner')
        AND gm.status = 'active'
    )
  );
```

---

## Site admin full access

Bypasses all other restrictions. Apply to every table as a superuser catch-all.

```sql
CREATE POLICY "site_admin_all"
  ON groups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_platform_roles upr
      WHERE upr.profile_id = (SELECT auth.uid())
        AND upr.role IN ('site_admin', 'site_owner')
    )
  );
```

---

## Own membership

Members can read their own membership row and update their own preferences (e.g. `email_opt_in`). Role changes must go through an admin.

```sql
CREATE POLICY "own_membership_read"
  ON group_memberships FOR SELECT
  USING (profile_id = (SELECT auth.uid()));

CREATE POLICY "own_membership_update"
  ON group_memberships FOR UPDATE
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));
  -- role changes are admin-only; members update fields like email_opt_in only
```

---

## Own registration

Authenticated users can read and update (e.g. cancel) their own event registrations.

```sql
CREATE POLICY "own_registration_read"
  ON event_registrations FOR SELECT
  USING (profile_id = (SELECT auth.uid()));

CREATE POLICY "own_registration_update"
  ON event_registrations FOR UPDATE
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));
```

---

## Authenticated insert (self-registration)

Authenticated users can register themselves for events; guest registrations (no account) also permitted.

```sql
CREATE POLICY "authenticated_insert"
  ON event_registrations FOR INSERT
  WITH CHECK (
    profile_id = (SELECT auth.uid())
    OR profile_id IS NULL  -- guest registration (unauthenticated)
  );
```
