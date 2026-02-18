---
title: Future Together — BB Project Guidelines
version: 1.0.0
created: 2026-02-18
updated: 2026-02-18
project: website-futuretogether
domain: futuretogether.community
---

# Future Together — BB Project Guidelines

## Project Purpose and Scope

This project builds and maintains the website for **Future Together** — a community platform and movement hub helping people understand and prepare for AI-driven societal change. The domain is `futuretogether.community`.

The primary goal is to deliver a **Phase 1 MVP website** that supports the existing online meetup community, then grow into Phase 2 and Phase 3 features over time.

### Phase 1 MVP (Current Focus)
Build and launch a functional website with these routes:
- `/` — Home page
- `/meetups` — Monthly online meetup details and past resources
- `/meetups/slideshow` — Serve the existing meetup slideshow HTML
- `/about` — Founder origin story and mission
- `/join` — Email capture and event registration

### Phase 2 (Future)
- `/resources`, `/blog`, `/newsletter`, `/local-groups`

### Phase 3 (Future)
- `/community`, `/find-a-group`, `/start-a-group`, `/take-action`

### Out of Scope
- Beyond Better (beyondbetter.app) promotion or integration beyond attribution in the footer
- Commercial features, paywalls, or premium tiers
- Political content or alignment

---

## Data Source

**Primary data source:** `working/website-futuretogether` (filesystem)
**Root:** `/Users/cng/working/website-futuretogether`
**Capabilities:** read, write, list, search, move, delete

### Directory Structure

```
working/website-futuretogether/
├── site/                        # The Deno Fresh website project (primary build target)
│   ├── routes/                  # Page routes (index.tsx, _app.tsx, etc.)
│   ├── components/              # Shared UI components (PageHeader, PageFooter, etc.)
│   ├── islands/                 # Interactive Preact islands
│   ├── static/                  # Static assets (logo.svg, favicon.ico)
│   ├── assets/                  # CSS (styles.css — Tailwind entry point)
│   ├── deno.json                # Deno config, imports, tasks
│   └── vite.config.ts           # Vite build config
├── jump-start/                  # Project brief documents (reference only — do not modify)
│   ├── project-brief.md         # Master project brief
│   ├── brand-and-voice.md       # Brand values, voice, tone, key phrases
│   ├── logo-brief.md            # Logo design brief and requirements
│   └── website-architecture.md  # Page-by-page copy framework and site structure
├── social-media/                # Source content and existing assets (reference only)
│   ├── the-conversation-we-need-to-have.md      # PRIMARY: Founding essay — master voice reference
│   ├── discuss-our-future-post-linkedin-long.md # Secondary: Punchier copy reference
│   ├── discuss-our-future-slideshow-conversation.html  # Meetup slideshow (conversation version)
│   ├── discuss-our-future-slideshow-presentation.html  # Meetup slideshow (presentation version)
│   ├── discuss-our-future-slideshow.html         # Meetup slideshow (base version)
│   └── [other social posts and images]
└── GUIDELINES.md                # This file
```

### Resource Access Patterns

- **Read-only:** `jump-start/`, `social-media/` — reference documents; never modify
- **Read/write:** `site/` — active development target
- **Write:** `GUIDELINES.md` — this file, update as project evolves

### Key Source Documents (Load Before Writing Any Copy)

Always load these before writing website copy — they are the authoritative voice and content references:

1. `social-media/the-conversation-we-need-to-have.md` — The founding essay. Primary voice and substance reference for all copy.
2. `jump-start/brand-and-voice.md` — Brand values, tone guidelines, key phrases, language rules.
3. `jump-start/website-architecture.md` — Page-by-page copy framework with suggested headlines, body copy, and CTAs.
4. `jump-start/project-brief.md` — Mission, vision, audience, and what this is NOT.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Deno Fresh v2 (`jsr:@fresh/core@^2.2.0`) |
| Runtime | Deno (with `nodeModulesDir: "manual"`) |
| Build tool | Vite (`npm:vite@^7.1.3`) via `@fresh/plugin-vite` |
| UI library | Preact (`npm:preact@^10.28.3`) with signals |
| Styling | Tailwind CSS v4 (`npm:tailwindcss@^4.1.10`) + Typography plugin |
| Email | Resend (to be integrated) |
| Analytics | Plausible (planned, privacy-respecting) |

