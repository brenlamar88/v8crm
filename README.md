# V8 CRM — Design System

V8's CRM: a dark, dense, financial-grade console for running the book of
engagements V8 delivers for operators in behavioral health, nonprofits, and
field operations.

It's built on a token-driven design system — every color, size, and motion
value lives in one place — with a full, interactive application on top:

- **Overview** — KPI band, revenue panel, pipeline-by-stage, needs-attention list
- **Accounts** — filterable workspace over the whole book
- **Account record** — identity header, KPIs, engagement chart, activity
  timeline, contacts; fully **editable** and **deletable**
- **Pipeline** — a stage-column board with account cards
- **Activity** — one recency-sorted feed of every touch, filterable by kind
- **Reports** — rollups by vertical and stage, with **CSV export**
- **Settings** — profile, a demo-data reset, and a **live accent theming** picker
  that re-colors the entire console
- **Design System** — a living style guide documenting the language

The console captures data, not just displays it: create / edit / delete accounts
and log activity through token-styled forms, dialogs, and toast confirmations,
backed by a light client-side store that **persists to localStorage**. A global
**⌘K command palette** and topbar search jump to any screen or account, and the
shell is **responsive** — the sidebar becomes a drawer on mobile.

## What informs the look

The reference dashboards set the *rhythm*, not the layout. What we borrowed:

- **Typographic scale** — a tight display ramp for the numeric readouts, small
  uppercase eyebrows, tabular numerals everywhere figures line up.
- **Spacing rhythm** — a strict 4px ladder so vertical and horizontal spacing
  stay locked.
- **Motion** — short, calm, ease-out. Hover/press are fast feedback (150ms);
  toggles and entrances run one step longer (220–360ms). Honors
  `prefers-reduced-motion`.
- **Surface & signal** — near-black surfaces in elevation layers, a single
  violet signal color, status tints reserved for meaning.

What we did **not** do: copy the reference's sidebar-plus-chart screen. The
showcase is a documentation layout of its own.

## Where the system lives

| Layer | File | Role |
| --- | --- | --- |
| Tokens | `src/styles/tokens.css` | Single source of truth — every color, size, duration as a CSS variable. Retheme here. |
| Bridge | `tailwind.config.js` | Maps tokens to Tailwind utilities + motion keyframes. No off-system values allowed. |
| Base | `src/index.css` | Resets, the `.eyebrow` / `.panel` / `.tabular` helpers, focus + scrollbar styling. |
| Primitives | `src/components/*` | `Button`, `Badge`, `TrendPill`, `SegmentedControl`, `Toggle`, `StatCard`, `Sparkline`, `Timeline`, `AccountsTable`, `Sidebar`, `Topbar`, `SearchBox`, `CommandPalette`, `Modal`, `forms` (`Field`/`Input`/`Select`/`Textarea`), `toast`, and the `New`/`Edit` account dialogs. |
| Store | `src/store/accounts.tsx` | Accounts state + mutations (add / update / remove / log activity), the global New-account dialog, and versioned localStorage persistence (falls back to seed). |
| Libs | `src/lib/*` | `export.ts` (CSV), `theme.ts` (accent presets + live re-theming). |
| Shell | `src/app/*` | `AppShell` (responsive sidebar + main, ⌘K palette, global dialogs) and `nav` (mobile-drawer context). |
| Screens | `src/screens/*` | `Overview`, `AccountsScreen`, `AccountDetail`, `Pipeline`, `Activity`, `Reports`, `Settings`, `StyleGuide`, `Placeholder`. |
| Router | `src/App.tsx` | `/`, `/accounts`, `/accounts/:code`, `/pipeline`, `/activity`, `/reports`, `/settings`, `/styleguide`. Wraps everything in the toast + accounts providers. |

**The rule:** components never hard-code a color, size, radius, or duration.
They read token utilities only, so restyling the whole CRM — or re-theming it
live from Settings — means changing `tokens.css` (or the `--v8-accent-*`
variables) in one place.

## Run it

```bash
npm install
npm run dev      # console at the printed localhost URL (Overview is home)
npm run build    # type-check + production build
```

## Deploy

Configured for Vercel (`vercel.json`): framework preset `vite`, output `dist`,
with an SPA rewrite so client-side routes resolve on refresh. Vercel builds from
whatever branch is set as the project's Production Branch — point that at `main`.

## Backend (Supabase)

The store is **Supabase-backed with a local cache**. This project ships with its
Supabase URL + public anon key baked into `src/lib/supabase.ts` (the anon key is
a browser key by design — the owner-scoped RLS is what protects the data), so the
app is live out of the box; `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` env
vars override it to point at a different project. It hydrates from Postgres on
load and writes every mutation back, keeping `localStorage` as an offline cache.
Any failure — missing table, network, RLS — silently falls back to local, so the
app never breaks.

To turn on the real backend:

1. **Run the schema.** In your Supabase project → SQL Editor, paste and run
   [`supabase/schema.sql`](./supabase/schema.sql). It creates the `accounts`
   table with an `owner_id` and RLS scoped to `auth.uid()`, so every user only
   sees their own book. (It drops/recreates the table — safe, since the app
   re-seeds a user's book on first load.)
2. **Env vars.** The Vercel Supabase integration already exposes the project URL
   and anon key; `vite.config.ts` bridges them to the client build, accepting
   `SUPABASE_URL` / `SUPABASE_ANON_KEY`, their `NEXT_PUBLIC_` variants, or
   explicit `VITE_` ones. If Settings → Data still shows **Local**, add
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel and redeploy.
3. **Verify.** Settings → Data shows a **Supabase** badge when the client is
   live. Only the public **anon** key ever reaches the browser; the service-role
   key is never referenced.

### Auth

When Supabase is configured the app requires **email + password** sign-in
(Supabase Auth) and gates the console behind a login; each user's data is
isolated by the `owner_id` RLS policies. When Supabase is off, the app runs open
as a local demo (no login). Sign out from the sidebar footer.

- New users self-serve via **Create one** on the login screen. If your Supabase
  project has email confirmation enabled (Auth → Providers → Email), they'll
  confirm by email before the first sign-in; turn it off for instant demo access.
- Magic-link / OAuth providers are a drop-in swap in `src/store/auth.tsx` if you
  prefer those over passwords.

### Realtime

The `accounts` table is in the `supabase_realtime` publication, and the store
subscribes to its own rows (filtered by `owner_id`), so an account created or
edited in one tab/device appears live in the others. RLS still governs delivery
— a session only receives changes to rows it can read. When Supabase is off this
is a no-op.

## Stack

Vite · React 18 · TypeScript · React Router 6 · Tailwind 3 (wired to CSS custom
properties) · Inter (variable).
