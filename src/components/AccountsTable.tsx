/* ----------------------------------------------------------------------------
   AccountsTable — a dense data table primitive. Rows reveal on hover with a
   fast tinted wash; the health column pairs a bar with a value; stage uses the
   Badge tones. Numerics are tabular so columns align to the pixel.
   -------------------------------------------------------------------------- */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "./primitives.tsx";
import { Sparkline } from "./Sparkline.tsx";
import { pipelineStages, type Account, type EngagementStage } from "../data.ts";

const stageTone: Record<EngagementStage, Parameters<typeof Badge>[0]["tone"]> = {
  Discovery: "neutral",
  Proposal: "accent",
  Build: "accent",
  Retainer: "up",
  "At Risk": "down",
};

const stageRank: Record<EngagementStage, number> = pipelineStages.reduce(
  (acc, s, i) => ({ ...acc, [s.stage]: i }),
  {} as Record<EngagementStage, number>,
);

type SortKey = "name" | "stage" | "mrr" | "health";

// Comparable value per sortable column.
const sortValue: Record<SortKey, (a: Account) => number | string> = {
  name: (a) => a.name.toLowerCase(),
  stage: (a) => stageRank[a.stage],
  mrr: (a) => a.mrr,
  health: (a) => a.health,
};

function money(n: number): string {
  if (n === 0) return "—";
  return "$" + n.toLocaleString("en-US");
}

/* A sortable column header. Shows a directional caret when it's the active
   sort; a faint idle caret on hover invites the click. */
function SortHeader({
  label,
  col,
  active,
  dir,
  onSort,
  align = "left",
  className = "",
}: {
  label: string;
  col: SortKey;
  active: SortKey | null;
  dir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const isActive = active === col;
  return (
    <th className={className}>
      <button
        onClick={() => onSort(col)}
        className={[
          "group inline-flex items-center gap-1 eyebrow font-semibold transition-colors duration-fast hover:text-text-secondary",
          align === "right" ? "flex-row-reverse" : "",
          isActive ? "text-text-secondary" : "",
        ].join(" ")}
      >
        {label}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden
          className={[
            "transition-opacity duration-fast",
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40",
            isActive && dir === "asc" ? "rotate-180" : "",
          ].join(" ")}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </th>
  );
}

function healthTone(h: number): "up" | "warn" | "down" {
  if (h >= 75) return "up";
  if (h >= 55) return "warn";
  return "down";
}

export function AccountsTable({
  accounts,
  title = "Accounts",
  subtitle = "Active engagements & pipeline",
}: {
  accounts: Account[];
  title?: string;
  subtitle?: string;
}) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    if (!sortKey) return accounts;
    const pick = sortValue[sortKey];
    const dir = sortDir === "asc" ? 1 : -1;
    return [...accounts].sort((a, b) => {
      const va = pick(a);
      const vb = pick(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [accounts, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Text defaults A→Z; numbers default high→low.
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--v8-border)]">
        <div>
          <h3 className="text-h3 font-semibold">{title}</h3>
          <p className="text-body-sm text-text-muted">{subtitle}</p>
        </div>
        <Badge tone="accent" dot={false}>
          {accounts.length} total
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="[&>th]:px-5 [&>th]:py-3 [&>th]:eyebrow [&>th]:font-semibold">
              <SortHeader label="Account" col="name" active={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortHeader label="Stage" col="stage" active={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortHeader label="MRR" col="mrr" align="right" active={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortHeader label="Health" col="health" className="w-40" active={sortKey} dir={sortDir} onSort={toggleSort} />
              <th className="w-32 text-right">Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-body text-text-muted">
                  No accounts to show.
                </td>
              </tr>
            )}
            {rows.map((a) => (
              <tr
                key={a.code}
                onClick={() => navigate(`/accounts/${a.code}`)}
                className="group cursor-pointer border-t border-[color:var(--v8-border)] transition-colors duration-fast ease-out hover:bg-raised"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-200 text-label font-bold">
                      {a.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-body font-semibold">{a.name}</div>
                      <div className="tabular text-body-sm text-text-muted">
                        {a.code} · {a.vertical}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge tone={stageTone[a.stage]}>{a.stage}</Badge>
                </td>
                <td className="px-5 py-4 text-right">
                  <span className="tabular text-body font-semibold">{money(a.mrr)}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 rounded-pill bg-sunken overflow-hidden">
                      <div
                        className="h-full rounded-pill transition-[width] duration-slow ease-out"
                        style={{
                          width: `${a.health}%`,
                          background: `var(--v8-${healthTone(a.health)})`,
                        }}
                      />
                    </div>
                    <span className="tabular w-8 text-body-sm text-text-secondary">
                      {a.health}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="ml-auto w-24 opacity-80 transition-opacity duration-fast group-hover:opacity-100">
                    <Sparkline
                      data={a.trend}
                      height={28}
                      width={96}
                      tone={a.stage === "At Risk" ? "down" : "up"}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