### Dev Commands
```bash
deno task dev      # Start Vite dev server
deno task build    # Production build
deno task start    # Serve built site
deno task check    # Format check + lint + type check
```

### Important Patterns
- Routes live in `site/routes/` — file-based routing (Fresh convention)
- Interactive components go in `site/islands/` (hydrated on client)
- Static components go in `site/components/` (server-rendered only)
- Tailwind CSS v4 is configured via `@import "tailwindcss"` in `site/assets/styles.css` — no `tailwind.config.js`
- Import alias `@/` maps to `site/` root
- JSX uses Preact with precompile transform — import from `preact`, not `react`

---

## Brand & Design System

### Colour Palette

Define these as CSS custom properties in `site/assets/styles.css`:

| Token | Hex | Usage |
|---|---|---|
| `--color-teal` | `#1a5f6e` | Primary brand colour, nav, headings, key UI |
| `--color-amber` | `#c4853a` | Accent, CTA buttons, highlights |
| `--color-warm-white` | `#f7f4ef` | Page backgrounds |
| `--color-near-black` | `#1c1a18` | Body text, dark backgrounds |

**Do not use:** pure CSS blue, green, red, purple, or the default Fresh gradient (`fresh-gradient`).

### Typography
- **Wordmark / headings:** Humanist sans-serif — Plus Jakarta Sans or DM Sans (Google Fonts, free)
- **Body:** System sans-serif stack or same humanist font at lighter weight
- **No serif fonts** — too academic for this audience

### Logo
- Lives at `site/static/logo.svg` (full wordmark) and `site/static/favicon.ico`
- Also referenced as `/img/logo.svg` from `PageHeader` — ensure path consistency
- Logo concept: convergence (lines/paths coming together toward a forward point)
- Colours: deep teal + warm amber; must work in single colour (black only)
- See `jump-start/logo-brief.md` for full design brief and decision checklist

---

## Voice & Tone Guidelines

Always read `jump-start/brand-and-voice.md` before writing copy. Key principles:

### Tone Spectrum
- Serious but not grim
- Urgent but not alarmist
- Honest but not cynical
- Hopeful but not naive
- Intelligent but not academic
- Warm but not casual

### Always
- Use "you" and "we" directly — no passive voice
- Ground abstractions in lived reality (the four-hour app example, the Feb 2020 comparison)
- Acknowledge uncertainty honestly without hedging away from truth
- Invite, don't lecture
- Name the elephant — don't soften uncomfortable realities

### Never
- Catastrophising language: "apocalypse", "collapse", "end of civilisation"
- Corporate speak: "leverage", "synergy", "stakeholders", "ecosystem"
- Prepper/survivalist language
- Political framing (left/right)
- Specific AI model names (Claude, GPT-4, Gemini) in general copy
- Fear-only framing without an action counterpart
- Promote Beyond Better within Future Together content

### Key Phrases (Use Consistently)
- *"The future is arriving. Let's face it together."* — primary tagline
- *"Awareness. Conversation. Action."* — three-stage journey
- *"You don't have to figure this out alone."*
- *"The gap between what's actually happening and what most people think is happening is enormous."*
- *"Not panic. Not paralysis. Action."*

---

## Restrictions and Guardrails

### Content
1. **Do not promote Beyond Better** within Future Together pages (footer attribution is fine)
2. **Do not add political framing** — this is explicitly non-partisan
3. **Do not add doom-framing** — honest urgency only, always paired with action
4. **Do not invent statistics** — only use claims supported by the source documents
5. **Do not modify** files in `jump-start/` or `social-media/` directories

