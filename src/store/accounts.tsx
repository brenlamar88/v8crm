/* ----------------------------------------------------------------------------
   Accounts store — a light client-side store so the console can capture data,
   not just render it. Holds the accounts list in state and exposes mutations
   (create an account, log an activity) plus the global "New account" dialog
   state that the topbar action opens from anywhere. No external state library;
   a context + useState is enough at this size.
   -------------------------------------------------------------------------- */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  accounts as seedAccounts,
  type Account,
  type EngagementStage,
  type TimelineEvent,
} from "../data.ts";

export interface NewAccountInput {
  name: string;
  vertical: string;
  stage: EngagementStage;
  mrr: number;
}

interface AccountsContextValue {
  accounts: Account[];
  getAccount: (code: string) => Account | undefined;
  addAccount: (input: NewAccountInput) => Account;
  logActivity: (code: string, event: TimelineEvent) => void;
  newAccountOpen: boolean;
  openNewAccount: () => void;
  closeNewAccount: () => void;
}

const AccountsContext = createContext<AccountsContextValue | null>(null);

/** Next code in the V8-#### series, one above the current max. Parses only the
    number after the dash — the "8" in the "V8" prefix must not count. */
function nextCode(list: Account[]): string {
  const max = list.reduce((m, a) => {
    const n = Number(a.code.split("-")[1]);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 2000);
  return `V8-${max + 1}`;
}

export function AccountsProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(seedAccounts);
  const [newAccountOpen, setNewAccountOpen] = useState(false);

  const getAccount = useCallback(
    (code: string) => accounts.find((a) => a.code === code),
    [accounts],
  );

  const addAccount = useCallback((input: NewAccountInput) => {
    let created!: Account;
    setAccounts((prev) => {
      created = {
        name: input.name,
        code: nextCode(prev),
        vertical: input.vertical,
        stage: input.stage,
        mrr: input.mrr,
        health: 60,
        owner: "BR",
        trend: [3, 4, 4, 5, 5, 6, 6, 7],
        started: input.stage === "Retainer" ? "This month" : "—",
        renewal: "—",
        summary: "New engagement — details to be filled in.",
        nextStep: "Set up the kickoff and confirm scope.",
        contacts: [],
        timeline: [{ when: "just now", kind: "note", text: "Account created." }],
      };
      return [created, ...prev];
    });
    return created;
  }, []);

  const logActivity = useCallback((code: string, event: TimelineEvent) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.code === code ? { ...a, timeline: [event, ...a.timeline] } : a,
      ),
    );
  }, []);

  const value = useMemo<AccountsContextValue>(
    () => ({
      accounts,
      getAccount,
      addAccount,
      logActivity,
      newAccountOpen,
      openNewAccount: () => setNewAccountOpen(true),
      closeNewAccount: () => setNewAccountOpen(false),
    }),
    [accounts, getAccount, addAccount, logActivity, newAccountOpen],
  );

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>;
}

export function useAccounts(): AccountsContextValue {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error("useAccounts must be used within an AccountsProvider");
  return ctx;
}
