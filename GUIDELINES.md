---
title: Future Together — BB Project Guidelines
version: 1.1.0
created: 2026-02-18
updated: 2026-06-12
project: website-futuretogether
domain: futuretogether.community
---

# Future Together — BB Project Guidelines

Refer to `BEADS.md` as needed for guidance on using the inbuilt issue tracker. Use the `memory` tool for context and decisions from past collaborations, and use the `bd` (beads) CLI for knowing which issues are outstanding and recording progress of tasks.

## Project Purpose and Scope

This project builds and maintains the website for **Future Together** — a community platform and movement hub helping people understand and prepare for AI-driven societal change. The domain is `futuretogether.community`.

### Current Focus: Phase A — Supabase Foundation + Local Groups

Phase A is now the active development phase (epic `ft-o1k`). It includes:
- Supabase project setup (auth, schema, RLS, storage)
- Data migration from existing sources
- Local groups MVP — browse, join, group pages
- Route restructure (`/staff/` → `/admin/`)

### Phase 1 MVP (website)

Base website routes: `/` — `/meetups` — `/meetups/slideshow` — `/about` — `/join`

### Phase 2 (in progress / planned)

`/local-groups`, `/resources`, `/blog`, `/newsletter`

### Phase 3 (future)

`/community`, `/find-a-group`, `/start-a-group`, `/take-action`

### Out of Scope

- Beyond Better (beyondbetter.app) promotion beyond footer attribution
- Commercial features, paywalls, or premium tiers
- Political content or alignment

---

## Data Source

**Primary data source:** `working/website-futuretogether` (filesystem)  
**Root:** `/Users/cng/working/website-futuretogether`

### Directory Structure

```
working/website-futuretogether/
├── site/                        # Deno Fresh website (primary build target)
│   ├── routes/                  # Page routes (index.tsx, _app.tsx, etc.)
│   ├── components/              # Shared UI components
│   ├── islands/                 # Interactive Preact islands
│   ├── static/                  # Static assets (logo.svg, favicon.ico)
│   ├── assets/                  # CSS (styles.css — Tailwind entry point)
│   ├── ROUTES.md                # Route structure + auth middleware reference
│   └── deno.json                # Deno config, imports, tasks
├── supabase/                    # Supabase docs and migrations
│   ├── SUPABASE.md              # Naming conventions, RLS rules, roles, decisions
│   ├── TABLE_REFERENCE.md       # Quick schema reference (PKs, FKs, enum fields)
│   ├── RLS_PATTERNS.md          # Reusable RLS policy templates
│   ├── STORAGE.md               # Storage buckets, access matrix, material flow
│   ├── PROJECT_SETUP.md         # One-time: project config, DPA, migration order, seed
│   ├── .env.example             # Environment variable template
│   └── migrations/              # Numbered SQL migration files
├── support/                     # Active planning documents (reference only)
│   └── local-groups-plan.md     # Local groups feature plan (architecture, decisions)
├── jump-start/                  # Project brief documents (reference only — do not modify)
│   ├── project-brief.md
│   ├── brand-and-voice.md
│   ├── logo-brief.md
│   └── website-architecture.md
├── social-media/                # Source content and existing assets (reference only)
│   ├── the-conversation-we-need-to-have.md  # PRIMARY voice reference
│   └── [other posts and images]
└── GUIDELINES.md                # This file
```

### Resource Access Patterns

- **Read-primarily:** `jump-start/`, `social-media/`, `support/` — reference documents
- **Read/write:** `site/`, `supabase/` — active development targets
- **Write:** `GUIDELINES.md` — update as project evolves

### Key Source Documents (Load Before Writing Any Copy)

