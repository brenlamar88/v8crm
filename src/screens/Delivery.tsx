/* ----------------------------------------------------------------------------
   Delivery — engineering & AI quality across the book. The client-facing proof
   that V8 ships: DORA four keys, AI-eval quality, and service signals, rolled up
   across engagements and tinted against benchmarks, with a per-engagement table.
   -------------------------------------------------------------------------- */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Topbar } from "../components/Topbar.tsx";
import { useAccounts } from "../store/accounts.tsx";
import {
  DELIVERY_METRICS,
  hasDelivery,
  metricTone,
  rollupMetric,
  type MetricSpec,
  type Tone,
} from "../lib/metrics.ts";

const GROUPS: MetricSpec["group"][] = ["DORA", "AI quality", "Service"];
const GROUP_NOTE: Record<MetricSpec["group"], string> = {
  DORA: "Software delivery — throughput & stability",
  "AI quality": "Model behavior in production",
  Service: "Reliability & open work",
};

function toneText(tone?: Tone): string {
  return tone === "up" ? "text-up" : tone === "warn" ? "text-warn" : tone === "down" ? "text-down" : "text-text";
}
function toneBg(tone?: Tone): string {
  return tone === "up" ? "bg-up-soft text-up" : tone === "warn" ? "bg-warn-soft text-warn" : tone === "down" ? "bg-down-soft text-down" : "text-text-muted";
}

export function Delivery() {
  const { accounts } = useAccounts();
  const reporting = useMemo(() => accounts.filter(hasDelivery), [accounts]);

  // Columns for the per-engagement table (a compact, high-signal subset).
  const cols = useMemo(
    () => DELIVERY_METRICS.filter((m) => m.key !== "costPerTask" && m.key !== "mttrHours"),
    [],
  );

  return (
    <>
      <Topbar title="Delivery" subtitle={`Engineering & AI quality · ${reporting.length} engagements reporting`} />
      <div className="px-6 py-6">
        {reporting.length === 0 ? (
          <div className="panel grid h-40 place-items-center text-body text-text-muted">
            No delivery metrics yet — add them from an account's Delivery panel.
          </div>
        ) : (
          <>
            {GROUPS.map((group) => {
              const specs = DELIVERY_METRICS.filter((m) => m.group === group);
              return (
                <div key={group} className="mb-6">
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="eyebrow">{group}</span>
                    <span className="text-label text-text-muted">{GROUP_NOTE[group]}</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {specs.map((spec) => {
                      const r = rollupMetric(accounts, spec);
                      const tone = r ? metricTone(spec, r.value) : undefined;
                      return (
                        <div key={spec.key} className="panel p-5">
                          <div className="flex items-center justify-between">
                            <div className="eyebrow">{spec.label}</div>
                            {spec.rollup === "sum" && r && <div className="text-micro text-text-muted">total</div>}
                          </div>
                          <div className={["tabular mt-2 text-h1 font-bold leading-none", toneText(tone)].join(" ")}>
                            {r ? spec.format(r.value) : "—"}
                          </div>
                          <div className="mt-1.5 text-label text-text-muted">
                            {r ? `${spec.rollup === "avg" ? "avg · " : ""}${r.n} engagement${r.n === 1 ? "" : "s"}` : "no data"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Per-engagement table */}
            <div className="panel p-6">
              <span className="eyebrow">By engagement</span>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-body-sm">
                  <thead>
                    <tr className="text-left text-label text-text-muted">
                      <th className="whitespace-nowrap pb-3 pr-4 font-semibold">Engagement</th>
                      {cols.map((c) => (
                        <th key={c.key} className="whitespace-nowrap px-3 pb-3 text-right font-semibold">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reporting.map((a) => (
                      <tr key={a.code} className="border-t border-[color:var(--v8-border)]">
                        <td className="whitespace-nowrap py-2.5 pr-4">
                          <Link to={`/accounts/${a.code}`} className="font-medium hover:text-accent-200 transition-colors duration-fast">
                            {a.name}
                          </Link>
                          <span className="tabular ml-2 text-label text-text-muted">{a.code}</span>
                        </td>
                        {cols.map((c) => {
                          const v = a.delivery?.[c.key];
                          if (typeof v !== "number") {
                            return <td key={c.key} className="px-3 py-2.5 text-right text-text-faint">—</td>;
                          }
                          const tone = metricTone(c, v);
                          return (
                            <td key={c.key} className="px-3 py-2.5 text-right">
                              <span className={["tabular inline-block rounded-sm px-1.5 py-0.5 text-label font-semibold", toneBg(tone)].join(" ")}>
                                {c.format(v)}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
