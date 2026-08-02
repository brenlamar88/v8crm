-- ============================================================================
-- V8 CRM — Supabase schema (v3, teams / shared workspaces)
-- Run this once in Supabase → SQL Editor. Safe to re-run: it drops and recreates
-- the app tables, so any existing demo rows are cleared (the app re-seeds a
-- workspace's book automatically on first load).
--
-- Data model
--   workspaces   — a shared team space; the unit every account belongs to.
--   memberships  — who is in a workspace and their role ('owner' | 'member').
--   invitations  — pending invites by email; claimed on the invitee's next login.
--   accounts     — the CRM book, scoped to a workspace (not to a single user).
--
-- Access control is membership-based: you see a workspace's accounts iff you are
-- a member of that workspace. Owners can rename the workspace, invite/remove
-- members, and revoke invitations. If the tables are absent the app silently
-- falls back to local storage, so nothing breaks before you run this.
-- ============================================================================

-- ── Reset ───────────────────────────────────────────────────────────────────
drop table if exists public.accounts    cascade;
drop table if exists public.invitations cascade;
drop table if exists public.memberships cascade;
drop table if exists public.workspaces  cascade;

-- ── Workspaces ───────────────────────────────────────────────────────────────
create table public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'My Workspace',
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ── Memberships ──────────────────────────────────────────────────────────────
-- `email` is denormalized from auth.users so the team roster can be listed
-- without reaching into the auth schema (which clients can't read).
create table public.memberships (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         text not null default 'member',
  email        text,
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- ── Invitations ──────────────────────────────────────────────────────────────
create table public.invitations (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email        text not null,
  invited_by   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (workspace_id, email)
);

-- ── Accounts (the CRM book, workspace-scoped) ────────────────────────────────
create table public.accounts (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  code         text not null,
  name         text not null,
  vertical     text not null,
  stage        text not null,
  mrr          integer not null default 0,
  health       integer not null default 60,
  owner        text not null default 'BR',
  trend        jsonb not null default '[]'::jsonb,
  started      text not null default '—',
  renewal      text not null default '—',
  summary      text not null default '',
  next_step    text not null default '',
  contacts     jsonb not null default '[]'::jsonb,
  timeline     jsonb not null default '[]'::jsonb,
  tasks        jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  primary key (workspace_id, code)
);

create index accounts_workspace_created_idx on public.accounts (workspace_id, created_at);

-- ── Membership helpers ───────────────────────────────────────────────────────
-- SECURITY DEFINER so RLS policies can test membership without recursing into
-- the memberships table's own policies. Locked to authenticated callers below.
create or replace function public.is_member(ws uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.workspace_id = ws and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_owner(ws uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.workspace_id = ws and m.user_id = auth.uid() and m.role = 'owner'
  );
$$;

-- ── RPCs ─────────────────────────────────────────────────────────────────────
-- create_workspace: make a workspace and add the caller as its owner in one
-- atomic step (a bare INSERT can't, since the owner membership must be written
-- by the same statement that knows the new id).
create or replace function public.create_workspace(ws_name text)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare ws uuid;
begin
  insert into public.workspaces (name, created_by)
    values (coalesce(nullif(trim(ws_name), ''), 'My Workspace'), auth.uid())
    returning id into ws;
  insert into public.memberships (workspace_id, user_id, role, email)
    values (ws, auth.uid(), 'owner', lower(auth.jwt() ->> 'email'));
  return ws;
end $$;

-- accept_invitations: turn any pending invites for the caller's email into
-- memberships, then clear them. Called on sign-in.
create or replace function public.accept_invitations()
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare em text;
begin
  em := lower(auth.jwt() ->> 'email');
  if em is null then return; end if;
  insert into public.memberships (workspace_id, user_id, role, email)
    select i.workspace_id, auth.uid(), 'member', em
    from public.invitations i where lower(i.email) = em
    on conflict do nothing;
  delete from public.invitations i where lower(i.email) = em;
end $$;

-- These functions must never be callable by the anon (pre-login) role; only
-- signed-in users may create workspaces or claim invites.
revoke execute on function public.is_member(uuid)        from anon;
revoke execute on function public.is_owner(uuid)         from anon;
revoke execute on function public.create_workspace(text) from anon;
revoke execute on function public.accept_invitations()   from anon;

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.workspaces  enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.accounts    enable row level security;

-- Workspaces: members (or the creator) can read; owners rename; creators delete.
-- There is no INSERT policy on purpose — new workspaces are created only through
-- create_workspace(), which also writes the owner membership.
create policy "ws read" on public.workspaces for select to authenticated
  using (is_member(id) or created_by = auth.uid());
create policy "ws update" on public.workspaces for update to authenticated
  using (is_owner(id)) with check (is_owner(id));
create policy "ws delete" on public.workspaces for delete to authenticated
  using (created_by = auth.uid());

-- Memberships: any member sees the roster; owners add members (used by the
-- accept_invitations definer path too); you can remove yourself, owners anyone.
create policy "memberships read" on public.memberships for select to authenticated
  using (is_member(workspace_id));
create policy "memberships insert" on public.memberships for insert to authenticated
  with check (is_owner(workspace_id));
create policy "memberships delete" on public.memberships for delete to authenticated
  using (is_owner(workspace_id) or user_id = auth.uid());

-- Invitations: members of the workspace manage them; the invitee can also see
-- and delete (accept/decline) their own by email.
create policy "invites read" on public.invitations for select to authenticated
  using (is_member(workspace_id) or lower(email) = lower(auth.jwt() ->> 'email'));
create policy "invites insert" on public.invitations for insert to authenticated
  with check (is_member(workspace_id));
create policy "invites delete" on public.invitations for delete to authenticated
  using (is_member(workspace_id) or lower(email) = lower(auth.jwt() ->> 'email'));

-- Accounts: full CRUD for any member of the owning workspace.
create policy "ws accounts read" on public.accounts for select to authenticated
  using (is_member(workspace_id));
create policy "ws accounts insert" on public.accounts for insert to authenticated
  with check (is_member(workspace_id));
create policy "ws accounts update" on public.accounts for update to authenticated
  using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy "ws accounts delete" on public.accounts for delete to authenticated
  using (is_member(workspace_id));

-- Realtime: broadcast account row changes to subscribed sessions so edits sync
-- live across a team's tabs/devices. RLS still applies — a client only receives
-- changes to rows its SELECT policy permits.
alter publication supabase_realtime add table public.accounts;

-- ── Overdue-task digest (email reminders) ────────────────────────────────────
-- Returns open, assigned, past-due tasks across every workspace, one row per
-- (assignee, task). Read by the `overdue-reminders` Edge Function with the
-- service role to email each assignee their own list. SECURITY DEFINER so it
-- can scan across workspaces; execute is locked to the service role. See
-- supabase/reminders.md for the activation runbook.
create or replace function public.overdue_task_digest()
returns table (
  assignee     text,
  workspace_id uuid,
  code         text,
  account      text,
  title        text,
  due_date     date
)
language sql
security definer
set search_path = public
as $$
  select
    lower(t->>'assignee')  as assignee,
    a.workspace_id,
    a.code,
    a.name                 as account,
    t->>'title'            as title,
    (t->>'dueDate')::date  as due_date
  from public.accounts a,
       lateral jsonb_array_elements(a.tasks) t
  where coalesce((t->>'done')::boolean, false) = false
    and nullif(t->>'assignee', '') is not null
    and nullif(t->>'dueDate', '') is not null
    and (t->>'dueDate')::date < current_date
  order by assignee, due_date;
$$;

revoke all on function public.overdue_task_digest() from public, anon, authenticated;
grant execute on function public.overdue_task_digest() to service_role;

-- ── Profiles ─────────────────────────────────────────────────────────────────
-- One row per user for display name / role / workspace label, editable in
-- Settings. (This `workspace` is just a free-text label on the profile; team
-- membership is governed by the memberships table above.)
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null default '',
  role       text not null default '',
  workspace  text not null default '',
  avatar_url text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "own profile read"   on public.profiles;
drop policy if exists "own profile insert"  on public.profiles;
drop policy if exists "own profile update"  on public.profiles;

create policy "own profile read"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "own profile insert"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

create policy "own profile update"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ── Avatars (Supabase Storage) ───────────────────────────────────────────────
-- A public bucket; files live under a folder named after the user's uid.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Public buckets serve object URLs without a SELECT policy, so we grant only
-- owner writes (no listing — avoids exposing every file). Reads happen via the
-- public URL.
drop policy if exists "avatar owner insert" on storage.objects;
drop policy if exists "avatar owner update" on storage.objects;
drop policy if exists "avatar owner delete" on storage.objects;

create policy "avatar owner insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatar owner update"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatar owner delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
