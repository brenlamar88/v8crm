/* ----------------------------------------------------------------------------
   StatCard — the metric readout. An uppercase eyebrow, an optional range tag,
   a large tabular display number, and a trend delta. This is the reference's
   KPI tile rebuilt in V8 tokens; the arrangement is intentionally our own.
   -------------------------------------------------------------------------- */
import type { ReactNode } from "react";
import { TrendPill } from "./primitives.tsx";
import { Sparkline } from "./Sparkline.tsx";

export function StatCard({
  label,
  value,
  unit,
  trend,
  range,
  series,
  delay = 0,
}: {
  label: string;
  value: string;
  unit?: string;
  trend: number;
  range?: string;
  series?: number[];
  delay?: number;
}) {
  const tone = trend >= 0 ? "up" : "down";
  return (
    <article
      className="panel group relative overflow-hidden p-5 animate-fade-rise transition-[border-color,transform] duration-base ease-out hover:-translate-y-0.5 hover:border-strong"
      style={{ animationDelay: `${delay}ms` }}
    >
      <header className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        {range && (
          <span className="text-micro font-semibold uppercase tracking-[0.08em] text-text-faint">
            {range}
          </span>
        )}
      </header>

      {/* Thin progress hairline, like the reference's dashed meter. */}
      <div className="mt-4 h-1 rounded-pill bg-sunken overflow-hidden">
        <div
          className="h-full rounded-pill bg-accent-500 transition-[width] duration-slow ease-out"
          style={{ width: `${Math.min(100, 40 + Math.abs(trend) * 6)}%` }}
        />
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-1">
          <span className="tabular text-display font-bold leading-tight">{value}</span>
          {unit && (
            <span className="tabular text-h2 font-semibold text-text-muted">{unit}</span>
          )}
        </div>
        <TrendPill value={trend} />
      </div>

      {series && (
        <div className="mt-4 -mx-1">
          <Sparkline data={series} tone={tone} height={44} />
        </div>
      )}
    </article>
  );
}

export function StatCardRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
  );
}
