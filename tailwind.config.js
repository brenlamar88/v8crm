/** @type {import('tailwindcss').Config} */
// Tailwind is wired directly to the CSS custom properties in
// src/styles/tokens.css. Utilities are just ergonomic handles onto the tokens;
// the tokens remain the source of truth, so theming happens in one place.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    // Replace the default palette so nothing off-system leaks in.
    colors: {
      transparent: "transparent",
      current: "currentColor",
      base: "var(--v8-bg-base)",
      sunken: "var(--v8-bg-sunken)",
      surface: "var(--v8-surface)",
      raised: "var(--v8-surface-raised)",
      overlay: "var(--v8-surface-overlay)",
      text: {
        DEFAULT: "var(--v8-text)",
        secondary: "var(--v8-text-secondary)",
        muted: "var(--v8-text-muted)",
        faint: "var(--v8-text-faint)",
      },
      accent: {
        50: "var(--v8-accent-50)",
        200: "var(--v8-accent-200)",
        400: "var(--v8-accent-400)",
        500: "var(--v8-accent-500)",
        600: "var(--v8-accent-600)",
        700: "var(--v8-accent-700)",
        soft: "var(--v8-accent-soft)",
        softer: "var(--v8-accent-softer)",
      },
      up: { DEFAULT: "var(--v8-up)", soft: "var(--v8-up-soft)" },
      down: { DEFAULT: "var(--v8-down)", soft: "var(--v8-down-soft)" },
      warn: { DEFAULT: "var(--v8-warn)", soft: "var(--v8-warn-soft)" },
      info: "var(--v8-info)",
    },
    borderColor: {
      DEFAULT: "var(--v8-border)",
      strong: "var(--v8-border-strong)",
      accent: "var(--v8-accent-500)",
      transparent: "transparent",
    },
    ringColor: {
      DEFAULT: "var(--v8-ring)",
      accent: "var(--v8-accent-500)",
    },
    fontFamily: {
      sans: "var(--v8-font-sans)",
      mono: "var(--v8-font-mono)",
    },
    fontSize: {
      "display-xl": [
        "var(--v8-text-display-xl)",
        { lineHeight: "var(--v8-leading-tight)", letterSpacing: "var(--v8-tracking-tight)" },
      ],
      display: [
        "var(--v8-text-display)",
        { lineHeight: "var(--v8-leading-tight)", letterSpacing: "var(--v8-tracking-tight)" },
      ],
      h1: [
        "var(--v8-text-h1)",
        { lineHeight: "var(--v8-leading-snug)", letterSpacing: "var(--v8-tracking-snug)" },
      ],
      h2: [
        "var(--v8-text-h2)",
        { lineHeight: "var(--v8-leading-snug)", letterSpacing: "var(--v8-tracking-snug)" },
      ],
      h3: [
        "var(--v8-text-h3)",
        { lineHeight: "var(--v8-leading-snug)", letterSpacing: "var(--v8-tracking-snug)" },
      ],
      body: ["var(--v8-text-body)", { lineHeight: "var(--v8-leading-normal)" }],
      "body-sm": ["var(--v8-text-body-sm)", { lineHeight: "var(--v8-leading-normal)" }],
      label: ["var(--v8-text-label)", { lineHeight: "var(--v8-leading-snug)" }],
      micro: [
        "var(--v8-text-micro)",
        { lineHeight: "var(--v8-leading-snug)", letterSpacing: "var(--v8-tracking-wide)" },
      ],
    },
    fontWeight: {
      regular: "var(--v8-weight-regular)",
      medium: "var(--v8-weight-medium)",
      semibold: "var(--v8-weight-semibold)",
      bold: "var(--v8-weight-bold)",
    },
    // Spacing is left as Tailwind's default scale — it is already the same 4px
    // rhythm documented in tokens.css (--v8-space-* mirror it 1:1). Keeping the
    // full scale preserves structural sizes (w-9, h-5, insets) the primitives
    // rely on; the token rhythm and the utility rhythm stay identical.
    borderRadius: {
      none: "0",
      sm: "var(--v8-radius-sm)",
      md: "var(--v8-radius-md)",
      lg: "var(--v8-radius-lg)",
      xl: "var(--v8-radius-xl)",
      pill: "var(--v8-radius-pill)",
      full: "9999px",
    },
    boxShadow: {
      sm: "var(--v8-shadow-sm)",
      md: "var(--v8-shadow-md)",
      lg: "var(--v8-shadow-lg)",
      glow: "var(--v8-glow-accent)",
      none: "none",
    },
    transitionTimingFunction: {
      out: "var(--v8-ease-out)",
      "in-out": "var(--v8-ease-in-out)",
      standard: "var(--v8-ease-standard)",
    },
    transitionDuration: {
      instant: "var(--v8-dur-instant)",
      fast: "var(--v8-dur-fast)",
      base: "var(--v8-dur-base)",
      slow: "var(--v8-dur-slow)",
    },
    extend: {
      keyframes: {
        "fade-rise": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "count-in": {
          "0%": { opacity: "0", transform: "translateY(0.15em)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-160% 0" },
          "100%": { backgroundPosition: "160% 0" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 var(--v8-accent-soft)" },
          "70%": { boxShadow: "0 0 0 6px transparent" },
          "100%": { boxShadow: "0 0 0 0 transparent" },
        },
      },
      animation: {
        "fade-rise": "fade-rise var(--v8-dur-slow) var(--v8-ease-out) both",
        "count-in": "count-in var(--v8-dur-base) var(--v8-ease-out) both",
        shimmer: "shimmer 1.6s linear infinite",
        "pulse-ring": "pulse-ring var(--v8-dur-slow) var(--v8-ease-out)",
      },
    },
  },
  plugins: [],
};
