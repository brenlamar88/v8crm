/* ----------------------------------------------------------------------------
   Time & utilization — log hours against accounts (or internal), then read the
   two levers every services shop lives on: utilization (billable ÷ capacity)
   and realization (billed ÷ billable worked). Tiles are tinted against agency
   benchmarks. In team mode it also breaks utilization down per person.
   -------------------------------------------------------------------------- */
import { useMemo, useState } from "react";
import { Topbar } from "../components/Topbar.tsx";
import { Button, SegmentedControl } from "../components/primitives.tsx";
import { Field, Input, Select } from "../components/forms.tsx";
import { useAccounts } from "../store/accounts.tsx";
import { useTime, type NewTimeEntry } from "../store/time.tsx";
import { useWorkspace } from "../store/workspace.tsx";
import { initialsFor } from "../data.ts";
import {
  PERIOD_LABEL,
  capacityHours,
  inPeriod,
  pct,
  realization,
  summarize,
  utilization,
  type Period,
} from "../lib/metrics.ts";

const CAP_KEY = "v8crm.capacity";
const PERIODS: Period[] = ["week", "month", "30d"];

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function loadCapacity(): number {
  try {
    const n = Number(window.localStorage.getItem(CAP_KEY));
    return Number.isFinite(n) && n > 0 ? n : 40;
  } catch {
    return 40;
  }
}

/** A KPI tile with a benchmark-tinted value. */
function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "up" | "warn" | "down" }) {
  const color = tone === "up" ? "text-up" : tone === "warn" ? "text-warn" : tone === "down" ? "text-down" : "text-text";
  return (
    <div className="panel p-5">
      <div className="eyebrow">{label}</div>
      <div className={["tabular mt-2 text-h1 font-bold leading-none", color].join(" ")}>{value}</div>
      {sub && <div className="mt-1.5 text-label text-text-muted">{sub}</div>}
    </div>
  );
}

