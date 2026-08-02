/* ----------------------------------------------------------------------------
   AccountDetail — the record view for a single engagement. Header with identity
   + actions, a KPI strip, an engagement chart, the activity timeline, and a
   side rail of account facts and contacts. Reached from any accounts table row.
   -------------------------------------------------------------------------- */
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Topbar } from "../components/Topbar.tsx";
import { Button, Badge } from "../components/primitives.tsx";
import { Sparkline } from "../components/Sparkline.tsx";
import { Timeline } from "../components/Timeline.tsx";
import { Modal } from "../components/Modal.tsx";
import { Field, Input, Select, Textarea } from "../components/forms.tsx";
import { EditAccountModal } from "../components/EditAccountModal.tsx";
import { useToast } from "../components/toast.tsx";
import { Placeholder } from "./Placeholder.tsx";
import { useAccounts } from "../store/accounts.tsx";
import { type Account, type EngagementStage, type TimelineKind } from "../data.ts";

const stageTone: Record<EngagementStage, Parameters<typeof Badge>[0]["tone"]> = {
  Discovery: "neutral",
  Proposal: "accent",
  Build: "accent",
  Retainer: "up",
  "At Risk": "down",
};

function healthTone(h: number): "up" | "warn" | "down" {
  if (h >= 75) return "up";
  if (h >= 55) return "warn";
  return "down";
}

function DetailStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="panel p-4">
      <div className="eyebrow">{label}</div>
      <div className="tabular mt-2 text-h1 font-bold leading-tight">{value}</div>
      {sub && <div className="mt-1 text-body-sm text-text-muted">{sub}</div>}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[color:var(--v8-border)] last:border-0">
      <span className="text-body-sm text-text-muted">{label}</span>
      <span className="text-body-sm font-medium text-text-secondary text-right">{value}</span>
    </div>
  );
}

const ACTIVITY_KINDS: TimelineKind[] = ["note", "call", "email", "ship", "risk"];

