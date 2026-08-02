# V8 CRM — Design System

V8's CRM: a dark, dense, financial-grade console for running the book of
engagements V8 delivers for operators in behavioral health, nonprofits, and
field operations.

It's built on a token-driven design system — every color, size, and motion
value lives in one place — with real, interactive application screens on top:
an **Overview** home, an **Accounts** workspace, an **account record** view, a
**Pipeline** board, an **Activity** feed, and a living **Design System** style
guide. The console captures data too — creating an account and logging activity
run through token-styled forms and a dialog, backed by a light client-side store
that **persists to localStorage**, so your book survives a refresh. The one
remaining destination (Reports) is stubbed with an honest empty state.

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
| Primitives | `src/components/*` | `Button`, `Badge`, `TrendPill`, `SegmentedControl`, `Toggle`, `StatCard`, `Sparkline`, `Timeline`, `AccountsTable`, `Sidebar`, `Topbar`, plus `forms` (`Field`/`Input`/`Select`/`Textarea`) and `Modal`. |
| Store | `src/store/accounts.tsx` | Client-side accounts state + mutations (create account, log activity), the global New-account dialog, and localStorage persistence (versioned; falls back to seed). |
| Shell | `src/app/AppShell.tsx` | Sidebar + scrolling main; hosts the global dialog. |
| Screens | `src/screens/*` | `Overview`, `AccountsScreen`, `AccountDetail`, `Pipeline`, `Activity`, `StyleGuide`, `Placeholder`. |
| Router | `src/App.tsx` | `/` Overview, `/accounts`, `/accounts/:code`, `/pipeline`, `/activity`, `/styleguide`, Reports/Settings stubbed. |

**The rule:** components never hard-code a color, size, radius, or duration.
They read token utilities only, so restyling the whole CRM means editing
`tokens.css` once.

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

## Stack

Vite · React 18 · TypeScript · React Router 6 · Tailwind 3 (wired to CSS custom
properties) · Inter (variable).