export function Time() {
  const { entries, addEntry, updateEntry, removeEntry } = useTime();
  const { accounts } = useAccounts();
  const { enabled: teamEnabled, members } = useWorkspace();

  const [period, setPeriod] = useState<Period>("week");
  const [capacity, setCapacity] = useState<number>(loadCapacity);

  const [date, setDate] = useState(todayISO());
  const [accountCode, setAccountCode] = useState("");
  const [hours, setHours] = useState("");
  const [billable, setBillable] = useState(true);
  const [note, setNote] = useState("");

  const nameByCode = useMemo(() => {
    const m = new Map<string, string>();
    accounts.forEach((a) => m.set(a.code, a.name));
    return m;
  }, [accounts]);

  const periodEntries = useMemo(() => entries.filter((e) => inPeriod(e.date, period)), [entries, period]);
  const summary = useMemo(() => summarize(periodEntries), [periodEntries]);

  const people = teamEnabled ? Math.max(1, members.length) : 1;
  const cap = capacityHours(capacity, people, period);
  const util = utilization(summary.billable, cap);
  const real = realization(summary.billed, summary.billable);

  const utilTone = util >= 0.7 ? "up" : util >= 0.55 ? "warn" : "down";
  const realTone = summary.billable === 0 ? undefined : real >= 0.9 ? "up" : real >= 0.75 ? "warn" : "down";

  // Per-person utilization (team mode).
  const perPerson = useMemo(() => {
    if (!teamEnabled) return [];
    const map = new Map<string, { billable: number; total: number }>();
    for (const e of periodEntries) {
      const key = e.userEmail || "—";
      const cur = map.get(key) ?? { billable: 0, total: 0 };
      cur.total += e.hours;
      if (e.billable) cur.billable += e.hours;
      map.set(key, cur);
    }
    const perCap = capacityHours(capacity, 1, period);
    return [...map.entries()]
      .map(([email, v]) => ({ email, ...v, util: utilization(v.billable, perCap) }))
      .sort((a, b) => b.billable - a.billable);
  }, [periodEntries, teamEnabled, capacity, period]);

  function setCap(n: number) {
    setCapacity(n);
    try {
      window.localStorage.setItem(CAP_KEY, String(n));
    } catch {
      /* ignore */
    }
  }

  function submit() {
    const h = Number(hours);
    if (!Number.isFinite(h) || h <= 0) return;
    const input: NewTimeEntry = { date, accountCode, hours: h, billable, note: note.trim() };
    addEntry(input);
    setHours("");
    setNote("");
  }

  const recent = useMemo(
    () => [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, 40),
    [entries],
  );

  return (
    <>
      <Topbar title="Time & utilization" subtitle="Billable hours, utilization & realization" />
      <div className="px-6 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl
            options={PERIODS.map((p) => PERIOD_LABEL[p])}
            value={PERIOD_LABEL[period]}
            onChange={(label) => setPeriod(PERIODS.find((p) => PERIOD_LABEL[p] === label) ?? "week")}
          />
          <label className="flex items-center gap-2 text-label text-text-muted">
            Capacity
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCap(Number(e.target.value))}
              className="tabular w-16 rounded-sm border border-[color:var(--v8-border)] bg-sunken px-2 h-8 text-body-sm text-text outline-none focus:border-accent"
            />
            h/wk · person{teamEnabled ? ` × ${people}` : ""}
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Tile label="Utilization" value={pct(util)} sub={`${summary.billable.toFixed(1)} of ${cap.toFixed(0)}h capacity`} tone={utilTone} />
          <Tile label="Realization" value={summary.billable === 0 ? "—" : pct(real)} sub={`${summary.billed.toFixed(1)} of ${summary.billable.toFixed(1)}h billed`} tone={realTone} />
          <Tile label="Billable hours" value={summary.billable.toFixed(1)} sub={`${summary.nonBillable.toFixed(1)}h non-billable`} />
          <Tile label="Total logged" value={summary.total.toFixed(1)} sub={`${periodEntries.length} entries`} />
        </div>

        {/* Log time */}
        <div className="panel mt-4 p-6">
          <span className="eyebrow">Log time</span>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-[auto_1fr_auto_auto_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Field label="Date">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
            </Field>
            <Field label="Account">
              <Select value={accountCode} onChange={(e) => setAccountCode(e.target.value)}>
                <option value="">Internal / non-billable</option>
                {accounts.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Hours">
              <Input
                type="number"
                min="0"
                step="0.25"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0.0"
                className="w-24"
              />
            </Field>
            <Field label="Type">
              <SegmentedControl
                options={["Billable", "Non-billable"]}
                value={billable ? "Billable" : "Non-billable"}
                onChange={(v) => setBillable(v === "Billable")}
              />
            </Field>
            <div className="flex items-end">
              <Button variant="primary" type="submit" disabled={!Number(hours)}>
                Log
              </Button>
            </div>
            <div className="sm:col-span-2 xl:col-span-5">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" />
            </div>
          </form>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          {/* Per-person breakdown */}
          {teamEnabled && (
            <div className="panel p-6">
              <span className="eyebrow">Utilization by person</span>
              <div className="mt-4 flex flex-col gap-4">
                {perPerson.length === 0 ? (
                  <p className="text-body-sm text-text-muted">No time logged this period.</p>
                ) : (
                  perPerson.map((p) => (
                    <div key={p.email}>
                      <div className="flex items-center justify-between text-body-sm">
                        <span className="flex items-center gap-2 truncate text-text-secondary">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-600 text-micro font-bold">
                            {initialsFor(p.email)}
                          </span>
                          <span className="truncate">{p.email}</span>
                        </span>
                        <span className="tabular text-text-muted">
                          {p.billable.toFixed(1)}h · {pct(p.util)}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-pill bg-sunken overflow-hidden">
                        <div
                          className="h-full rounded-pill transition-[width] duration-slow ease-out"
                          style={{
                            width: `${Math.min(100, Math.round(p.util * 100))}%`,
                            background: p.util >= 0.7 ? "var(--v8-up)" : p.util >= 0.55 ? "var(--v8-warn)" : "var(--v8-down)",
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Recent entries */}
          <div className={teamEnabled ? "panel p-6 xl:col-span-2" : "panel p-6 xl:col-span-3"}>
            <span className="eyebrow">Recent entries</span>
            <div className="mt-3 flex flex-col divide-y divide-[color:var(--v8-border)]">
              {recent.length === 0 ? (
                <p className="py-3 text-body-sm text-text-muted">No time logged yet.</p>
              ) : (
                recent.map((e) => (
                  <div key={e.id} className="group flex items-center gap-3 py-2.5">
                    <span className="tabular w-20 shrink-0 text-label text-text-muted">{e.date.slice(5)}</span>
                    <span className="tabular w-14 shrink-0 text-body-sm font-semibold">{e.hours.toFixed(1)}h</span>
                    <span className="min-w-0 flex-1 truncate text-body-sm">
                      {e.accountCode ? nameByCode.get(e.accountCode) ?? e.accountCode : <span className="text-text-muted">Internal</span>}
                      {e.note && <span className="text-text-muted"> · {e.note}</span>}
                    </span>
                    {e.billable ? (
                      <button
                        onClick={() => updateEntry(e.id, { writtenOff: !e.writtenOff })}
                        title={e.writtenOff ? "Written off — click to bill" : "Billable — click to write off"}
                        className={[
                          "shrink-0 rounded-pill px-2 h-6 text-micro font-semibold transition-colors duration-fast",
                          e.writtenOff
                            ? "bg-raised text-text-muted line-through"
                            : "bg-up-soft text-up",
                        ].join(" ")}
                      >
                        {e.writtenOff ? "Written off" : "Billable"}
                      </button>
                    ) : (
                      <span className="shrink-0 rounded-pill bg-raised px-2 h-6 inline-flex items-center text-micro font-semibold text-text-muted">
                        Non-bill
                      </span>
                    )}
                    <button
                      onClick={() => removeEntry(e.id)}
                      aria-label="Delete entry"
                      className="shrink-0 text-text-faint opacity-0 transition-opacity duration-fast hover:text-down group-hover:opacity-100"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
