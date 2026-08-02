/* ----------------------------------------------------------------------------
   Accounts store — a light client-side store so the console can capture data,
   not just render it. Holds the accounts list in state and exposes mutations
   (create an account, log an activity) plus the global "New account" dialog
   state that the topbar action opens from anywhere. No external state library;
   a context + useState is enough at this size.
   -------------------------------------------------------------------------- */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  accounts as seedAccounts,
  type Account,
  type Contact,
  type EngagementStage,
  type TimelineEvent,
} from "../data.ts";

/* Persistence — accounts survive a refresh via localStorage. The stored blob
   is versioned; a version bump (or corrupt/absent data) falls back to the seed
   so an old shape can never crash the app. */
const STORE_KEY = "v8crm.accounts";
const STORE_VERSION = 1;

function loadAccounts(): Account[] {
  if (typeof window === "undefined") return seedAccounts;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return seedAccounts;
    const parsed = JSON.parse(raw) as { v?: number; accounts?: Account[] };
    if (parsed.v !== STORE_VERSION || !Array.isArray(parsed.accounts)) return seedAccounts;
    return parsed.accounts;
  } catch {
    return seedAccounts;
  }
}

function saveAccounts(accounts: Account[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify({ v: STORE_VERSION, accounts }));
  } catch {
    /* storage full or unavailable — the app still works in-memory. */
  }
}

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
  updateAccount: (code: string, patch: Partial<Account>) => void;
  removeAccount: (code: string) => void;
  addContact: (code: string, contact: Contact) => void;
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
  const [accounts, setAccounts] = useState<Account[]>(loadAccounts);
  const [newAccountOpen, setNewAccountOpen] = useState(false);

  // Persist on every change to the book.
  useEffect(() => {
    saveAccounts(accounts);
  }, [accounts]);

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

  const updateAccount = useCallback((code: string, patch: Partial<Account>) => {
    setAccounts((prev) =>
      prev.map((a) => (a.code === code ? { ...a, ...patch } : a)),
    );
  }, []);

  const removeAccount = useCallback((code: string) => {
    setAccounts((prev) => prev.filter((a) => a.code !== code));
  }, []);

  const addContact = useCallback((code: string, contact: Contact) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.code === code ? { ...a, contacts: [...a.contacts, contact] } : a,
      ),
    );
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
      updateAccount,
      removeAccount,
      addContact,
      logActivity,
      newAccountOpen,
      openNewAccount: () => setNewAccountOpen(true),
      closeNewAccount: () => setNewAccountOpen(false),
    }),
    [accounts, getAccount, addAccount, updateAccount, removeAccount, addContact, logActivity, newAccountOpen],
  );

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>;
}

export function useAccounts(): AccountsContextValue {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error("useAccounts must be used within an AccountsProvider");
  return ctx;
}
