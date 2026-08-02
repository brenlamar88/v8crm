/* ----------------------------------------------------------------------------
   Reports — a read-only rollup of the book: headline totals, a breakdown by
   vertical and by stage, and a one-click CSV export. All derived live from the
   store, so it reflects created accounts and stage changes immediately.
   -------------------------------------------------------------------------- */
import { useMemo } from "react";
import { Topbar } from "../components/Topbar.tsx";
import { Button } from "../components/primitives.tsx";
import { useAccounts } from "../store/accounts.tsx";
import { pipelineStages, type Account } from "../data.ts";
import { accountsToCsv, downloadText } from "../lib/export.ts";

function money(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

interface Group {
  key: string;
  count: number;
  mrr: number;
  avgHealth: number;
  tint?: string;
}

function groupBy(accounts: Account[], pick: (a: Account) => string): Group[] {
  const map = new Map<string, Account[]>();
  for (const a of accounts) {
    const k = pick(a);
    (map.get(k) ?? map.set(k, []).get(k)!).push(a);
  }
  return [...map.entries()].map(([key, list]) => ({
    key,
    count: list.length,
    mrr: list.reduce((s, a) => s + a.mrr, 0),
    avgHealth: Math.round(list.reduce((s, a) => s + a.health, 0) / list.length),
  }));
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="panel p-5">
      <div className="eyebrow">{label}</div>
      <div className="tabular mt-2 text-display font-bold leading-tight">{value}</div>
      <div className="mt-1 text-body-sm text-text-muted">{sub}</div>
    </div>
  );
}

function BreakdownTable({
  title,
  groups,
  maxMrr,
}: {
  title: string;
  groups: Group[];
  maxMrr: number;
}) {
  return (
    <div className="panel overflow-hidden">
      <div className="px-5 py-4 border-b border-[color:var(--v8-border)]">
        <h3 className="text-h3 font-semibold">{title}</h3>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="[&>th]:px-5 [&>th]:py-3 [&>th]:eyebrow [&>th]:font-semibold">
            <th>Segment</th>
            <th className="text-right">Accounts</th>
            <th className="text-right">MRR</th>
            <th className="w-40">Share</th>
            <th className="text-right">Avg health</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.key} className="border-t border-[color:var(--v8-border)]">
              <td className="px-5 py-3">
                <span className="inline-flex items-center gap-2 text-body font-medium">
                  {g.tint && <span className="h-2 w-2 rounded-full" style={{ background: g.tint }} />}
                  {g.key}
                </span>
              </td>
              <td className="tabular px-5 py-3 text-right text-body">{g.count}</td>
              <td className="tabular px-5 py-3 text-right text-body font-semibold">{money(g.mrr)}</td>
              <td className="px-5 py-3">
                <div className="h-1.5 rounded-pill bg-sunken overflow-hidden">
                  <div
                    className="h-full rounded-pill bg-accent-500 transition-[width] duration-slow ease-out"
                    style={{ width: `${maxMrr ? (g.mrr / maxMrr) * 100 : 0}%` }}
                  />
                </div>
              </td>
              <td className="tabular px-5 py-3 text-right text-body-sm text-text-secondary">{g.avgHealth}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Reports() {
  const { accounts } = useAccounts();

  const { mrr, arr, avgHealth, byVertical, byStage, maxV, maxS } = useMemo(() => {
    const mrr = accounts.reduce((s, a) => s + a.mrr, 0);
    const avgHealth = accounts.length
      ? Math.round(accounts.reduce((s, a) => s + a.health, 0) / accounts.length)
      : 0;
    const byVertical = groupBy(accounts, (a) => a.vertical).sort((x, y) => y.mrr - x.mrr);
    const stageOrder = pipelineStages.map((s) => s.stage);
    const byStage = groupBy(accounts, (a) => a.stage)
      .map((g) => ({ ...g, tint: pipelineStages.find((s) => s.stage === g.key)?.tint }))
      .sort((x, y) => stageOrder.indexOf(x.key as never) - stageOrder.indexOf(y.key as never));
    return {
      mrr,
      arr: mrr * 12,
      avgHealth,
      byVertical,
      byStage,
      maxV: Math.max(1, ...byVertical.map((g) => g.mrr)),
      maxS: Math.max(1, ...byStage.map((g) => g.mrr)),
    };
  }, [accounts]);

  function exportCsv() {
    downloadText("v8-crm-accounts.csv", accountsToCsv(accounts));
  }

  return (
    <>
      <Topbar title="Reports" subtitle="A rollup of the book" />
      <div className="px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="eyebrow">As of today</span>
          <Button
            variant="subtle"
            onClick={exportCsv}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3v12M7 11l5 4 5-4M5 21h14" />
              </svg>
            }
          >
            Export CSV
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Total MRR" value={money(mrr)} sub="Across the book" />
          <Stat label="Annualized" value={money(arr)} sub="MRR × 12" />
          <Stat label="Accounts" value={`${accounts.length}`} sub="Active engagements" />
          <Stat label="Avg Health" value={`${avgHealth}`} sub="Weighted evenly" />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <BreakdownTable title="By vertical" groups={byVertical} maxMrr={maxV} />
          <BreakdownTable title="By stage" groups={byStage} maxMrr={maxS} />
        </div>
      </div>
    </>
  );
}
