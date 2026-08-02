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
