/* ----------------------------------------------------------------------------
   Agency metrics — pure functions over time entries. Utilization (billable ÷
   capacity) and realization (billed ÷ billable worked) are the two commercial
   levers every services shop lives on. Kept framework-free so Reports and the
   Time screen can share them.
   -------------------------------------------------------------------------- */
import { parseDueDate, type Account, type Delivery } from "../data.ts";
import type { TimeEntry } from "./supabase.ts";

export type Period = "week" | "month" | "30d";

export const PERIOD_LABEL: Record<Period, string> = {
  week: "This week",
  month: "This month",
  "30d": "Last 30 days",
};

function midnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Inclusive start of the period, at local midnight. Week starts Monday. */
export function periodStart(period: Period, now: Date = new Date()): Date {
  const today = midnight(now);
  if (period === "week") {
    const mondayOffset = (today.getDay() + 6) % 7; // Sun=0 → 6, Mon=1 → 0 …
    const d = new Date(today);
    d.setDate(d.getDate() - mondayOffset);
    return d;
  }
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  const d = new Date(today);
  d.setDate(d.getDate() - 29);
  return d;
}

/** Whole days elapsed in the period so far (start → today, inclusive). */
export function periodDaysElapsed(period: Period, now: Date = new Date()): number {
  const start = periodStart(period, now);
  return Math.floor((midnight(now).getTime() - start.getTime()) / 86_400_000) + 1;
}

export function inPeriod(dateISO: string, period: Period, now: Date = new Date()): boolean {
  const d = parseDueDate(dateISO);
  if (!d) return false;
  return d >= periodStart(period, now) && d <= midnight(now);
}

export interface TimeSummary {
  total: number;
  billable: number;
  billed: number; // billable and not written off
  nonBillable: number;
}

export function summarize(entries: TimeEntry[]): TimeSummary {
  let total = 0;
  let billable = 0;
  let billed = 0;
  for (const e of entries) {
    total += e.hours;
    if (e.billable) {
      billable += e.hours;
      if (!e.writtenOff) billed += e.hours;
    }
  }
  return { total, billable, billed, nonBillable: total - billable };
}

/** Available capacity hours for a period: weekly hours/person × people, prorated
    by how much of the period has elapsed. */
export function capacityHours(weeklyPerPerson: number, people: number, period: Period, now: Date = new Date()): number {
  const days = periodDaysElapsed(period, now);
  return (weeklyPerPerson / 7) * days * Math.max(1, people);
}

export function utilization(billable: number, capacity: number): number {
  return capacity > 0 ? billable / capacity : 0;
}

export function realization(billed: number, billable: number): number {
  return billable > 0 ? billed / billable : 0;
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

/* --- Delivery metrics (DORA + AI quality) --------------------------------- */

export type Tone = "up" | "warn" | "down";

function fmtHours(v: number): string {
  if (v < 1) return `${Math.round(v * 60)}m`;
  if (v < 48) return `${Math.round(v)}h`;
  const d = v / 24;
  return `${d >= 10 ? Math.round(d) : d.toFixed(1)}d`;
}

export interface MetricSpec {
  key: keyof Delivery;
  label: string;
  group: "DORA" | "AI quality" | "Service";
  dir: "higher" | "lower"; // which direction is better
  good: number; // reaching this → up
  ok: number; // reaching this → warn (else down)
  rollup: "avg" | "sum";
  unit?: string; // hint for the editor
  format: (v: number) => string;
}

// Thresholds drawn from DORA benchmarks + common AI-eval targets.
export const DELIVERY_METRICS: MetricSpec[] = [
  { key: "deploysPerWeek", label: "Deploy frequency", group: "DORA", dir: "higher", good: 7, ok: 1, rollup: "avg", unit: "/wk", format: (v) => `${v % 1 === 0 ? v : v.toFixed(1)}/wk` },
  { key: "leadTimeHours", label: "Lead time", group: "DORA", dir: "lower", good: 24, ok: 168, rollup: "avg", unit: "hrs", format: fmtHours },
  { key: "changeFailurePct", label: "Change failure", group: "DORA", dir: "lower", good: 15, ok: 30, rollup: "avg", unit: "%", format: (v) => `${Math.round(v)}%` },
  { key: "mttrHours", label: "Time to restore", group: "DORA", dir: "lower", good: 1, ok: 24, rollup: "avg", unit: "hrs", format: fmtHours },
  { key: "taskSuccessPct", label: "Task success", group: "AI quality", dir: "higher", good: 95, ok: 85, rollup: "avg", unit: "%", format: (v) => `${Math.round(v)}%` },
  { key: "hallucinationPct", label: "Hallucination", group: "AI quality", dir: "lower", good: 0.5, ok: 2, rollup: "avg", unit: "%", format: (v) => `${v.toFixed(1)}%` },
  { key: "p95ms", label: "p95 latency", group: "AI quality", dir: "lower", good: 1000, ok: 3000, rollup: "avg", unit: "ms", format: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${Math.round(v)}ms`) },
  { key: "costPerTask", label: "Cost / task", group: "AI quality", dir: "lower", good: 0.02, ok: 0.05, rollup: "avg", unit: "$", format: (v) => `$${v.toFixed(3)}` },
  { key: "uptimePct", label: "Uptime", group: "Service", dir: "higher", good: 99.9, ok: 99, rollup: "avg", unit: "%", format: (v) => `${v.toFixed(2)}%` },
  { key: "openBugs", label: "Open bugs", group: "Service", dir: "lower", good: 5, ok: 15, rollup: "sum", unit: "count", format: (v) => `${Math.round(v)}` },
];

export function metricTone(spec: MetricSpec, v: number): Tone {
  if (spec.dir === "higher") return v >= spec.good ? "up" : v >= spec.ok ? "warn" : "down";
  return v <= spec.good ? "up" : v <= spec.ok ? "warn" : "down";
}

/** Roll one metric across the accounts that report it. Null when none do. */
export function rollupMetric(accounts: Account[], spec: MetricSpec): { value: number; n: number } | null {
  const vals = accounts
    .map((a) => a.delivery?.[spec.key])
    .filter((v): v is number => typeof v === "number");
  if (vals.length === 0) return null;
  const sum = vals.reduce((s, v) => s + v, 0);
  return { value: spec.rollup === "sum" ? sum : sum / vals.length, n: vals.length };
}

export function hasDelivery(a: Account): boolean {
  return !!a.delivery && DELIVERY_METRICS.some((m) => typeof a.delivery?.[m.key] === "number");
}
