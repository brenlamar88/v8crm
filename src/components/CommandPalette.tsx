/* ----------------------------------------------------------------------------
   CommandPalette — the ⌘K / Ctrl-K overlay. Fuzzy-free but fast: type to filter
   navigation commands and accounts together, arrow to move, Enter to go, Escape
   to close. Top-aligned and search-first, distinct from the centered Modal.
   -------------------------------------------------------------------------- */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccounts } from "../store/accounts.tsx";
import {
  IconOverview,
  IconAccounts,
  IconPipeline,
  IconActivity,
  IconReports,
  IconSystem,
  IconSettings,
  IconSearch,
} from "./icons.tsx";
import type { ComponentType, SVGProps } from "react";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

interface Item {
  id: string;
  label: string;
  hint: string;
  to: string;
  icon: Icon;
}

const NAV: Item[] = [
  { id: "n-overview", label: "Overview", hint: "Go to", to: "/", icon: IconOverview },
  { id: "n-accounts", label: "Accounts", hint: "Go to", to: "/accounts", icon: IconAccounts },
  { id: "n-pipeline", label: "Pipeline", hint: "Go to", to: "/pipeline", icon: IconPipeline },
  { id: "n-activity", label: "Activity", hint: "Go to", to: "/activity", icon: IconActivity },
  { id: "n-reports", label: "Reports", hint: "Go to", to: "/reports", icon: IconReports },
  { id: "n-design", label: "Design System", hint: "Go to", to: "/styleguide", icon: IconSystem },
  { id: "n-settings", label: "Settings", hint: "Go to", to: "/settings", icon: IconSettings },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { accounts } = useAccounts();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase();
    const nav = q ? NAV.filter((n) => n.label.toLowerCase().includes(q)) : NAV;
    const accts: Item[] = accounts
      .filter(
        (a) =>
          !q ||
          a.name.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          a.vertical.toLowerCase().includes(q),
      )
      .slice(0, q ? 6 : 4)
      .map((a) => ({
        id: `a-${a.code}`,
        label: a.name,
        hint: `${a.code} · ${a.vertical}`,
        to: `/accounts/${a.code}`,
        icon: IconAccounts,
      }));
    return [...nav, ...accts];
  }, [query, accounts]);

  // Reset query + selection each time it opens; focus the input.
  useEffect(() => {
    if (!open) return;
    // Remember the opener so focus can return to it on close.
    const opener = document.activeElement as HTMLElement | null;
    setQuery("");
    setActive(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      opener?.focus?.();
    };
  }, [open, onClose]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  function choose(item: Item) {
    navigate(item.to);
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      choose(items[active]);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command palette">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-[color:var(--v8-scrim)] backdrop-blur-sm animate-fade-rise"
        style={{ animationDuration: "var(--v8-dur-fast)" }}
      />
      <div className="relative z-10 h-fit w-full max-w-xl overflow-hidden rounded-xl border border-[color:var(--v8-border-strong)] bg-surface shadow-lg animate-fade-rise">
        <div className="flex items-center gap-3 border-b border-[color:var(--v8-border)] px-4 h-12">
          <IconSearch width={18} height={18} className="text-text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to a screen or account…"
            className="h-full w-full bg-transparent text-body text-text placeholder:text-text-muted outline-none"
          />
          <kbd className="rounded-sm border border-[color:var(--v8-border-strong)] bg-raised px-1.5 py-0.5 text-micro text-text-muted">
            ESC
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto py-2">
          {items.length === 0 ? (
            <div className="px-4 py-6 text-center text-body-sm text-text-muted">No matches.</div>
          ) : (
            items.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => choose(item)}
                  onMouseEnter={() => setActive(i)}
                  className={[
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-fast",
                    i === active ? "bg-raised" : "hover:bg-raised",
                  ].join(" ")}
                >
                  <span className={i === active ? "text-accent-400" : "text-text-muted"}>
                    <Icon width={18} height={18} />
                  </span>
                  <span className="flex-1 truncate text-body">{item.label}</span>
                  <span className="tabular shrink-0 text-label text-text-muted">{item.hint}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-[color:var(--v8-border)] px-4 py-2.5 text-micro text-text-muted">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded-sm border border-[color:var(--v8-border-strong)] bg-raised px-1.5 py-0.5">↑↓</kbd>
            move
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded-sm border border-[color:var(--v8-border-strong)] bg-raised px-1.5 py-0.5">↵</kbd>
            open
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded-sm border border-[color:var(--v8-border-strong)] bg-raised px-1.5 py-0.5">N</kbd>
            new account
          </span>
        </div>
      </div>
    </div>
  );
}
