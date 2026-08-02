/* ----------------------------------------------------------------------------
   NewAccountModal — the global "New account" form. Lives in the shell and is
   opened by the topbar action from any screen. On submit it creates the account
   in the store and routes to the new record.
   -------------------------------------------------------------------------- */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "./Modal.tsx";
import { Button } from "./primitives.tsx";
import { Field, Input, Select } from "./forms.tsx";
import { useToast } from "./toast.tsx";
import { useAccounts } from "../store/accounts.tsx";
import type { EngagementStage } from "../data.ts";

const STAGES: EngagementStage[] = ["Discovery", "Proposal", "Build", "Retainer", "At Risk"];
const VERTICALS = ["Behavioral Health", "Field Operations", "Nonprofit", "Other"];

export function NewAccountModal() {
  const { newAccountOpen, closeNewAccount, addAccount } = useAccounts();
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState("");
  const [vertical, setVertical] = useState(VERTICALS[0]);
  const [stage, setStage] = useState<EngagementStage>("Discovery");
  const [mrr, setMrr] = useState("");

  function reset() {
    setName("");
    setVertical(VERTICALS[0]);
    setStage("Discovery");
    setMrr("");
  }

  function close() {
    closeNewAccount();
    reset();
  }

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const created = addAccount({
      name: trimmed,
      vertical,
      stage,
      mrr: Math.max(0, Math.round(Number(mrr) || 0)),
    });
    close();
    navigate(`/accounts/${created.code}`);
    toast(`${created.name} created`);
  }

  return (
    <Modal
      open={newAccountOpen}
      onClose={close}
      title="New account"
      description="Add an engagement to your book."
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!name.trim()}>
            Create account
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Account name">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vermilion Health Group"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Vertical">
            <Select value={vertical} onChange={(e) => setVertical(e.target.value)}>
              {VERTICALS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </Select>
          </Field>
          <Field label="Stage">
            <Select value={stage} onChange={(e) => setStage(e.target.value as EngagementStage)}>
              {STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="MRR" hint="Monthly recurring revenue in USD. Leave at 0 if not yet contracted.">
          <Input
            type="number"
            min={0}
            step={100}
            value={mrr}
            onChange={(e) => setMrr(e.target.value)}
            placeholder="0"
          />
        </Field>
        <button type="submit" className="hidden" aria-hidden />
      </form>
    </Modal>
  );
}
