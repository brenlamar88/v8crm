/* ----------------------------------------------------------------------------
   Accounts store — a light client-side store so the console can capture data,
   not just render it. Holds the accounts list in state and exposes mutations
   (create an account, log an activity) plus the global "New account" dialog
   state that the topbar action opens from anywhere. No external state library;
   a context + useState is enough at this size.
   -------------------------------------------------------------------------- */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  accounts as seedAccounts,
  type Account,
  type Contact,
  type EngagementStage,
  type Task,
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
import { useWorkspace } from "./workspace.tsx";
import { useToast } from "../components/toast.tsx";

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
  removeContact: (code: string, email: string) => void;
  addTask: (code: string, title: string, dueDate: string, assignee?: string) => void;
  updateTask: (code: string, taskId: string, patch: Partial<Task>) => void;
  toggleTask: (code: string, taskId: string) => void;
  removeTask: (code: string, taskId: string) => void;
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
  const currentWorkspace = useWorkspace().currentId;
  // Latest workspace id for the fire-and-forget sync writes, without adding it
  // to every mutation's dependency list.
  const wsRef = useRef<string | null>(currentWorkspace);
  wsRef.current = currentWorkspace;
  const toast = useToast();

  // Watch background sync results; toast only on the transition to/from offline
  // so a run of failures (or recoveries) doesn't spam.
  const offline = useRef(false);
  const trackSync = useCallback(
    (result: Promise<boolean>) => {
      void result.then((ok) => {
        if (!ok && !offline.current) {
          offline.current = true;
          toast("Couldn't reach the server — changes are saved on this device", "warn");
        } else if (ok && offline.current) {
          offline.current = false;
          toast("Back online — changes are syncing");
        }
      });
    },
    [toast],
  );

  // Hydrate the current workspace's book from Supabase, re-running when the
  // workspace changes. Remote rows win; a genuinely empty workspace is seeded
  // with the samples; any failure leaves local untouched.
  useEffect(() => {
    if (!isSupabaseEnabled || !currentWorkspace) return;
    let cancelled = false;
    (async () => {
      const remote = await fetchAccounts(currentWorkspace);
      if (cancelled) return;
      if (remote && remote.length > 0) {
        setAccounts(remote);
      } else if (remote) {
        await seedIfEmpty(seedAccounts, currentWorkspace);
        setAccounts(seedAccounts);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentWorkspace]);

  // Live sync: merge row changes from other members/devices for this workspace.
  // Our own writes echo back too, but re-applying the same row is idempotent.
  useEffect(() => {
    if (!isSupabaseEnabled || !currentWorkspace) return;
    return subscribeToAccounts(currentWorkspace, (change) => {
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
  }, [currentWorkspace]);

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
        tasks: [],
      };
      setAccounts([created, ...accounts]);
      trackSync(upsertAccount(created, wsRef.current ?? ""));
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
      trackSync(upsertAccount(merged, wsRef.current ?? ""));
    },
    [accounts],
  );

  const removeAccount = useCallback(
    (code: string) => {
      setAccounts(accounts.filter((a) => a.code !== code));
      trackSync(deleteAccountRow(code, wsRef.current ?? ""));
    },
    [accounts],
  );

  const addContact = useCallback(
    (code: string, contact: Contact) => {
      const current = accounts.find((a) => a.code === code);
      if (!current) return;
      const merged = { ...current, contacts: [...current.contacts, contact] };
      setAccounts(accounts.map((a) => (a.code === code ? merged : a)));
      trackSync(upsertAccount(merged, wsRef.current ?? ""));
    },
    [accounts],
  );

  const removeContact = useCallback(
    (code: string, email: string) => {
      const current = accounts.find((a) => a.code === code);
      if (!current) return;
      const merged = { ...current, contacts: current.contacts.filter((c) => c.email !== email) };
      setAccounts(accounts.map((a) => (a.code === code ? merged : a)));
      trackSync(upsertAccount(merged, wsRef.current ?? ""));
    },
    [accounts],
  );

  const writeTasks = useCallback(
    (code: string, tasks: Account["tasks"]) => {
      const current = accounts.find((a) => a.code === code);
      if (!current) return;
      const merged = { ...current, tasks };
      setAccounts(accounts.map((a) => (a.code === code ? merged : a)));
      trackSync(upsertAccount(merged, wsRef.current ?? ""));
    },
    [accounts],
  );

  const addTask = useCallback(
    (code: string, title: string, dueDate: string, assignee?: string) => {
      const current = accounts.find((a) => a.code === code);
      if (!current) return;
      const id = `t-${code}-${current.tasks.length}-${title.length}`;
      writeTasks(code, [
        ...current.tasks,
        { id, title, due: "", dueDate, done: false, ...(assignee ? { assignee } : {}) },
      ]);
    },
    [accounts, writeTasks],
  );

  const updateTask = useCallback(
    (code: string, taskId: string, patch: Partial<Task>) => {
      const current = accounts.find((a) => a.code === code);
      if (!current) return;
      writeTasks(
        code,
        current.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
      );
    },
    [accounts, writeTasks],
  );

  const toggleTask = useCallback(
    (code: string, taskId: string) => {
      const current = accounts.find((a) => a.code === code);
      if (!current) return;
      const task = current.tasks.find((t) => t.id === taskId);
      const nowDone = task ? !task.done : false;
      const tasks = current.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t));
      // Completing a task leaves a mark on the timeline (feeds Activity + the
      // bell). Done in one write so it can't race the task update.
      const timeline =
        nowDone && task
          ? [{ when: "just now", kind: "note" as const, text: `Completed: ${task.title}` }, ...current.timeline]
          : current.timeline;
      const merged = { ...current, tasks, timeline };
      setAccounts(accounts.map((a) => (a.code === code ? merged : a)));
      trackSync(upsertAccount(merged, wsRef.current ?? ""));
    },
    [accounts, trackSync],
  );

  const removeTask = useCallback(
    (code: string, taskId: string) => {
      const current = accounts.find((a) => a.code === code);
      if (!current) return;
      writeTasks(code, current.tasks.filter((t) => t.id !== taskId));
    },
    [accounts, writeTasks],
  );

  const logActivity = useCallback(
    (code: string, event: TimelineEvent) => {
      const current = accounts.find((a) => a.code === code);
      if (!current) return;
      const merged = { ...current, timeline: [event, ...current.timeline] };
      setAccounts(accounts.map((a) => (a.code === code ? merged : a)));
      trackSync(upsertAccount(merged, wsRef.current ?? ""));
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
      removeContact,
      addTask,
      updateTask,
      toggleTask,
      removeTask,
      logActivity,
      newAccountOpen,
      openNewAccount: () => setNewAccountOpen(true),
      closeNewAccount: () => setNewAccountOpen(false),
    }),
    [accounts, getAccount, addAccount, updateAccount, removeAccount, addContact, removeContact, addTask, updateTask, toggleTask, removeTask, logActivity, newAccountOpen],
  );

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>;
}

export function useAccounts(): AccountsContextValue {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error("useAccounts must be used within an AccountsProvider");
  return ctx;
}
