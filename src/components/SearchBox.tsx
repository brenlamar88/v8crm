/* ----------------------------------------------------------------------------
   SearchBox — the global account finder in the topbar. Filters the book by
   name, code, or vertical as you type and drops a result list; Enter opens the
   top hit, arrows move, Escape closes. Results link to the record.
   -------------------------------------------------------------------------- */
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconSearch } from "./icons.tsx";
import { Badge } from "./primitives.tsx";
import { useAccounts } from "../store/accounts.tsx";
import type { Account, EngagementStage } from "../data.ts";

const stageTone: Record<EngagementStage, Parameters<typeof Badge>[0]["tone"]> = {
  Discovery: "neutral",
  Proposal: "accent",
  Build: "accent",
  Retainer: "up",
  "At Risk": "down",
};

export function SearchBox() {
  const { accounts } = useAccounts();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const blurTimer = useRef<number | undefined>(undefined);

  const results = useMemo<Account[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return accounts
      .filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          a.vertical.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [query, accounts]);

  function choose(a: Account) {
    navigate(`/accounts/${a.code}`);
    setQuery("");
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      choose(results[active]);
    }
  }

  const showList = open && query.trim().length > 0;

  return (
    <div className="relative hidden md:block">
      <label className="flex items-center gap-2 rounded-md border border-[color:var(--v8-border)] bg-surface px-3 h-9 w-72 text-text-muted focus-within:border-accent focus-within:text-text-secondary transition-colors duration-fast">
        <IconSearch width={16} height={16} />
        <input
          className="w-full bg-transparent text-body text-text placeholder:text-text-muted outline-none"
          placeholder="Search accounts, deals…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = window.setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={onKeyDown}
        />
        {query ? (
          <span className="tabular text-micro text-text-faint">{results.length}</span>
        ) : (
          <kbd className="rounded-sm border border-[color:var(--v8-border-strong)] bg-raised px-1.5 py-0.5 text-micro text-text-muted">
            ⌘K
          </kbd>
        )}
      </label>

      {showList && (
        <div
          className="absolute right-0 mt-2 w-80 overflow-hidden rounded-lg border border-[color:var(--v8-border-strong)] bg-overlay shadow-lg animate-fade-rise"
          style={{ animationDuration: "var(--v8-dur-fast)" }}
          onMouseDown={() => window.clearTimeout(blurTimer.current)}
        >
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-body-sm text-text-muted">
              No accounts match “{query.trim()}”.
            </div>
          ) : (
            results.map((a, i) => (
              <button
                key={a.code}
                onClick={() => choose(a)}
                onMouseEnter={() => setActive(i)}
                className={[
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-fast",
                  i === active ? "bg-raised" : "hover:bg-raised",
                ].join(" ")}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-200 text-label font-bold">
                  {a.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-body-sm font-semibold">{a.name}</div>
                  <div className="tabular text-label text-text-muted">{a.code} · {a.vertical}</div>
                </div>
                <Badge tone={stageTone[a.stage]}>{a.stage}</Badge>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
