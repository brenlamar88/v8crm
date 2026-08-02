-- ============================================================================
-- V8 CRM — Supabase schema (v2, with auth)
-- Run this once in Supabase → SQL Editor. Safe to re-run: it drops and recreates
-- the accounts table, so any existing demo rows are cleared (the app re-seeds a
-- signed-in user's book automatically on first load).
--
-- This version scopes every row to the authenticated user (owner_id = auth.uid())
-- so each account only ever sees its own book. If the table is absent the app
-- silently falls back to local storage, so nothing breaks before you run it.
-- ============================================================================

drop table if exists public.accounts cascade;

create table public.accounts (
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  code        text not null,
  name        text not null,
  vertical    text not null,
  stage       text not null,
  mrr         integer not null default 0,
  health      integer not null default 60,
  owner       text not null default 'BR',
  trend       jsonb not null default '[]'::jsonb,
  started     text not null default '—',
  renewal     text not null default '—',
  summary     text not null default '',
  next_step   text not null default '',
  contacts    jsonb not null default '[]'::jsonb,
  timeline    jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  primary key (owner_id, code)
);

create index accounts_owner_created_idx on public.accounts (owner_id, created_at);

-- Row Level Security: each user reads and writes only their own rows ----------
alter table public.accounts enable row level security;

create policy "own accounts read"
  on public.accounts for select
  to authenticated
  using (owner_id = auth.uid());

create policy "own accounts insert"
  on public.accounts for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "own accounts update"
  on public.accounts for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "own accounts delete"
  on public.accounts for delete
  to authenticated
  using (owner_id = auth.uid());

-- Realtime: broadcast row changes to the owner's subscribed sessions so edits
-- sync live across tabs/devices. RLS still applies — a client only receives
-- changes to rows its SELECT policy permits. (The drop above removes the table
-- from the publication, so this re-add is safe on re-run.)
alter publication supabase_realtime add table public.accounts;

-- Profiles -------------------------------------------------------------------
-- One row per user for display name / role / workspace, editable in Settings.
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

-- Avatars (Supabase Storage) -------------------------------------------------
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
