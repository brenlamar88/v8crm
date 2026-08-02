/* ----------------------------------------------------------------------------
   Accent theming — the whole console reads its signal color from the
   --v8-accent-* tokens, so re-theming is just rewriting those variables on
   :root. Presets below define a ramp each; the choice persists in localStorage
   and is applied before first paint (see main.tsx).
   -------------------------------------------------------------------------- */

export interface AccentPreset {
  id: string;
  label: string;
  rgb: [number, number, number]; // base (500) channels, for the tinted fills
  ramp: { 200: string; 400: string; 500: string; 600: string; 700: string };
}

export const ACCENTS: AccentPreset[] = [
  {
    id: "violet",
    label: "Violet",
    rgb: [124, 92, 255],
    ramp: { 200: "#c9bcff", 400: "#9a7bff", 500: "#7c5cff", 600: "#6a45f2", 700: "#5636d1" },
  },
  {
    id: "indigo",
    label: "Indigo",
    rgb: [99, 102, 241],
    ramp: { 200: "#c7d2fe", 400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca" },
  },
  {
    id: "sky",
    label: "Sky",
    rgb: [56, 158, 244],
    ramp: { 200: "#bae0ff", 400: "#60b8fa", 500: "#389ef4", 600: "#2b7fd0", 700: "#2166ab" },
  },
  {
    id: "emerald",
    label: "Emerald",
    rgb: [16, 185, 129],
    ramp: { 200: "#a7f3d0", 400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857" },
  },
  {
    id: "amber",
    label: "Amber",
    rgb: [245, 158, 11],
    ramp: { 200: "#fde68a", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309" },
  },
  {
    id: "rose",
    label: "Rose",
    rgb: [244, 63, 94],
    ramp: { 200: "#fecdd3", 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c" },
  },
];

const STORE_KEY = "v8crm.accent";
export const DEFAULT_ACCENT = "violet";

export function getSavedAccent(): string {
  if (typeof window === "undefined") return DEFAULT_ACCENT;
  return window.localStorage.getItem(STORE_KEY) ?? DEFAULT_ACCENT;
}

export function applyAccent(id: string, persist = false): void {
  if (typeof document === "undefined") return;
  const preset = ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];
  const [r, g, b] = preset.rgb;
  const root = document.documentElement;
  const set = (k: string, v: string) => root.style.setProperty(k, v);

  set("--v8-accent-200", preset.ramp[200]);
  set("--v8-accent-400", preset.ramp[400]);
  set("--v8-accent-500", preset.ramp[500]);
  set("--v8-accent-600", preset.ramp[600]);
  set("--v8-accent-700", preset.ramp[700]);
  set("--v8-accent-soft", `rgba(${r}, ${g}, ${b}, 0.14)`);
  set("--v8-accent-softer", `rgba(${r}, ${g}, ${b}, 0.08)`);
  set("--v8-accent-line", `rgba(${r}, ${g}, ${b}, 0.40)`);
  set("--v8-ring", `rgba(${r}, ${g}, ${b}, 0.55)`);
  set(
    "--v8-glow-accent",
    `0 0 0 1px rgba(${r}, ${g}, ${b}, 0.35), 0 8px 32px -8px rgba(${r}, ${g}, ${b}, 0.45)`,
  );

  if (persist) window.localStorage.setItem(STORE_KEY, preset.id);
}
