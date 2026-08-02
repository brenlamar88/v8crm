/* ----------------------------------------------------------------------------
   Agency metrics — pure functions over time entries. Utilization (billable ÷
   capacity) and realization (billed ÷ billable worked) are the two commercial
   levers every services shop lives on. Kept framework-free so Reports and the
   Time screen can share them.
   -------------------------------------------------------------------------- */
import { parseDueDate } from "../data.ts";
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
