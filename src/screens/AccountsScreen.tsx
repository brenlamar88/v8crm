/* ----------------------------------------------------------------------------
   Accounts — the full book of engagements. Filter chips over the complete
   accounts table. The workspace V8 runs its client relationships from.
   -------------------------------------------------------------------------- */
import { useMemo, useState } from "react";
import { Topbar } from "../components/Topbar.tsx";
import { StatCard, StatCardRow } from "../components/StatCard.tsx";
import { AccountsTable } from "../components/AccountsTable.tsx";
import { useAccounts } from "../store/accounts.tsx";

const FILTERS = ["All", "Retainer", "Build", "Proposal", "Discovery", "At Risk"] as const;

export function AccountsScreen() {
  const { accounts, openNewAccount } = useAccounts();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const rows = useMemo(
    () => (filter === "All" ? accounts : accounts.filter((a) => a.stage === filter)),
    [filter],
  );

  const mrr = accounts.reduce((s, a) => s + a.mrr, 0);
  const atRisk = accounts.filter((a) => a.stage === "At Risk").length;
  const avgHealth = Math.round(accounts.reduce((s, a) => s + a.health, 0) / accounts.length);

  return (
    <>
      <Topbar title="Accounts" subtitle={`${accounts.length} engagements`} action="New account" onAction={openNewAccount} />
      <div className="px-6 py-6">
        <StatCardRow>
          <StatCard label="Book MRR" value={`$${(mrr / 1000).toFixed(1)}`} unit="K" trend={6.4} range="MTD" series={[30, 31, 33, 34, 35, 34, 35, 36]} delay={0} />
          <StatCard label="Avg Health" value={`${avgHealth}`} trend={1.1} range="30d" series={[70, 71, 70, 72, 71, 72, 70, 70]} delay={60} />
          <StatCard label="Active Retainers" value="2" trend={0} range="Now" series={[2, 2, 2, 2, 2, 2, 2, 2]} delay={120} />
          <StatCard label="At Risk" value={`${atRisk}`} trend={-3.2} range="30d" series={[0, 0, 1, 1, 1, 1, 1, 1]} delay={180} />
        </StatCardRow>

        <div className="mt-6 mb-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={[
                "rounded-pill px-4 h-8 text-label font-semibold transition-colors duration-fast ease-out",
                f === filter
                  ? "bg-accent-soft text-accent-200 border border-[color:var(--v8-accent-line)]"
                  : "bg-surface text-text-secondary border border-[color:var(--v8-border)] hover:bg-raised hover:text-text",
              ].join(" ")}
            >
              {f}
            </button>
          ))}
        </div>

        <AccountsTable
          accounts={rows}
          title={filter === "All" ? "All accounts" : filter}
          subtitle={`${rows.length} shown`}
        />
      </div>
    </>
  );
}
