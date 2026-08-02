/* ----------------------------------------------------------------------------
   Overview — the console home. A KPI band, the revenue panel, and a compact
   view of the accounts that need attention. Assembled entirely from primitives.
   -------------------------------------------------------------------------- */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Topbar } from "../components/Topbar.tsx";
import { SegmentedControl } from "../components/primitives.tsx";
import { StatCard, StatCardRow } from "../components/StatCard.tsx";
import { Sparkline } from "../components/Sparkline.tsx";
import { AccountsTable } from "../components/AccountsTable.tsx";
import { useAccounts } from "../store/accounts.tsx";
import { revenueSeries, dueLabel, dueStatus, dueSortKey } from "../data.ts";

export function Overview() {
  const { accounts, openNewAccount, toggleTask } = useAccounts();
  const [range, setRange] = useState("1M");
  const attention = accounts.filter((a) => a.health < 80).slice(0, 4);
  const openTasks = accounts
    .flatMap((a) => a.tasks.filter((t) => !t.done).map((t) => ({ ...t, account: a.name, code: a.code })))
    // Soonest and overdue first; undated last.
    .sort((x, y) => dueSortKey(x) - dueSortKey(y))
    .slice(0, 5);

  return (
    <>
      <Topbar
        title="Overview"
        subtitle="Tuesday, August 1 · your book at a glance"
        action="New account"
        onAction={openNewAccount}
      />
      <div className="px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="eyebrow">Performance</span>
          <SegmentedControl
            options={["1W", "1M", "1Q", "1Y"]}
            value={range}
            onChange={setRange}
          />
        </div>

        <StatCardRow>
          <StatCard label="Recurring Revenue" value="$41.6" unit="K" trend={8.27} range={range} series={[28, 30, 29, 33, 36, 34, 39, 42]} delay={0} />
          <StatCard label="Pipeline Value" value="$228" unit="K" trend={4.12} range={range} series={[10, 12, 11, 14, 13, 16, 18, 21]} delay={60} />
          <StatCard label="Win Rate" value="61" unit="%" trend={-1.42} range={range} series={[18, 17, 17, 15, 16, 14, 13, 13]} delay={120} />
          <StatCard label="Active Engagements" value="9" trend={2.4} range={range} series={[5, 5, 6, 6, 7, 7, 8, 9]} delay={180} />
        </StatCardRow>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          {/* Revenue panel spans two columns on wide screens. */}
          <div className="panel p-6 xl:col-span-2 animate-fade-rise" style={{ animationDelay: "220ms" }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="eyebrow">Revenue · trailing 30 days</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="tabular text-display font-bold leading-tight">$93.4</span>
                  <span className="tabular text-h2 font-semibold text-text-muted">K</span>
                </div>
              </div>
              <div className="rounded-md border border-[color:var(--v8-border-strong)] bg-overlay px-3 py-2 shadow-md">
                <div className="eyebrow">Peak day</div>
                <div className="tabular mt-1 text-body font-semibold">$93,420</div>
              </div>
            </div>
            <div className="mt-6">
              <Sparkline data={revenueSeries} height={132} tone="accent" />
            </div>
          </div>

          {/* Right column: pipeline snapshot + open tasks. */}
          <div className="flex flex-col gap-4">
          <div className="panel p-6 animate-fade-rise" style={{ animationDelay: "300ms" }}>
            <span className="eyebrow">Pipeline by stage</span>
            <div className="mt-5 flex flex-col gap-4">
              {[
                { stage: "Discovery", count: 2, pct: 30, tone: "var(--v8-text-muted)" },
                { stage: "Proposal", count: 1, pct: 18, tone: "var(--v8-accent-400)" },
                { stage: "Build", count: 1, pct: 22, tone: "var(--v8-accent-500)" },
                { stage: "Retainer", count: 2, pct: 46, tone: "var(--v8-up)" },
              ].map((r) => (
                <div key={r.stage}>
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-text-secondary">{r.stage}</span>
                    <span className="tabular text-text-muted">{r.count}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-pill bg-sunken overflow-hidden">
                    <div
                      className="h-full rounded-pill transition-[width] duration-slow ease-out"
                      style={{ width: `${r.pct}%`, background: r.tone }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-6 animate-fade-rise" style={{ animationDelay: "360ms" }}>
            <div className="flex items-center justify-between">
              <span className="eyebrow">Open tasks</span>
              <Link to="/tasks" className="text-label font-semibold text-accent-400 hover:text-accent-200 transition-colors duration-fast">
                View all
              </Link>
            </div>
            <div className="mt-4 flex flex-col">
              {openTasks.length === 0 ? (
                <p className="py-2 text-body-sm text-text-muted">Nothing open — you're clear.</p>
              ) : (
                openTasks.map((t) => (
                  <div key={`${t.code}-${t.id}`} className="flex items-center gap-3 border-b border-[color:var(--v8-border)] py-2.5 last:border-0">
                    <button
                      onClick={() => toggleTask(t.code, t.id)}
                      aria-label="Mark complete"
                      className="grid h-4 w-4 shrink-0 place-items-center rounded-sm border border-[color:var(--v8-border-strong)] hover:border-accent transition-colors duration-fast"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-body-sm text-text">{t.title}</div>
                      <div className="truncate text-label text-text-muted">{t.account}</div>
                    </div>
                    {dueLabel(t) && (
                      <span
                        className={[
                          "tabular shrink-0 text-label",
                          dueStatus(t) === "overdue"
                            ? "font-semibold text-down"
                            : dueStatus(t) === "today"
                              ? "font-semibold text-warn"
                              : "text-text-muted",
                        ].join(" ")}
                      >
                        {dueLabel(t)}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          </div>
        </div>

        <div className="mt-4">
          <AccountsTable accounts={attention} title="Needs attention" subtitle="Accounts below 80 health" />
        </div>
      </div>
    </>
  );
}