1. `social-media/the-conversation-we-need-to-have.md` — founding essay; primary voice reference
2. `jump-start/brand-and-voice.md` — brand values, tone, key phrases, language rules
3. `jump-start/website-architecture.md` — page-by-page copy framework
4. `jump-start/project-brief.md` — mission, vision, audience, what this is NOT

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Deno Fresh v2 (`jsr:@fresh/core@^2.2.0`) |
| Runtime | Deno (with `nodeModulesDir: "manual"`) |
| Build tool | Vite (`npm:vite@^7.1.3`) via `@fresh/plugin-vite` |
| UI library | Preact (`npm:preact@^10.28.3`) with signals |
| Styling | Tailwind CSS v4 (`npm:tailwindcss@^4.1.10`) + Typography plugin |
| Database / Auth | Supabase (Postgres + Auth + Storage + RLS) — EU Frankfurt |
| Email | Resend |
| Analytics | Plausible (privacy-respecting) |

### Dev Commands

```bash
deno task dev      # Start Vite dev server
deno task build    # Production build
deno task start    # Serve built site
deno task check    # Format check + lint + type check
```

### Important Patterns

- Routes live in `site/routes/` — file-based routing (Fresh v2 convention)
- Interactive components: `site/islands/` (hydrated on client)
- Static components: `site/components/` (server-rendered only)
- Tailwind CSS v4 via `@import "tailwindcss"` in `site/assets/styles.css` — no `tailwind.config.js`
- Import alias `@/` maps to `site/` root
- JSX uses Preact with precompile transform — import from `preact`, not `react`
- Supabase client instantiated server-side using `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`
- **`ctx.state.user` is the current user in all route handlers and async page components** — the root `site/routes/_middleware.ts` populates it on every request. Never call `getSessionFromRequest` + `getUserFromToken` manually in a route; use `ctx.state.user` (or `state.user` when destructured from the page component args) directly.
- **User table is `profiles` (not `users`)** — renamed in Phase A. Foreign key columns are `profile_id` (not `user_id`). Name fields are `name_first` / `name_last` — there is no `display_name` column. Use `ctx.state.profile` for display data (name, location, etc.); `ctx.state.user` for auth/id checks. All migrations and RLS policies use `REFERENCES profiles(id)`.

---

## Brand & Design System

### Colour Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-teal` | `#1a5f6e` | Primary brand colour, nav, headings, key UI |
| `--color-amber` | `#c4853a` | Accent, CTA buttons, highlights |
| `--color-warm-white` | `#f7f4ef` | Page backgrounds |
| `--color-near-black` | `#1c1a18` | Body text, dark backgrounds |

**Do not use:** pure CSS blue, green, red, purple, or the default Fresh gradient (`fresh-gradient`).

### Typography

- **Wordmark / headings:** Plus Jakarta Sans or DM Sans (Google Fonts)
- **Body:** System sans-serif stack or same humanist font at lighter weight
- **No serif fonts** — too academic for this audience

### Logo

- `site/static/logo.svg` (full wordmark) and `site/static/favicon.ico`
- Concept: convergence (lines/paths coming together toward a forward point)
- Colours: deep teal + warm amber; must work in single colour (black only)
- See `jump-start/logo-brief.md` for full design brief

---

## Voice & Tone Guidelines

Always read `jump-start/brand-and-voice.md` before writing copy.

### Tone Spectrum

Serious but not grim · Urgent but not alarmist · Honest but not cynical · Hopeful but not naive · Intelligent but not academic · Warm but not casual

### Always

- Use “you” and “we” directly — no passive voice
- Ground abstractions in lived reality (the four-hour app example, the Feb 2020 comparison)
- Acknowledge uncertainty honestly without hedging away from truth
- Invite, don’t lecture · Name the elephant

### Never

- Catastrophising language: “apocalypse”, “collapse”, “end of civilisation”
- Corporate speak: “leverage”, “synergy”, “stakeholders”, “ecosystem”
- Prepper/survivalist language · Political framing (left/right)
- Specific AI model names (Claude, GPT-4, Gemini) in general copy
- Fear-only framing without an action counterpart
- Promote Beyond Better within Future Together content

