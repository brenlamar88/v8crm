/* ----------------------------------------------------------------------------
   Time store — logged hours for the current workspace. Local-first (localStorage
   cache + optimistic writes) syncing to Supabase when enabled, mirroring the
   accounts store. Feeds utilization & realization. No-op-safe offline.
   -------------------------------------------------------------------------- */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  isSupabaseEnabled,
  fetchTimeEntries,
  upsertTimeEntry,
  deleteTimeEntryRow,
  subscribeToTimeEntries,
  type TimeEntry,
} from "../lib/supabase.ts";
import { useWorkspace } from "./workspace.tsx";
import { useAuth } from "./auth.tsx";

const STORE_KEY = "v8crm.time";
const STORE_VERSION = 1;

function load(): TimeEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { v?: number; entries?: TimeEntry[] };
    if (parsed.v !== STORE_VERSION || !Array.isArray(parsed.entries)) return [];
    return parsed.entries;
  } catch {
    return [];
  }
}

function save(entries: TimeEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify({ v: STORE_VERSION, entries }));
  } catch {
    /* ignore */
  }
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `t-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  }
}

export interface NewTimeEntry {
  date: string;
  accountCode: string;
  hours: number;
  billable: boolean;
  note: string;
}

interface TimeContextValue {
  entries: TimeEntry[];
  addEntry: (input: NewTimeEntry) => void;
  updateEntry: (id: string, patch: Partial<TimeEntry>) => void;
  removeEntry: (id: string) => void;
}

const TimeContext = createContext<TimeContextValue | null>(null);

export function TimeProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<TimeEntry[]>(load);
  const workspaceId = useWorkspace().currentId;
  const { user } = useAuth();
  const wsRef = useRef<string | null>(workspaceId);
  wsRef.current = workspaceId;

  // Hydrate from the current workspace; remote wins, failure keeps local.
  useEffect(() => {
    if (!isSupabaseEnabled || !workspaceId) return;
    let cancelled = false;
    (async () => {
      const remote = await fetchTimeEntries(workspaceId);
      if (!cancelled && remote) setEntries(remote);
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  // Live sync across the team.
  useEffect(() => {
    if (!isSupabaseEnabled || !workspaceId) return;
    return subscribeToTimeEntries(workspaceId, (change) => {
      setEntries((prev) => {
        if (change.type === "delete") return prev.filter((e) => e.id !== change.id);
        const exists = prev.some((e) => e.id === change.entry.id);
        return exists
          ? prev.map((e) => (e.id === change.entry.id ? change.entry : e))
          : [change.entry, ...prev];
      });
    });
  }, [workspaceId]);

  useEffect(() => {
    save(entries);
  }, [entries]);

  const addEntry = useCallback(
    (input: NewTimeEntry) => {
      const entry: TimeEntry = {
        id: newId(),
        date: input.date,
        accountCode: input.accountCode,
        userEmail: user?.email ?? "",
        hours: input.hours,
        billable: input.billable,
        writtenOff: false,
        note: input.note,
      };
      setEntries((prev) => [entry, ...prev]);
      void upsertTimeEntry(entry, wsRef.current ?? "");
    },
    [user],
  );

  const updateEntry = useCallback((id: string, patch: Partial<TimeEntry>) => {
    setEntries((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...patch } : e));
      const merged = next.find((e) => e.id === id);
      if (merged) void upsertTimeEntry(merged, wsRef.current ?? "");
      return next;
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    void deleteTimeEntryRow(id, wsRef.current ?? "");
  }, []);

  const value = useMemo<TimeContextValue>(
    () => ({ entries, addEntry, updateEntry, removeEntry }),
    [entries, addEntry, updateEntry, removeEntry],
  );

  return <TimeContext.Provider value={value}>{children}</TimeContext.Provider>;
}

export function useTime(): TimeContextValue {
  const ctx = useContext(TimeContext);
  if (!ctx) throw new Error("useTime must be used within a TimeProvider");
  return ctx;
}
