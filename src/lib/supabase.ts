/* ----------------------------------------------------------------------------
   Supabase data layer. The client only exists when the project's URL + anon key
   are present in the build (wired in vite.config from the Vercel integration).
   Everything here is best-effort: if Supabase is absent, the table is missing,
   or a call fails, callers fall back to the local store so the app never breaks.
   -------------------------------------------------------------------------- */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Account, Contact, Delivery, Task, TimelineEvent } from "../data.ts";

/* Public client credentials for this project's Supabase. The anon key is meant
   to be shipped to browsers — it already appears in the built bundle — and the
   owner-scoped row-level-security policies are what actually protect the data.
   Env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, bridged in vite.config
   from Vercel) OVERRIDE these when present, so you can point at a different
   project without a code change. To rotate: regenerate the anon key in Supabase
   and update it here (or set the env vars). */
const FALLBACK_URL = "https://jqcobwrrjwybrcvtjqxa.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxY29id3Jyand5YnJjdnRqcXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NjMzMDEsImV4cCI6MjEwMTIzOTMwMX0.KsSJQpjdG0rKyQjkx_QyobpYT3x-OcEPiOlvvdacEPg";

// Set VITE_SUPABASE_DISABLE=1 at build time to force local/offline mode (no
// backend, no sign-in) — useful for demos and for building without network.
const disabled = (import.meta.env.VITE_SUPABASE_DISABLE as string) === "1";

const url = (import.meta.env.VITE_SUPABASE_URL as string) || FALLBACK_URL;
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || FALLBACK_ANON_KEY;

export const supabase: SupabaseClient | null =
  !disabled && url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseEnabled = Boolean(supabase);

const TABLE = "accounts";
const PROFILES = "profiles";

export interface Profile {
  name: string;
  role: string;
  workspace: string;
  avatarUrl: string;
}

interface ProfileRow {
  name: string;
  role: string;
  workspace: string;
  avatar_url: string;
}

/** Fetch the signed-in user's profile row, or null if none/failure. */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(PROFILES)
    .select("name, role, workspace, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[supabase] profile fetch failed:", error.message);
    return null;
  }
  if (!data) return null;
  const r = data as ProfileRow;
  return { name: r.name, role: r.role, workspace: r.workspace, avatarUrl: r.avatar_url ?? "" };
}

/** Insert or update the signed-in user's profile. Best-effort. */
export async function upsertProfile(userId: string, profile: Profile): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from(PROFILES).upsert({
    id: userId,
    name: profile.name,
    role: profile.role,
    workspace: profile.workspace,
    avatar_url: profile.avatarUrl,
    updated_at: new Date().toISOString(),
  });
  if (error) console.warn("[supabase] profile upsert failed:", error.message);
}

/** Upload an avatar image under the user's own path and return its public URL,
    or null on failure. */
export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  if (!supabase) return null;
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) {
    console.warn("[supabase] avatar upload failed:", error.message);
    return null;
  }
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // Cache-bust so a re-upload to the same path refreshes in the UI.
  return `${data.publicUrl}?t=${Date.now()}`;
}

/* Row shape mirrors the SQL schema (see supabase/schema.sql): scalar columns
   plus JSONB for the array/nested fields. snake_case in the DB, camelCase here. */
interface AccountRow {
  code: string;
  name: string;
  vertical: string;
  stage: string;
  mrr: number;
  health: number;
  owner: string;
  trend: number[];
  started: string;
  renewal: string;
  summary: string;
  next_step: string;
  contacts: Contact[];
  timeline: TimelineEvent[];
  tasks: Task[];
  delivery: Delivery;
}

function toRow(a: Account): AccountRow {
  return {
    code: a.code,
    name: a.name,
    vertical: a.vertical,
    stage: a.stage,
    mrr: a.mrr,
    health: a.health,
    owner: a.owner,
    trend: a.trend,
    started: a.started,
    renewal: a.renewal,
    summary: a.summary,
    next_step: a.nextStep,
    contacts: a.contacts,
    timeline: a.timeline,
    tasks: a.tasks,
    delivery: a.delivery ?? {},
  };
}