### Key Phrases (Use Consistently)

- _“The future is arriving. Let’s face it together.”_ — primary tagline
- _“Awareness. Conversation. Action.”_ — three-stage journey
- _“You don’t have to figure this out alone.”_
- _“The gap between what’s actually happening and what most people think is happening is enormous.”_
- _“Not panic. Not paralysis. Action.”_

---

## Restrictions and Guardrails

### Content

1. **Do not promote Beyond Better** within Future Together pages (footer attribution is fine)
2. **Do not add political framing** — explicitly non-partisan
3. **Do not add doom-framing** — honest urgency only, always paired with action
4. **Do not invent statistics** — only use claims supported by source documents
5. **Do not modify** files in `jump-start/`, `social-media/`, or `support/` (unless directed as part of content updates)

### Code

1. **Check existing components** before creating new ones — reuse `PageHeader`, `PageFooter`, `PageLayout`, `Button`, `PageHero`
2. **TypeScript strictly** — no `any` types; use proper Preact/Fresh types
3. **Tailwind v4 only** — no inline styles, no CSS modules, no separate config file
4. **Mobile-first** — test all pages at mobile sizes
5. **No external JS dependencies** without explicit discussion
6. **Load `deno.json`** before adding any new imports
7. **RLS on every Supabase table** — see `supabase/SUPABASE.md`
8. **Never use `SUPABASE_SECRET_KEY` in client code** — server-side only

### Quality

1. All pages must include proper `<Head>` meta tags (title, description, og:image)
2. All images must have meaningful `alt` attributes
3. External links: `target="_blank"` with `rel="noopener noreferrer"`

---

## Navigation Structure (Phase 1)

```
[Logo: Future Together]     Meetups | About | Join →
```

The `PageHeader` component nav needs updating to: Meetups, About, Join (Join styled as amber CTA button).

---

## Collaboration Workflow

### Starting Any Task

1. Check memory (`memory` tool) and open Beads issues (`bd list`) to orient
2. Load relevant source documents before writing copy
3. Load existing component/route files before modifying them
4. Check `site/deno.json` before adding new dependencies

### Copy Writing

1. Load `social-media/the-conversation-we-need-to-have.md` first
2. Cross-reference `jump-start/website-architecture.md` for page-specific copy framework
3. Apply voice guidelines from `jump-start/brand-and-voice.md`
4. Never invent facts not in source documents

### Code Changes

1. Load the file to be modified before changing it
2. Show planned changes and reasoning before applying
3. Preserve existing patterns and conventions
4. Build order for new pages: route file → shared components → islands → style additions

### Supabase / Backend Work

1. Load `supabase/SUPABASE.md` for naming conventions, RLS rules, and design decisions
2. Load `supabase/TABLE_REFERENCE.md` for schema quick reference when writing RLS or FK constraints
3. Load `supabase/RLS_PATTERNS.md` for reusable policy templates
4. Load `supabase/PROJECT_SETUP.md` for migration order and seed data (one-time setup tasks)
5. Load `supabase/STORAGE.md` for bucket structure and access policies
6. Load `site/ROUTES.md` for route structure and middleware patterns
7. For canonical table/field definitions, use **Supabase MCP tools** — or read `supabase/migrations/` directly
8. Use service role key server-side only; never in islands or client code

### When Uncertain

- Ask CNG before: adding dependencies, changing information architecture, making brand decisions
- Proceed autonomously: code style within established patterns, copy refinements within voice guidelines

---

## Active Work

All implementation tasks are tracked in Beads. Check open issues before starting work:

```bash
bd list              # All open issues
bd children ft-o1k   # Phase A: Supabase Foundation
bd children ft-mji   # Phase A: Groups MVP
```

Key planning document: `support/local-groups-plan.md` — load this for full architecture, schema decisions, and phasing context when working on local groups.
