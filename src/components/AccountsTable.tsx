/* ----------------------------------------------------------------------------
   AccountsTable — a dense data table primitive. Rows reveal on hover with a
   fast tinted wash; the health column pairs a bar with a value; stage uses the
   Badge tones. Numerics are tabular so columns align to the pixel.
   -------------------------------------------------------------------------- */
import { Badge } from "./primitives.tsx";
import { Sparkline } from "./Sparkline.tsx";
import type { Account, EngagementStage } from "../data.ts";

const stageTone: Record<EngagementStage, Parameters<typeof Badge>[0]["tone"]> = {
  Discovery: "neutral",
  Proposal: "accent",
  Build: "accent",
  Retainer: "up",
  "At Risk": "down",
};

function money(n: number): string {
  if (n === 0) return "—";
  return "$" + n.toLocaleString("en-US");
}

function healthTone(h: number): "up" | "warn" | "down" {
  if (h >= 75) return "up";
  if (h >= 55) return "warn";
  return "down";
}

export function AccountsTable({ accounts }: { accounts: Account[] }) {
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--v8-border)]">
        <div>
          <h3 className="text-h3 font-semibold">Accounts</h3>
          <p className="text-body-sm text-text-muted">Active engagements & pipeline</p>
        </div>
        <Badge tone="accent" dot={false}>
          {accounts.length} total
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="[&>th]:px-5 [&>th]:py-3 [&>th]:eyebrow [&>th]:font-semibold">
              <th>Account</th>
              <th>Stage</th>
              <th className="text-right">MRR</th>
              <th className="w-40">Health</th>
              <th className="w-32 text-right">Trend</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr
                key={a.code}
                className="group border-t border-[color:var(--v8-border)] transition-colors duration-fast ease-out hover:bg-raised/60"
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
