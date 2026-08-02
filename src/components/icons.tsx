/* Thin, consistent 20px stroke icons — one visual weight across the console.
   Each takes standard SVG props so callers size/color via currentColor. */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...p }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...p}
    >
      {children}
    </svg>
  );
}

export const IconOverview = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 13a8 8 0 0 1 16 0" />
    <path d="M12 13l3.5-3.5" />
    <circle cx="12" cy="13" r="1" fill="currentColor" />
  </Base>
);
export const IconAccounts = (p: IconProps) => (
  <Base {...p}>
    <path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
    <circle cx="9.5" cy="8" r="3" />
    <path d="M17 15a4 4 0 0 1 4 4v1M16 5a3 3 0 0 1 0 6" />
  </Base>
);
export const IconPipeline = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="4" width="5" height="16" rx="1.5" />
    <rect x="10" y="4" width="5" height="10" rx="1.5" />
    <rect x="17" y="4" width="4" height="6" rx="1.5" />
  </Base>
);
export const IconActivity = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 12h4l2 6 4-14 2 8h6" />
  </Base>
);
export const IconTasks = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 6l2 2 3-3M4 13l2 2 3-3M4 19l2 2 3-3M13 6h7M13 13h7M13 19h7" />
  </Base>
);
export const IconReports = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </Base>
);
export const IconSystem = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3l2 2 2.8-.6.7 2.7L20.4 9 19 11.4l1.4 2.4-2.2 1.5-.7 2.7L14 17.4 12 19.4 10 17.4l-2.8.6-.7-2.7L4.6 13.8 6 11.4 4.6 9l2.2-1.5.7-2.7L10 5z" />
    <circle cx="12" cy="12" r="2.5" />
  </Base>
);
export const IconSettings = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
  </Base>
);
export const IconSearch = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Base>
);
export const IconBell = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </Base>
);
export const IconPlus = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);
