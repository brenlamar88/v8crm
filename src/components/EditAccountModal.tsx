/* ----------------------------------------------------------------------------
   EditAccountModal — edit the mutable fields of a record (stage, MRR, health,
   next step, summary). Seeds its form from the account each time it opens and
   writes back through the store on save.
   -------------------------------------------------------------------------- */
import { useEffect, useState } from "react";
import { Modal } from "./Modal.tsx";
import { Button } from "./primitives.tsx";
import { Field, Input, Select, Textarea } from "./forms.tsx";
import { useToast } from "./toast.tsx";
import { useAccounts } from "../store/accounts.tsx";
import type { Account, EngagementStage } from "../data.ts";

const STAGES: EngagementStage[] = ["Discovery", "Proposal", "Build", "Retainer", "At Risk"];

function clampHealth(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function EditAccountModal({
  open,
  onClose,
  account,
  onRequestDelete,
}: {
  open: boolean;
  onClose: () => void;
  account: Account;
  onRequestDelete: () => void;
}) {
  const { updateAccount } = useAccounts();
  const toast = useToast();

  const [stage, setStage] = useState<EngagementStage>(account.stage);
  const [mrr, setMrr] = useState(String(account.mrr));
  const [health, setHealth] = useState(String(account.health));
  const [nextStep, setNextStep] = useState(account.nextStep);
  const [summary, setSummary] = useState(account.summary);

  // Reseed the form from the account whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    setStage(account.stage);
    setMrr(String(account.mrr));
    setHealth(String(account.health));
    setNextStep(account.nextStep);
    setSummary(account.summary);
  }, [open, account]);

  function save() {
    updateAccount(account.code, {
      stage,
      mrr: Math.max(0, Math.round(Number(mrr) || 0)),
      health: clampHealth(Number(health)),
      nextStep: nextStep.trim() || account.nextStep,
      summary: summary.trim() || account.summary,
    });
    onClose();
    toast("Changes saved");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit account"
      description={account.name}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>Save changes</Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Stage">
            <Select value={stage} onChange={(e) => setStage(e.target.value as EngagementStage)}>
              {STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Health" hint="0–100">
            <Input type="number" min={0} max={100} value={health} onChange={(e) => setHealth(e.target.value)} />
          </Field>
        </div>
        <Field label="MRR" hint="Monthly recurring revenue in USD.">
          <Input type="number" min={0} step={100} value={mrr} onChange={(e) => setMrr(e.target.value)} />
        </Field>
        <Field label="Next step">
          <Input value={nextStep} onChange={(e) => setNextStep(e.target.value)} />
        </Field>
        <Field label="Summary">
          <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} />
        </Field>
        <button type="submit" className="hidden" aria-hidden />
      </form>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-[color:var(--v8-border)] pt-4">
        <span className="text-label text-text-muted">Remove this account and its activity.</span>
        <button
          type="button"
          onClick={onRequestDelete}
          className="text-body-sm font-semibold text-down hover:underline"
        >
          Delete account
        </button>
      </div>
    </Modal>
  );
}
