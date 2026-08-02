/* ----------------------------------------------------------------------------
   EditDeliveryModal — edit an engagement's delivery metrics (DORA + AI quality +
   service). Each field is optional; blanks are cleared. Grouped to match the
   Delivery dashboard.
   -------------------------------------------------------------------------- */
import { useState } from "react";
import { Modal } from "./Modal.tsx";
import { Button } from "./primitives.tsx";
import { DELIVERY_METRICS } from "../lib/metrics.ts";
import type { Delivery } from "../data.ts";

const GROUPS = ["DORA", "AI quality", "Service"] as const;

export function EditDeliveryModal({
  open,
  delivery,
  onClose,
  onSave,
}: {
  open: boolean;
  delivery: Delivery | undefined;
  onClose: () => void;
  onSave: (next: Delivery) => void;
}) {
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const d: Record<string, string> = {};
    for (const m of DELIVERY_METRICS) {
      const v = delivery?.[m.key];
      d[m.key] = typeof v === "number" ? String(v) : "";
    }
    return d;
  });

  function save() {
    const next: Delivery = {};
    for (const m of DELIVERY_METRICS) {
      const raw = draft[m.key]?.trim();
      if (raw === "" || raw === undefined) continue;
      const n = Number(raw);
      if (Number.isFinite(n)) (next as Record<string, number>)[m.key] = n;
    }
    onSave(next);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delivery metrics"
      description="What this engagement is reporting. Leave a field blank to omit it."
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>Save metrics</Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {GROUPS.map((group) => (
          <div key={group}>
            <div className="eyebrow mb-2">{group}</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {DELIVERY_METRICS.filter((m) => m.group === group).map((m) => (
                <label key={m.key} className="flex flex-col gap-1">
                  <span className="text-label text-text-secondary">
                    {m.label}
                    {m.unit && <span className="text-text-muted"> ({m.unit})</span>}
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={draft[m.key] ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, [m.key]: e.target.value }))}
                    className="tabular rounded-sm border border-[color:var(--v8-border)] bg-sunken px-2.5 h-9 text-body-sm text-text outline-none focus:border-accent transition-colors duration-fast"
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
