# V8 CRM — Design System

The visual foundation for V8's CRM: a dark, dense, financial-grade console for
running the book of engagements V8 delivers for operators in behavioral health,
nonprofits, and field operations.

This first cut is the **design language**, not the app — the tokens, the
primitives, and a living style guide that proves them. Screens get built on top
of it next.

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
| Primitives | `src/components/*` | `Button`, `Badge`, `TrendPill`, `SegmentedControl`, `Toggle`, `StatCard`, `Sparkline`, `AccountsTable`. |
| Showcase | `src/App.tsx` | The living style guide. |

**The rule:** components never hard-code a color, size, radius, or duration.
They read token utilities only, so restyling the whole CRM means editing
`tokens.css` once.

## Run it

```bash
npm install
npm run dev      # style guide at the printed localhost URL
npm run build    # type-check + production build
```

## Stack

Vite · React 18 · TypeScript · Tailwind 3 (wired to CSS custom properties) ·
Inter (variable).
