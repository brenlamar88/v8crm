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
import {
  isSupabaseEnabled,
  fetchAccounts,
  upsertAccount,
  deleteAccountRow,
  seedIfEmpty,
  subscribeToAccounts,
} from "../lib/supabase.ts";
import { useAuth } from "./auth.tsx";

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
  const userId = useAuth().user?.id;

  // Hydrate from Supabase when configured, re-running if the signed-in user
  // changes. Remote rows win; an empty table is seeded from what we have
  // locally; any failure (missing table, network, RLS) leaves local untouched.
  useEffect(() => {
    if (!isSupabaseEnabled) return;
    let cancelled = false;
    (async () => {
      const remote = await fetchAccounts();
      if (cancelled) return;
      if (remote && remote.length > 0) {
        setAccounts(remote);
      } else if (remote) {
        await seedIfEmpty(loadAccounts());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Live sync: merge row changes from other tabs/devices for this owner. Our
  // own writes echo back too, but re-applying the same row is idempotent.
  useEffect(() => {
    if (!isSupabaseEnabled || !userId) return;
    return subscribeToAccounts(userId, (change) => {
      setAccounts((prev) => {
        if (change.type === "delete") {
          return prev.filter((a) => a.code !== change.code);
        }
        const exists = prev.some((a) => a.code === change.account.code);
        return exists
          ? prev.map((a) => (a.code === change.account.code ? change.account : a))
          : [change.account, ...prev];
      });
    });
  }, [userId]);

  // Cache the book locally on every change — offline fallback + instant boot.
  useEffect(() => {
    saveAccounts(accounts);
  }, [accounts]);

  const getAccount = useCallback(
    (code: string) => accounts.find((a) => a.code === code),
    [accounts],
  );

  const addAccount = useCallback(
    (input: NewAccountInput) => {
      const created: Account = {
        name: input.name,
        code: nextCode(accounts),
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
      setAccounts([created, ...accounts]);
      void upsertAccount(created);
      return created;
    },
    [accounts],
  );

  const updateAccount = useCallback(
    (code: string, patch: Partial<Account>) => {
      const current = accounts.find((a) => a.code === code);
      if (!current) return;
      const merged = { ...current, ...patch };
      setAccounts(accounts.map((a) => (a.code === code ? merged : a)));
      void upsertAccount(merged);
    },
    [accounts],
  );

  const removeAccount = useCallback(
    (code: string) => {
      setAccounts(accounts.filter((a) => a.code !== code));
      void deleteAccountRow(code);
    },
    [accounts],
  );

  const addContact = useCallback(
    (code: string, contact: Contact) => {
      const current = accounts.find((a) => a.code === code);
      if (!current) return;
      const merged = { ...current, contacts: [...current.contacts, contact] };
      setAccounts(accounts.map((a) => (a.code === code ? merged : a)));
      void upsertAccount(merged);
    },
    [accounts],
  );

  const logActivity = useCallback(
    (code: string, event: TimelineEvent) => {
      const current = accounts.find((a) => a.code === code);
      if (!current) return;
      const merged = { ...current, timeline: [event, ...current.timeline] };
      setAccounts(accounts.map((a) => (a.code === code ? merged : a)));
      void upsertAccount(merged);
    },
    [accounts],
  );

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
