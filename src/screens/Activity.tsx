/* ----------------------------------------------------------------------------
   Activity — one feed of every touch across the whole book. Flattens each
   account's timeline, attributes it, orders by recency, and filters by kind.
   Rows link through to the account record.
   -------------------------------------------------------------------------- */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../components/Topbar.tsx";
import { KindMarker } from "../components/Timeline.tsx";
import { useAccounts } from "../store/accounts.tsx";
import { agoMinutes, type TimelineEvent, type TimelineKind } from "../data.ts";

type FeedRow = TimelineEvent & { account: string; code: string };

const FILTERS: ("All" | TimelineKind)[] = ["All", "note", "call", "email", "ship", "risk"];

export function Activity() {
  const { accounts } = useAccounts();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const feed = useMemo<FeedRow[]>(() => {
    const rows = accounts.flatMap((a) =>
      a.timeline.map((e) => ({ ...e, account: a.name, code: a.code })),
    );
    return rows.sort((x, y) => agoMinutes(x.when) - agoMinutes(y.when));
  }, [accounts]);

  const rows = filter === "All" ? feed : feed.filter((r) => r.kind === filter);

  return (
    <>
      <Topbar title="Activity" subtitle={`${feed.length} touches across ${accounts.length} accounts`} />
      <div className="px-6 py-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={[
                "rounded-pill px-4 h-8 text-label font-semibold capitalize transition-colors duration-fast ease-out",
                f === filter
                  ? "bg-accent-soft text-accent-200 border border-[color:var(--v8-accent-500)]/40"
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
              No {filter === "All" ? "" : filter} activity yet.
            </div>
          ) : (
            rows.map((r, i) => (
              <button
                key={`${r.code}-${i}`}
                onClick={() => navigate(`/accounts/${r.code}`)}
                className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors duration-fast ease-out hover:bg-raised/60"
              >
                <KindMarker kind={r.kind} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body text-text">{r.text}</p>
                  <p className="mt-0.5 text-label text-text-muted">
                    <span className="text-text-secondary group-hover:text-accent-200 transition-colors duration-fast">
                      {r.account}
                    </span>
                    {" · "}
                    <span className="tabular">{r.code}</span>
                  </p>
                </div>
                <span className="tabular shrink-0 text-label text-text-muted">{r.when}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
