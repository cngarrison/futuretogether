# Future Together — Route Structure

> Reference for route layout, auth middleware, and API structure.\
> Supabase auth details: [`supabase/SUPABASE.md`](../supabase/SUPABASE.md).\
> Role definitions:
> [`supabase/SUPABASE.md §5`](../supabase/SUPABASE.md#5-roles).

---

## Auth middleware

Two middleware files with separate, clean scopes:

```
routes/
  admin/
    _middleware.ts      # checks user_platform_roles for site_admin or site_owner
  groups/
    [slug]/
      admin/
        _middleware.ts  # resolves ctx.params.slug → group_id
                        # checks group_memberships for group_admin or group_owner
                        # passes ctx.state.membership to handlers
  api/
    admin/
      _middleware.ts    # site_admin check (mirrors routes/admin/)
    groups/
      [slug]/
        _middleware.ts  # group_admin check (mirrors routes/groups/[slug]/admin/)
```

Fresh v2 provides `ctx.params.slug` in middleware — enables the group-scoped
role check without an extra query layer.

---

## Full route structure

### Public routes

```
/                           # Home
/about
/events/[slug]/             # Event detail (FT-wide events; group events linked via group page)
/groups/                    # Browse all active public groups
/groups/start               # Group application form
/groups/[slug]/             # Public group page (events, member count, join)
/meetups/                   # Online meetup details and past resources
/meetups/slideshow          # Slideshow viewer
/privacy
/terms
/groups/code-of-conduct     # Phase C
```

### Auth routes

```
/login                      # Email/password + magic link
/logout
/signup
/auth/callback              # Magic link handler (Supabase redirect target)
```

### Member self-service

```
/account/                   # Display name, email, password, notification prefs
/account/groups/            # My groups; email opt-in per group; leave group
/account/data/              # GDPR: export personal data as JSON
/account/delete/            # GDPR: account deletion (anonymises records)
```

### Group admin (middleware: group_admin or group_owner)

```
/groups/[slug]/admin/           # Dashboard: member count, upcoming events, activity
/groups/[slug]/admin/members/   # List, invite, bulk import (CSV), role change, remove
/groups/[slug]/admin/events/    # Create, edit, publish events
/groups/[slug]/admin/events/[id]/
/groups/[slug]/admin/email/     # Compose, send test, send to group; history
/groups/[slug]/admin/materials/ # Generate promotional materials
/groups/[slug]/admin/settings/  # Name, description, cover image, visibility, tags
/groups/[slug]/admin/support/   # Downloadable admin support materials
```

### Site admin (middleware: site_admin or site_owner)

```
/admin/                         # Dashboard (migrated from /staff/)
/admin/groups/                  # All groups: approve, suspend, list
/admin/groups/[slug]/           # Group detail: members, events, email history, status
/admin/members/
/admin/events/
/admin/email/                   # FT-wide newsletter compose
/admin/content/                 # blog_articles, site_resources, slideshows metadata
```

> The `/staff/` prefix is being migrated to `/admin/` as part of ft-o1k.5.

### API routes

```
/api/groups/[slug]/...          # Group-scoped (same auth as group admin pages)
/api/admin/...                  # Site admin (same auth as /admin/ pages)
```

---

## Route precedence note

Fresh file routing: literal paths always take precedence over dynamic
`[slug].tsx`.

Example: `routes/groups/start.tsx` will always match `/groups/start` before
`routes/groups/[slug].tsx` can. This is intentional — ensure all literal route
files are created before the dynamic handler when adding new static paths under
a dynamic segment.

---

## Session handling

- Auth session stored as Supabase JWT in an httpOnly cookie (server-side)
- Session duration: 7 days default; 30 days with "remember me"
- Magic link redirects to `/auth/callback` which exchanges the token and sets
  the cookie
- Middleware reads the session cookie and validates via
  `supabase.auth.getUser()`
