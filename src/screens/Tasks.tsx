/* ----------------------------------------------------------------------------
   Tasks — every follow-up across the book in one list. Aggregates each account's
   tasks, filters by open/overdue/done, checks off inline, and links each to its
   record. Sorted open-first, then by due date (soonest — and overdue — first).
   -------------------------------------------------------------------------- */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../components/Topbar.tsx";
import { AssigneeChip } from "../components/AssigneeChip.tsx";
import { useAccounts } from "../store/accounts.tsx";
import { useWorkspace } from "../store/workspace.tsx";
import { useAuth } from "../store/auth.tsx";
import { type Task, dueLabel, dueStatus, dueSortKey } from "../data.ts";

type Row = Task & { account: string; code: string };
type Filter = "Open" | "Mine" | "Overdue" | "All" | "Done";

/** Due-label color: overdue red, due-today amber, done faint, else muted. */
function dueClass(t: Row): string {
  if (t.done) return "text-text-faint";
  const s = dueStatus(t);
  if (s === "overdue") return "font-semibold text-down";
  if (s === "today") return "font-semibold text-warn";
  return "text-text-muted";
}

export function Tasks() {
  const { accounts, toggleTask } = useAccounts();
  const { enabled: teamEnabled } = useWorkspace();
  const { user } = useAuth();
  const me = (user?.email ?? "").toLowerCase();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("Open");

  // "Mine" only makes sense with a signed-in team; hide it otherwise.
  const filters: Filter[] = teamEnabled
    ? ["Open", "Mine", "Overdue", "All", "Done"]
    : ["Open", "Overdue", "All", "Done"];

  const all = useMemo<Row[]>(
    () =>
      accounts
        .flatMap((a) => a.tasks.map((t) => ({ ...t, account: a.name, code: a.code })))
        // Open before done; within a group, soonest (and overdue) due first,
        // undated last.
        .sort((x, y) =>
          x.done !== y.done ? Number(x.done) - Number(y.done) : dueSortKey(x) - dueSortKey(y),
        ),
    [accounts],
  );

  const openCount = all.filter((r) => !r.done).length;
  const overdueCount = all.filter((r) => !r.done && dueStatus(r) === "overdue").length;

  const rows = all.filter((r) =>
    filter === "All"
      ? true
      : filter === "Open"
        ? !r.done
        : filter === "Mine"
          ? !r.done && (r.assignee ?? "").toLowerCase() === me
          : filter === "Overdue"
            ? !r.done && dueStatus(r) === "overdue"
            : r.done,
  );

  const subtitle =
    `${openCount} open` +
    (overdueCount > 0 ? ` · ${overdueCount} overdue` : "") +
    ` across ${accounts.length} accounts`;

  return (
    <>
      <Topbar title="Tasks" subtitle={subtitle} />
      <div className="px-6 py-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {filters.map((f) => {
            const isOverdue = f === "Overdue";
            const count = isOverdue ? overdueCount : 0;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={[
                  "inline-flex items-center gap-2 rounded-pill px-4 h-8 text-label font-semibold transition-colors duration-fast ease-out",
                  f === filter
                    ? "bg-accent-soft text-accent-200 border border-[color:var(--v8-accent-line)]"
                    : "bg-surface text-text-secondary border border-[color:var(--v8-border)] hover:bg-raised hover:text-text",
                ].join(" ")}
              >
                {f}
                {isOverdue && count > 0 && (
                  <span className="tabular grid h-4 min-w-4 place-items-center rounded-pill bg-down-soft px-1 text-micro font-bold text-down">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="panel divide-y divide-[color:var(--v8-border)]">
          {rows.length === 0 ? (
            <div className="grid h-32 place-items-center text-body text-text-muted">
              {filter === "Open"
                ? "No open tasks — nice."
                : filter === "Mine"
                  ? "Nothing assigned to you."
                  : filter === "Overdue"
                    ? "Nothing overdue — you're on top of it."
                    : "No tasks here."}
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
                {dueLabel(r) && (
                  <span className={["tabular shrink-0 text-label", dueClass(r)].join(" ")}>
                    {dueLabel(r)}
                  </span>
                )}
                {teamEnabled && <AssigneeChip email={r.assignee} size={22} />}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