function fromRow(r: AccountRow): Account {
  return {
    code: r.code,
    name: r.name,
    vertical: r.vertical,
    stage: r.stage as Account["stage"],
    mrr: r.mrr,
    health: r.health,
    owner: r.owner,
    trend: r.trend ?? [],
    started: r.started ?? "—",
    renewal: r.renewal ?? "—",
    summary: r.summary ?? "",
    nextStep: r.next_step ?? "",
    contacts: r.contacts ?? [],
    timeline: r.timeline ?? [],
    tasks: r.tasks ?? [],
    delivery: r.delivery ?? {},
  };
}

/** Fetch a workspace's book. Returns null on any failure so the caller keeps
    local data. Accounts are scoped to the workspace (RLS also enforces this). */
export async function fetchAccounts(workspaceId: string): Promise<Account[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("[supabase] fetch failed, using local data:", error.message);
    return null;
  }
  return (data as AccountRow[]).map(fromRow);
}

/** Insert or update one account in a workspace. Conflict target is
    (workspace_id, code). Returns true on success (or Supabase-off). */
export async function upsertAccount(account: Account, workspaceId: string): Promise<boolean> {
  if (!supabase) return true;
  const { error } = await supabase
    .from(TABLE)
    .upsert({ ...toRow(account), workspace_id: workspaceId }, { onConflict: "workspace_id,code" });
  if (error) console.warn("[supabase] upsert failed:", error.message);
  return !error;
}

/** Remove one account from a workspace. */
export async function deleteAccountRow(code: string, workspaceId: string): Promise<boolean> {
  if (!supabase) return true;
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("code", code);
  if (error) console.warn("[supabase] delete failed:", error.message);
  return !error;
}

export type AccountChange =
  | { type: "upsert"; account: Account }
  | { type: "delete"; code: string };

