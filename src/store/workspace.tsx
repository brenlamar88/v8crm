/* ----------------------------------------------------------------------------
   Workspace — the current team context. On sign-in it accepts any pending
   invitations, loads the user's workspaces (creating a personal one if they
   have none), and exposes the current selection. When Supabase is off it's a
   no-op (single local demo, no teams). The accounts store scopes to `currentId`.
   -------------------------------------------------------------------------- */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  acceptInvitations,
  fetchWorkspaces,
  fetchMembers,
  createWorkspace as rpcCreateWorkspace,
  renameWorkspace as apiRename,
  type Workspace,
  type Member,
} from "../lib/supabase.ts";
import { useAuth } from "./auth.tsx";

const CURRENT_KEY = "v8crm.workspace";

interface WorkspaceValue {
  enabled: boolean;
  loading: boolean;
  workspaces: Workspace[];
  currentId: string | null;
  current: Workspace | null;
  members: Member[];
  setCurrent: (id: string) => void;
  refresh: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  createWorkspace: (name: string) => Promise<void>;
  rename: (id: string, name: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { enabled, user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(enabled);

  const setCurrent = useCallback((id: string) => {
    setCurrentId(id);
    try {
      window.localStorage.setItem(CURRENT_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    if (!enabled || !user) {
      setWorkspaces([]);
      setCurrentId(null);
      setLoading(false);
      return;
    }
    await acceptInvitations();
    let list = await fetchWorkspaces(user.id);
    if (list.length === 0) {
      await rpcCreateWorkspace("My Workspace");
      list = await fetchWorkspaces(user.id);
    }
    setWorkspaces(list);
    const saved = (() => {
      try {
        return window.localStorage.getItem(CURRENT_KEY);
      } catch {
        return null;
      }
    })();
    const pick = list.find((w) => w.id === saved) ?? list[0] ?? null;
    setCurrentId(pick?.id ?? null);
    setLoading(false);
  }, [enabled, user]);

  useEffect(() => {
    setLoading(enabled && !!user);
    void load();
  }, [load, enabled, user]);

  const refreshMembers = useCallback(async () => {
    if (!enabled || !currentId) {
      setMembers([]);
      return;
    }
    setMembers(await fetchMembers(currentId));
  }, [enabled, currentId]);

  // Keep the roster in sync with the selected workspace, so any screen can
  // resolve assignees / "me" without its own fetch.
  useEffect(() => {
    void refreshMembers();
  }, [refreshMembers]);

  const createWorkspace = useCallback(
    async (name: string) => {
      const id = await rpcCreateWorkspace(name);
      const list = user ? await fetchWorkspaces(user.id) : [];
      setWorkspaces(list);
      if (id) setCurrent(id);
    },
    [user, setCurrent],
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      await apiRename(id, name);
      setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, name } : w)));
    },
    [],
  );

  return (
    <WorkspaceContext.Provider
      value={{
        enabled,
        loading,
        workspaces,
        currentId,
        current: workspaces.find((w) => w.id === currentId) ?? null,
        members,
        setCurrent,
        refresh: load,
        refreshMembers,
        createWorkspace,
        rename,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
}