### Code
1. **Always check existing component code** before creating new components — reuse `PageHeader`, `PageFooter`, `PageLayout`, `Button`, `PageHero` where appropriate
2. **TypeScript strictly** — no `any` types; use proper Preact/Fresh types
3. **Tailwind v4 only** — no inline styles, no CSS modules, no separate config file
4. **Mobile-first** — many users will share links from phones; test all pages at mobile sizes
5. **No external JS dependencies** beyond what's already in `deno.json` without explicit discussion
6. **Load `deno.json`** before adding any new imports to check they aren't already included

### Quality
1. Run `deno task check` mentally before presenting code (valid TypeScript, no obvious lint errors)
2. All pages must include proper `<Head>` meta tags (title, description, og:image)
3. All images must have meaningful `alt` attributes
4. External links must open in `target="_blank"` with `rel="noopener noreferrer"`

---

## Navigation Structure (Phase 1)

```
[Logo: Future Together]     Meetups | About | Join →
```

The `PageHeader` component currently has: Home, Contact, Blog — **this needs updating** to the Phase 1 nav.

---

## Email & Registration Integration

- **Provider:** Resend
- **Patterns:** Refer to BB site code when provided by cng — use as the integration template
- **Join page:** Email capture for newsletter/updates
- **Meetups page:** Event registration (replacing the current `futuretogether.community/discuss-our-future` link)
- **Do not hard-code API keys** — use environment variables via `@std/dotenv`

---

## Collaboration Workflow

### Starting Any Task
1. Load `GUIDELINES.md` (this file) to orient
2. Load the relevant source documents before writing copy
3. Load existing component/route files before modifying them
4. Check `site/deno.json` before adding new dependencies

### Copy Writing
1. Load `social-media/the-conversation-we-need-to-have.md` first
2. Cross-reference with `jump-start/website-architecture.md` for the page-specific copy framework
3. Apply voice guidelines from `jump-start/brand-and-voice.md`
4. Never invent facts not present in source documents

### Code Changes
1. Load the file to be modified before changing it
2. Show planned changes and reasoning before applying
3. Preserve existing patterns and conventions in the codebase
4. Build components in this order for each new page:
   - Route file (`site/routes/[page].tsx`)
   - Any new shared components (`site/components/`)
   - Any interactive islands if needed (`site/islands/`)
   - Style additions to `site/assets/styles.css`

### Logo Iteration
1. Create SVG directly — the logo lives at `site/static/logo.svg`
2. Reference `jump-start/logo-brief.md` decision checklist before presenting options
3. Iterate based on cng feedback
4. Once approved: generate favicon variant, update `PageHeader` path references

### When Uncertain
- Ask cng before: adding new dependencies, changing information architecture, making brand decisions
- Proceed autonomously: code style within established patterns, copy refinements within voice guidelines, file organisation within established structure

---

## Implementation Checklist — Phase 1

### Design System
- [ ] Add brand CSS custom properties to `site/assets/styles.css`
- [ ] Configure Tailwind theme with brand colours
- [ ] Select and integrate typography (Plus Jakarta Sans or DM Sans)

### Logo
- [ ] Design SVG logo (convergence concept, teal + amber)
- [ ] Review and refine with cng
- [ ] Replace `site/static/logo.svg` with approved logo
- [ ] Generate `site/static/favicon.ico` from logo mark
- [ ] Update `PageHeader` logo path

### Navigation
- [ ] Update `PageHeader` nav items: Meetups, About, Join
- [ ] Style Join as a CTA button (amber)

### Pages
- [ ] Home page (`site/routes/index.tsx`) — full replacement of demo content
- [ ] Meetups page (`site/routes/meetups/index.tsx`)
- [ ] Slideshow route (`site/routes/meetups/slideshow.tsx`) — serve HTML file
- [ ] About page (`site/routes/about.tsx`)
- [ ] Join page (`site/routes/join.tsx`) — email capture + event registration

### Infrastructure
- [ ] Email capture integration (Resend)
- [ ] Event registration integration (Resend + cng to provide BB code)
- [ ] SEO meta tags on all pages
- [ ] OG image (`site/static/og-image.jpg`)
- [ ] Mobile testing
- [ ] Plausible analytics snippet
- [ ] Deploy to production
- [ ] Update DNS for futuretogether.community
