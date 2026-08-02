/* ----------------------------------------------------------------------------
   Supabase data layer. The client only exists when the project's URL + anon key
   are present in the build (wired in vite.config from the Vercel integration).
   Everything here is best-effort: if Supabase is absent, the table is missing,
   or a call fails, callers fall back to the local store so the app never breaks.
   -------------------------------------------------------------------------- */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Account, Contact, TimelineEvent } from "../data.ts";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseEnabled = Boolean(supabase);

const TABLE = "accounts";

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

/** Insert or update one account. Best-effort. */
export async function upsertAccount(account: Account): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from(TABLE).upsert(toRow(account), { onConflict: "code" });
  if (error) console.warn("[supabase] upsert failed:", error.message);
}

/** Remove one account. Best-effort. */
export async function deleteAccountRow(code: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from(TABLE).delete().eq("code", code);
  if (error) console.warn("[supabase] delete failed:", error.message);
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
