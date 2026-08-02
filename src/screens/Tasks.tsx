/* ----------------------------------------------------------------------------
   Tasks — every follow-up across the book in one list. Aggregates each account's
   tasks, filters by open/done, checks off inline, and links each to its record.
   Open tasks first, then completed.
   -------------------------------------------------------------------------- */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../components/Topbar.tsx";
import { useAccounts } from "../store/accounts.tsx";
import type { Task } from "../data.ts";

type Row = Task & { account: string; code: string };
type Filter = "Open" | "Done" | "All";
const FILTERS: Filter[] = ["Open", "All", "Done"];

export function Tasks() {
  const { accounts, toggleTask } = useAccounts();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("Open");

  const all = useMemo<Row[]>(
    () =>
      accounts
        .flatMap((a) => a.tasks.map((t) => ({ ...t, account: a.name, code: a.code })))
        // Open first, then done.
        .sort((x, y) => Number(x.done) - Number(y.done)),
    [accounts],
  );

  const rows = all.filter((r) =>
    filter === "All" ? true : filter === "Open" ? !r.done : r.done,
  );
  const openCount = all.filter((r) => !r.done).length;

  return (
    <>
      <Topbar title="Tasks" subtitle={`${openCount} open across ${accounts.length} accounts`} />
      <div className="px-6 py-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
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

        <div className="panel divide-y divide-[color:var(--v8-border)]">
          {rows.length === 0 ? (
            <div className="grid h-32 place-items-center text-body text-text-muted">
              {filter === "Open" ? "No open tasks — nice." : "No tasks here."}
            </div>
          ) : (
            rows.map((r) => (
              <div key={`${r.code}-${r.id}`} className="group flex items-center gap-3 px-5 py-4">
                <button
                  onClick={() => toggleTask(r.code, r.id)}
                  aria-label={r.done ? "Mark incomplete" : "Mark complete"}
                  className={[
                    "grid h-5 w-5 shrink-0 place-items-center rounded-sm border transition-colors duration-fast",
                    r.done
                      ? "border-[color:var(--v8-accent-500)] bg-accent-500 text-base"
                      : "border-[color:var(--v8-border-strong)] hover:border-accent",
                  ].join(" ")}
                >
                  {r.done && (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M4 10.5l4 4 8-9" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => navigate(`/accounts/${r.code}`)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className={["flex-1 truncate text-body", r.done ? "text-text-muted line-through" : "text-text"].join(" ")}>
                    {r.title}
                  </span>
                  <span className="shrink-0 text-label text-text-secondary group-hover:text-accent-200 transition-colors duration-fast">
                    {r.account}
                  </span>
                </button>
                {r.due && <span className="tabular shrink-0 text-label text-text-muted">{r.due}</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
