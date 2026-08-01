/* ============================================================================
   Primitives — the smallest reusable pieces of the V8 CRM language.
   Every visual value comes from a token utility (see tailwind.config.js);
   none of these components introduce raw colors, sizes, or durations.
   ========================================================================== */
import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* --- Button -----------------------------------------------------------------
   Three intents. Press gives a 1px optical sink; hover lifts color one step.
   Motion is fast + ease-out per the tokens — feedback, not decoration. */
type ButtonVariant = "primary" | "ghost" | "subtle";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

export function Button({
  variant = "primary",
  icon,
  children,
  className,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-4 h-9 " +
    "text-body font-semibold whitespace-nowrap select-none " +
    "transition-[background-color,box-shadow,transform,color] duration-fast ease-out " +
    "active:translate-y-px disabled:opacity-40 disabled:pointer-events-none";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-accent-500 text-text hover:bg-accent-400 shadow-sm hover:shadow-glow",
    subtle:
      "bg-raised text-text hover:bg-overlay border border-[color:var(--v8-border)]",
    ghost: "bg-transparent text-text-secondary hover:text-text hover:bg-raised",
  };

  return (
    <button className={cx(base, variants[variant], className)} {...rest}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

/* --- Badge ------------------------------------------------------------------
   Status pill with a leading dot. Tints are the soft status tokens so the
   label stays legible on the dark surface. */
type BadgeTone = "accent" | "up" | "down" | "warn" | "neutral";

const badgeTone: Record<BadgeTone, { wrap: string; dot: string }> = {
  accent: { wrap: "bg-accent-soft text-accent-200", dot: "bg-accent-400" },
  up: { wrap: "bg-up-soft text-up", dot: "bg-up" },
  down: { wrap: "bg-down-soft text-down", dot: "bg-down" },
  warn: { wrap: "bg-warn-soft text-warn", dot: "bg-warn" },
  neutral: { wrap: "bg-raised text-text-secondary", dot: "bg-[color:var(--v8-text-muted)]" },
};

export function Badge({
  tone = "neutral",
  dot = true,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
}) {
  const t = badgeTone[tone];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-pill px-3 h-6 text-label font-medium",
        t.wrap,
      )}
    >
      {dot && <span className={cx("h-1.5 w-1.5 rounded-full", t.dot)} />}
      {children}
    </span>
  );
}

/* --- TrendPill --------------------------------------------------------------
   The tiny up/down delta beside a metric. Direction is inferred from sign. */
export function TrendPill({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={cx(
        "tabular inline-flex items-center gap-1 text-label font-semibold",
        up ? "text-up" : "text-down",
      )}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path
          d={up ? "M2 8.5L5 5l2 2 3-3.5" : "M2 3.5L5 7l2-2 3 3.5"}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={up ? "M10 3.5H7M10 3.5V6.5" : "M10 8.5H7M10 8.5V5.5"}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {up ? "+" : "−"}
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

/* --- SegmentedControl -------------------------------------------------------
   The range switch (1H / 1D / 1W …). The active thumb slides between options
   using a token duration + the signature ease. */
export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const activeIndex = Math.max(0, options.indexOf(value));
  return (
    <div className="relative inline-flex rounded-md bg-sunken p-1 border border-[color:var(--v8-border)]">
      <div
        className="absolute top-1 bottom-1 rounded-sm bg-accent-soft border border-[color:var(--v8-accent-500)]/40 transition-[left,width] duration-base ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          left: `calc(0.25rem + ${activeIndex} * (100% - 0.5rem) / ${options.length})`,
        }}
      />
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cx(
            "relative z-10 h-7 min-w-9 px-3 rounded-sm text-label font-semibold transition-colors duration-fast ease-out",
            opt === value ? "text-accent-200" : "text-text-muted hover:text-text-secondary",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* --- Toggle -----------------------------------------------------------------
   Small switch used to demonstrate motion on a boolean control. */
export function Toggle({ label }: { label: string }) {
  const [on, setOn] = useState(true);
  return (
    <button
      onClick={() => setOn((v) => !v)}
      className="inline-flex items-center gap-3 text-body-sm text-text-secondary"
      role="switch"
      aria-checked={on}
    >
      <span
        className={cx(
          "relative h-5 w-9 rounded-pill transition-colors duration-base ease-out",
          on ? "bg-accent-500" : "bg-raised",
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 h-4 w-4 rounded-full bg-text shadow-sm transition-[left] duration-base ease-out",
            on ? "left-[1.125rem]" : "left-0.5",
          )}
        />
      </span>
      {label}
    </button>
  );
}