export function AccountDetail() {
  const { code = "" } = useParams();
  const { getAccount, logActivity, removeAccount, addContact, removeContact, addTask, toggleTask, removeTask } = useAccounts();
  const toast = useToast();
  const navigate = useNavigate();
  const account: Account | undefined = getAccount(code);

  const [logOpen, setLogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [kind, setKind] = useState<TimelineKind>("note");
  const [text, setText] = useState("");
  const [cName, setCName] = useState("");
  const [cRole, setCRole] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");

  if (!account) {
    return (
      <Placeholder title="Account not found" note={`No engagement matches ${code}.`} />
    );
  }

  function saveActivity() {
    const trimmed = text.trim();
    if (!trimmed) return;
    logActivity(code, { when: "just now", kind, text: trimmed });
    setText("");
    setKind("note");
    setLogOpen(false);
    toast("Activity logged");
  }

  function confirmDelete() {
    const name = account!.name;
    setConfirmOpen(false);
    removeAccount(code);
    navigate("/accounts");
    toast(`${name} deleted`, "warn");
  }

  function saveContact() {
    const name = cName.trim();
    if (!name) return;
    addContact(code, {
      name,
      role: cRole.trim() || "Contact",
      email: cEmail.trim() || "—",
    });
    setCName("");
    setCRole("");
    setCEmail("");
    setContactOpen(false);
    toast("Contact added");
  }

  function submitTask() {
    const title = taskTitle.trim();
    if (!title) return;
    addTask(code, title, taskDue.trim());
    setTaskTitle("");
    setTaskDue("");
  }

  const initials = account.name.split(" ").slice(0, 2).map((w) => w[0]).join("");

  return (
    <>
      <Topbar title="Accounts" subtitle="Account record" />
      <div className="px-6 py-6">
        <Link
          to="/accounts"
          className="inline-flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text transition-colors duration-fast"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          All accounts
        </Link>

        {/* Header */}
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4 animate-fade-rise">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-200 text-h2 font-bold">
              {initials}
            </span>
            <div>
              <h2 className="text-h1 font-semibold">{account.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone={stageTone[account.stage]}>{account.stage}</Badge>
                <span className="tabular rounded-pill bg-raised px-3 h-6 inline-flex items-center text-label text-text-secondary">
                  {account.code}
                </span>
                <span className="rounded-pill bg-raised px-3 h-6 inline-flex items-center text-label text-text-secondary">
                  {account.vertical}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="subtle" onClick={() => setEditOpen(true)}>Edit</Button>
            <Button variant="subtle" onClick={() => setLogOpen(true)}>Log activity</Button>
            <Button variant="primary">Message</Button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DetailStat label="MRR" value={account.mrr ? `$${account.mrr.toLocaleString("en-US")}` : "—"} sub={account.mrr ? "Monthly recurring" : "Not yet contracted"} />
          <DetailStat label="Health" value={`${account.health}`} sub={healthTone(account.health) === "down" ? "Needs attention" : healthTone(account.health) === "warn" ? "Watch" : "Healthy"} />
          <DetailStat label="Started" value={account.started} sub={`Owner · ${account.owner}`} />
          <DetailStat label="Renewal" value={account.renewal} sub={account.renewal === "—" ? "No contract yet" : "Contract term"} />
        </div>

        {/* Body */}
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          {/* Left column */}
          <div className="flex flex-col gap-4 xl:col-span-2">
            <div className="panel p-6 animate-fade-rise" style={{ animationDelay: "80ms" }}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="eyebrow">Engagement value · trailing</span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="tabular text-display font-bold leading-tight">
                      {account.mrr ? `$${(account.mrr / 1000).toFixed(1)}` : "—"}
                    </span>
                    {account.mrr > 0 && <span className="tabular text-h2 font-semibold text-text-muted">K</span>}
                  </div>
                </div>
                <div
                  className="rounded-md px-3 h-6 inline-flex items-center text-label font-semibold"
                  style={{ background: "var(--v8-accent-softer)", color: "var(--v8-accent-200)" }}
                >
                  Trend
                </div>
              </div>
              <div className="mt-6">
                <Sparkline
                  data={account.trend}
                  height={120}
                  tone={account.stage === "At Risk" ? "down" : "accent"}
                />
              </div>
            </div>

            <div className="panel p-6 animate-fade-rise" style={{ animationDelay: "120ms" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-h3 font-semibold">Tasks</h3>
                {account.tasks.some((t) => !t.done) && (
                  <Badge tone="accent" dot={false}>
                    {account.tasks.filter((t) => !t.done).length} open
                  </Badge>
                )}
              </div>

              <form
                className="mt-4 flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitTask();
                }}
              >
                <Input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Add a follow-up…"
                  className="flex-1"
                />
                <Input
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  placeholder="Due"
                  className="w-24"
                />
                <Button variant="subtle" type="submit" disabled={!taskTitle.trim()}>Add</Button>
              </form>

              <ul className="mt-4 flex flex-col">
                {account.tasks.length === 0 && (
                  <li className="py-2 text-body-sm text-text-muted">No tasks yet.</li>
                )}
                {account.tasks.map((t) => (
                  <li
                    key={t.id}
                    className="group flex items-center gap-3 border-b border-[color:var(--v8-border)] py-3 last:border-0"
                  >
                    <button
                      onClick={() => toggleTask(code, t.id)}
                      aria-label={t.done ? "Mark incomplete" : "Mark complete"}
                      className={[
                        "grid h-5 w-5 shrink-0 place-items-center rounded-sm border transition-colors duration-fast",
                        t.done
                          ? "border-[color:var(--v8-accent-500)] bg-accent-500 text-base"
                          : "border-[color:var(--v8-border-strong)] hover:border-accent",
                      ].join(" ")}
                    >
                      {t.done && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M4 10.5l4 4 8-9" />
                        </svg>
                      )}
                    </button>
                    <span
                      className={[
                        "flex-1 text-body",
                        t.done ? "text-text-muted line-through" : "text-text",
                      ].join(" ")}
                    >
                      {t.title}
                    </span>
                    {t.due && (
                      <span className="tabular shrink-0 text-label text-text-muted">{t.due}</span>
                    )}
                    <button
                      onClick={() => removeTask(code, t.id)}
                      aria-label="Delete task"
                      className="shrink-0 text-text-faint opacity-0 transition-opacity duration-fast hover:text-down group-hover:opacity-100"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel p-6 animate-fade-rise" style={{ animationDelay: "160ms" }}>
              <h3 className="text-h3 font-semibold">Activity</h3>
              <p className="text-body-sm text-text-muted mb-5">Recent touches on this account</p>
              <Timeline events={account.timeline} />
            </div>
          </div>

          {/* Right rail */}
          <div className="flex flex-col gap-4">
            <div className="panel p-6 animate-fade-rise" style={{ animationDelay: "100ms" }}>
              <span className="eyebrow">Summary</span>
              <p className="mt-3 text-body text-text-secondary">{account.summary}</p>
            </div>

            <div className="panel p-6 animate-fade-rise" style={{ animationDelay: "160ms" }}>
              <span className="eyebrow">Next step</span>
              <div className="mt-3 flex items-start gap-3 rounded-md bg-accent-softer p-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-400" />
                <p className="text-body text-text">{account.nextStep}</p>
              </div>
            </div>

            <div className="panel p-6 animate-fade-rise" style={{ animationDelay: "200ms" }}>
              <span className="eyebrow">Details</span>
              <div className="mt-2">
                <Fact label="Vertical" value={account.vertical} />
                <Fact label="Stage" value={account.stage} />
                <Fact label="Owner" value={account.owner} />
                <Fact label="Started" value={account.started} />
                <Fact label="Renewal" value={account.renewal} />
              </div>
            </div>

            <div className="panel p-6 animate-fade-rise" style={{ animationDelay: "240ms" }}>
              <div className="flex items-center justify-between">
                <span className="eyebrow">Contacts</span>
                <button
                  onClick={() => setContactOpen(true)}
                  className="text-label font-semibold text-accent-400 hover:text-accent-200 transition-colors duration-fast"
                >
                  + Add
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-4">
                {account.contacts.length === 0 && (
                  <p className="text-body-sm text-text-muted">No contacts yet.</p>
                )}
                {account.contacts.map((c) => (
                  <div key={c.email} className="group flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-raised text-label font-bold text-text-secondary">
                      {c.name.split(" ").map((w) => w[0]).join("")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-body-sm font-semibold">{c.name}</div>
                      <div className="truncate text-label text-text-muted">
                        {c.role} · {c.email}
                      </div>
                    </div>
                    <button
                      onClick={() => removeContact(code, c.email)}
                      aria-label={`Remove ${c.name}`}
                      className="shrink-0 text-text-faint opacity-0 transition-opacity duration-fast hover:text-down group-hover:opacity-100"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditAccountModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        account={account}
        onRequestDelete={() => {
          setEditOpen(false);
          setConfirmOpen(true);
        }}
      />

      <Modal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title="Add contact"
        description={`New contact on ${account.name}.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setContactOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveContact} disabled={!cName.trim()}>Add contact</Button>
          </>
        }
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveContact();
          }}
        >
          <Field label="Name">
            <Input autoFocus value={cName} onChange={(e) => setCName(e.target.value)} placeholder="e.g. Jordan Lee" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Role">
              <Input value={cRole} onChange={(e) => setCRole(e.target.value)} placeholder="e.g. Ops Director" />
            </Field>
            <Field label="Email">
              <Input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="name@company.com" />
            </Field>
          </div>
          <button type="submit" className="hidden" aria-hidden />
        </form>
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete account"
        description={account.name}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete account</Button>
          </>
        }
      >
        <p className="text-body text-text-secondary">
          This permanently removes <span className="font-semibold text-text">{account.name}</span> and
          its activity from your book. This can't be undone.
        </p>
      </Modal>

      <Modal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        title="Log activity"
        description={`Add a touch to ${account.name}.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setLogOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveActivity} disabled={!text.trim()}>
              Save activity
            </Button>
          </>
        }
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveActivity();
          }}
        >
          <Field label="Type">
            <Select value={kind} onChange={(e) => setKind(e.target.value as TimelineKind)}>
              {ACTIVITY_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k[0].toUpperCase() + k.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="What happened?">
            <Textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Call with the ops lead — confirmed the rollout date."
            />
          </Field>
          <button type="submit" className="hidden" aria-hidden />
        </form>
      </Modal>
    </>
  );
}