/** Subscribe to live row changes for a workspace's accounts. */
export function subscribeToAccounts(
  workspaceId: string,
  onChange: (change: AccountChange) => void,
): () => void {
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`accounts-${workspaceId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE, filter: `workspace_id=eq.${workspaceId}` },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const code = (payload.old as Partial<AccountRow>).code;
          if (code) onChange({ type: "delete", code });
        } else {
          onChange({ type: "upsert", account: fromRow(payload.new as AccountRow) });
        }
      },
    )
    .subscribe();
  return () => {
    void supabase?.removeChannel(channel);
  };
}

/** Seed a workspace's book from the bundled accounts if it's currently empty. */
export async function seedIfEmpty(seed: Account[], workspaceId: string): Promise<void> {
  if (!supabase) return;
  const { count, error } = await supabase
    .from(TABLE)
    .select("code", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (error || (count ?? 0) > 0) return;
  const rows = seed.map((a) => ({ ...toRow(a), workspace_id: workspaceId }));
  const { error: insErr } = await supabase.from(TABLE).insert(rows);
  if (insErr) console.warn("[supabase] seed failed:", insErr.message);
}

/* --- Workspaces / teams --------------------------------------------------- */

export interface Workspace {
  id: string;
  name: string;
  role: string;
}

export interface Member {
  user_id: string;
  email: string;
  role: string;
}

/** Turn any pending invitations for the signed-in email into memberships. */
export async function acceptInvitations(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc("accept_invitations");
  if (error) console.warn("[supabase] accept_invitations:", error.message);
}

/** Create a workspace (with the caller as owner). Returns its id. */
export async function createWorkspace(name: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("create_workspace", { ws_name: name });
  if (error) {
    console.warn("[supabase] create_workspace:", error.message);
    return null;
  }
  return data as string;
}

/** The workspaces the signed-in user belongs to, with their role in each. */
export async function fetchWorkspaces(userId: string): Promise<Workspace[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("memberships")
    .select("role, workspace_id, workspaces(name)")
    .eq("user_id", userId);
  if (error) {
    console.warn("[supabase] fetchWorkspaces:", error.message);
    return [];
  }
  return (data ?? []).map((r) => {
    // The embedded `workspaces` relation may type as an object or a single-row
    // array depending on the client's inference; normalize both.
    const row = r as unknown as {
      role: string;
      workspace_id: string;
      workspaces: { name: string } | { name: string }[] | null;
    };
    const ws = Array.isArray(row.workspaces) ? row.workspaces[0] : row.workspaces;
    return { id: row.workspace_id, name: ws?.name ?? "Workspace", role: row.role };
  });
}

/** Rename a workspace (owners only, per RLS). */
export async function renameWorkspace(id: string, name: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("workspaces").update({ name }).eq("id", id);
  if (error) console.warn("[supabase] renameWorkspace:", error.message);
}

/** Members of a workspace (email denormalized on the membership). */
export async function fetchMembers(workspaceId: string): Promise<Member[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("memberships")
    .select("user_id, email, role")
    .eq("workspace_id", workspaceId);
  if (error) {
    console.warn("[supabase] fetchMembers:", error.message);
    return [];
  }
  return (data as Member[]) ?? [];
}

export async function removeMember(workspaceId: string, userId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);
  if (error) console.warn("[supabase] removeMember:", error.message);
}

export interface Invitation {
  id: string;
  email: string;
}

export async function fetchInvitations(workspaceId: string): Promise<Invitation[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("invitations")
    .select("id, email")
    .eq("workspace_id", workspaceId);
  if (error) {
    console.warn("[supabase] fetchInvitations:", error.message);
    return [];
  }
  return (data as Invitation[]) ?? [];
}

/** Invite someone by email. Returns an error message, or null on success. */
export async function inviteMember(workspaceId: string, email: string): Promise<string | null> {
  if (!supabase) return null;
  const { error } = await supabase
    .from("invitations")
    .insert({ workspace_id: workspaceId, email: email.trim().toLowerCase() });
  return error?.message ?? null;
}

export async function revokeInvitation(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("invitations").delete().eq("id", id);
  if (error) console.warn("[supabase] revokeInvitation:", error.message);
}

/* --- Time entries --------------------------------------------------------- */

export interface TimeEntry {
  id: string;
  date: string; // ISO "YYYY-MM-DD"
  accountCode: string; // "" = internal / non-billable
  userEmail: string;
  hours: number;
  billable: boolean;
  writtenOff: boolean; // billable, but won't be invoiced (drives realization)
  note: string;
}

interface TimeEntryRow {
  id: string;
  entry_date: string;
  account_code: string | null;
  user_email: string | null;
  hours: number;
  billable: boolean;
  written_off: boolean;
  note: string;
}

function timeFromRow(r: TimeEntryRow): TimeEntry {
  return {
    id: r.id,
    date: r.entry_date,
    accountCode: r.account_code ?? "",
    userEmail: r.user_email ?? "",
    hours: Number(r.hours) || 0,
    billable: r.billable,
    writtenOff: r.written_off,
    note: r.note ?? "",
  };
}

const TIME = "time_entries";

/** Fetch a workspace's time entries (newest first). Null on failure. */
export async function fetchTimeEntries(workspaceId: string): Promise<TimeEntry[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TIME)
    .select("id, entry_date, account_code, user_email, hours, billable, written_off, note")
    .eq("workspace_id", workspaceId)
    .order("entry_date", { ascending: false });
  if (error) {
    console.warn("[supabase] time fetch failed:", error.message);
    return null;
  }
  return (data as TimeEntryRow[]).map(timeFromRow);
}

/** Insert or update one time entry. */
export async function upsertTimeEntry(entry: TimeEntry, workspaceId: string): Promise<boolean> {
  if (!supabase) return true;
  const { error } = await supabase.from(TIME).upsert({
    id: entry.id,
    workspace_id: workspaceId,
    entry_date: entry.date,
    account_code: entry.accountCode || null,
    user_email: entry.userEmail || null,
    hours: entry.hours,
    billable: entry.billable,
    written_off: entry.writtenOff,
    note: entry.note,
  });
  if (error) console.warn("[supabase] time upsert failed:", error.message);
  return !error;
}

export async function deleteTimeEntryRow(id: string, workspaceId: string): Promise<boolean> {
  if (!supabase) return true;
  const { error } = await supabase.from(TIME).delete().eq("workspace_id", workspaceId).eq("id", id);
  if (error) console.warn("[supabase] time delete failed:", error.message);
  return !error;
}

export type TimeChange =
  | { type: "upsert"; entry: TimeEntry }
  | { type: "delete"; id: string };

export function subscribeToTimeEntries(
  workspaceId: string,
  onChange: (change: TimeChange) => void,
): () => void {
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`time-${workspaceId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TIME, filter: `workspace_id=eq.${workspaceId}` },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as Partial<TimeEntryRow>).id;
          if (id) onChange({ type: "delete", id });
        } else {
          onChange({ type: "upsert", entry: timeFromRow(payload.new as TimeEntryRow) });
        }
      },
    )
    .subscribe();
  return () => {
    void supabase?.removeChannel(channel);
  };
}
