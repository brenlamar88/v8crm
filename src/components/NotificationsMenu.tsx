/* ----------------------------------------------------------------------------
   NotificationsMenu — the topbar bell. Surfaces what needs the principal's
   attention: at-risk accounts and the most recent activity across the book.
   A dot marks unseen attention items; the panel closes on outside click.
   -------------------------------------------------------------------------- */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconBell } from "./icons.tsx";
import { KindMarker } from "./Timeline.tsx";
import { useAccounts } from "../store/accounts.tsx";
import { agoMinutes, dueLabel, dueStatus, dueSortKey } from "../data.ts";

export function NotificationsMenu() {
  const { accounts } = useAccounts();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const atRisk = useMemo(
    () => accounts.filter((a) => a.stage === "At Risk" || a.health < 50),
    [accounts],
  );

  // Open tasks that are overdue or due today, soonest first — the time-sensitive
  // follow-ups worth surfacing on the bell.
  const dueTasks = useMemo(
    () =>
      accounts
        .flatMap((a) => a.tasks.map((t) => ({ ...t, account: a.name, code: a.code })))
        .filter((t) => !t.done && (dueStatus(t) === "overdue" || dueStatus(t) === "today"))
        .sort((x, y) => dueSortKey(x) - dueSortKey(y))
        .slice(0, 4),
    [accounts],
  );

  const alertCount = atRisk.length + dueTasks.length;

  const recent = useMemo(
    () =>
      accounts
        .flatMap((a) => a.timeline.map((e) => ({ ...e, account: a.name, code: a.code })))
        .sort((x, y) => agoMinutes(x.when) - agoMinutes(y.when))
        .slice(0, 4),
    [accounts],
  );

  function go(code: string) {
    setOpen(false);
    navigate(`/accounts/${code}`);
  }

  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-md text-text-muted hover:text-text hover:bg-raised transition-colors duration-fast ease-out"
      >
        <IconBell />
        {alertCount > 0 && (
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-down" />
        )}
      </button>

      {open && (
        <>
          <button
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-[color:var(--v8-border-strong)] bg-overlay shadow-lg animate-fade-rise"
            style={{ animationDuration: "var(--v8-dur-fast)" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--v8-border)]">
              <span className="text-body-sm font-semibold">Notifications</span>
              {alertCount === 0 && (
                <span className="text-micro text-text-muted">All clear</span>
              )}
            </div>

            {dueTasks.length > 0 && (
              <div className="py-1">
                <div className="eyebrow px-4 pt-2 pb-1">Due &amp; overdue</div>
                {dueTasks.map((t) => (
                  <button
                    key={`${t.code}-${t.id}`}
                    onClick={() => go(t.code)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-fast hover:bg-raised"
                  >
                    <span
                      className={[
                        "grid h-8 w-8 shrink-0 place-items-center rounded-md",
                        dueStatus(t) === "overdue" ? "bg-down-soft text-down" : "bg-warn-soft text-warn",
                      ].join(" ")}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-body-sm font-medium">{t.title}</div>
                      <div className="text-label text-text-muted">
                        {t.account} ·{" "}
                        <span className={dueStatus(t) === "overdue" ? "font-semibold text-down" : "font-semibold text-warn"}>
                          {dueLabel(t)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {atRisk.length > 0 && (
              <div className={dueTasks.length > 0 ? "py-1 border-t border-[color:var(--v8-border)]" : "py-1"}>
                <div className="eyebrow px-4 pt-2 pb-1">Needs attention</div>
                {atRisk.map((a) => (
                  <button
                    key={a.code}
                    onClick={() => go(a.code)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-fast hover:bg-raised"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-down-soft text-down">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M10 3l8 14H2zM10 8v4M10 15h.01" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-body-sm font-semibold">{a.name}</div>
                      <div className="tabular text-label text-text-muted">
                        {a.stage === "At Risk" ? "At risk" : `Health ${a.health}`} · {a.code}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="py-1 border-t border-[color:var(--v8-border)]">
              <div className="eyebrow px-4 pt-2 pb-1">Recent activity</div>
              {recent.map((r, i) => (
                <button
                  key={`${r.code}-${i}`}
                  onClick={() => go(r.code)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-fast hover:bg-raised"
                >
                  <KindMarker kind={r.kind} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-body-sm">{r.text}</div>
                    <div className="text-label text-text-muted">
                      {r.account} · {r.when}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
