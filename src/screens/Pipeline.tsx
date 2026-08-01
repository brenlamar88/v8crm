/* ----------------------------------------------------------------------------
   Pipeline — a stage board of the book. One column per engagement stage, each
   headed with a count and total MRR; account cards carry a health bar and a
   mini trend and link through to the record. Columns scroll horizontally on
   narrow viewports so the board never squeezes the cards.
   -------------------------------------------------------------------------- */
import { useNavigate } from "react-router-dom";
import { Topbar } from "../components/Topbar.tsx";
import { Sparkline } from "../components/Sparkline.tsx";
import { accounts, pipelineStages, type Account } from "../data.ts";

function money(n: number): string {
  return n === 0 ? "—" : "$" + n.toLocaleString("en-US");
}
function healthTone(h: number): "up" | "warn" | "down" {
  if (h >= 75) return "up";
  if (h >= 55) return "warn";
  return "down";
}

function Card({ a }: { a: Account }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/accounts/${a.code}`)}
      className="panel group w-full p-4 text-left transition-[border-color,transform] duration-fast ease-out hover:-translate-y-0.5 hover:border-strong"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-200 text-label font-bold">
          {a.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-body font-semibold leading-snug">{a.name}</div>
          <div className="tabular text-label text-text-muted">{a.vertical}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="tabular text-body-sm font-semibold">{money(a.mrr)}</span>
        <div className="w-16 opacity-80 transition-opacity group-hover:opacity-100">
          <Sparkline data={a.trend} width={64} height={22} tone={a.stage === "At Risk" ? "down" : "up"} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="h-1 flex-1 rounded-pill bg-sunken overflow-hidden">
          <div
            className="h-full rounded-pill transition-[width] duration-slow ease-out"
            style={{ width: `${a.health}%`, background: `var(--v8-${healthTone(a.health)})` }}
          />
        </div>
        <span className="tabular w-6 text-label text-text-muted">{a.health}</span>
      </div>
    </button>
  );
}

export function Pipeline() {
  const total = accounts.reduce((s, a) => s + a.mrr, 0);

  return (
    <>
      <Topbar title="Pipeline" subtitle={`${accounts.length} engagements · ${money(total)} in play`} action="New deal" />
      <div className="px-6 py-6">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineStages.map(({ stage, tint }) => {
            const rows = accounts.filter((a) => a.stage === stage);
            const colMrr = rows.reduce((s, a) => s + a.mrr, 0);
            return (
              <section key={stage} className="flex w-64 shrink-0 flex-col">
                <header className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: tint }} />
                    <span className="text-body-sm font-semibold">{stage}</span>
                    <span className="tabular text-label text-text-muted">{rows.length}</span>
                  </div>
                  {colMrr > 0 && (
                    <span className="tabular text-label text-text-muted">{money(colMrr)}</span>
                  )}
                </header>
                <div className="flex flex-col gap-3 rounded-lg bg-surface/40 p-2 min-h-24">
                  {rows.length === 0 ? (
                    <div className="grid h-24 place-items-center text-label text-text-faint">Empty</div>
                  ) : (
                    rows.map((a) => <Card key={a.code} a={a} />)
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
