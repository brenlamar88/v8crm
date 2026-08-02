/* ----------------------------------------------------------------------------
   Supabase data layer. The client only exists when the project's URL + anon key
   are present in the build (wired in vite.config from the Vercel integration).
   Everything here is best-effort: if Supabase is absent, the table is missing,
   or a call fails, callers fall back to the local store so the app never breaks.
   -------------------------------------------------------------------------- */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Account, Contact, Task, TimelineEvent } from "../data.ts";

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
  };
}

/** Fetch the whole book. Returns null on any failure (missing table, network,
    RLS) so the caller keeps its local data. */
export async function fetchAccounts(): Promise<Account[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("[supabase] fetch failed, using local data:", error.message);
    return null;
  }
  return (data as AccountRow[]).map(fromRow);
}

/** Insert or update one account. Best-effort. owner_id is defaulted to
    auth.uid() server-side, so the conflict target is (owner_id, code). */
export async function upsertAccount(account: Account): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from(TABLE)
    .upsert(toRow(account), { onConflict: "owner_id,code" });
  if (error) console.warn("[supabase] upsert failed:", error.message);
}

/** Remove one account. Best-effort. */
export async function deleteAccountRow(code: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from(TABLE).delete().eq("code", code);
  if (error) console.warn("[supabase] delete failed:", error.message);
}

export type AccountChange =
  | { type: "upsert"; account: Account }
  | { type: "delete"; code: string };

/** Subscribe to live row changes for one owner's accounts. Returns an
    unsubscribe fn; a no-op when Supabase is off. */
export function subscribeToAccounts(
  ownerId: string,
  onChange: (change: AccountChange) => void,
): () => void {
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`accounts-${ownerId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE, filter: `owner_id=eq.${ownerId}` },
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

/** Seed the table from the bundled accounts if it's currently empty. */
export async function seedIfEmpty(seed: Account[]): Promise<void> {
  if (!supabase) return;
  const { count, error } = await supabase
    .from(TABLE)
    .select("code", { count: "exact", head: true });
  if (error || (count ?? 0) > 0) return;
  const { error: insErr } = await supabase.from(TABLE).insert(seed.map(toRow));
  if (insErr) console.warn("[supabase] seed failed:", insErr.message);
}
