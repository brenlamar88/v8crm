-- ============================================================================
-- V8 CRM — Supabase schema
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query →
-- paste → Run. The app upserts/deletes rows here; if this table is absent the
-- app silently falls back to local storage, so nothing breaks before you run it.
-- ============================================================================

create table if not exists public.accounts (
  code        text primary key,
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
  created_at  timestamptz not null default now()
);

-- Keep newest-first ordering cheap.
create index if not exists accounts_created_at_idx on public.accounts (created_at);

-- Row Level Security ---------------------------------------------------------
-- The app currently has no sign-in, so it uses the public anon key. These
-- policies grant the anon role full access — fine for a single-tenant demo,
-- but OPEN to anyone with the anon key. Lock this down when you add Supabase
-- Auth: scope the policies to auth.uid() / an owner column instead.
alter table public.accounts enable row level security;

drop policy if exists "anon read accounts"   on public.accounts;
drop policy if exists "anon write accounts"   on public.accounts;

create policy "anon read accounts"
  on public.accounts for select
  to anon, authenticated
  using (true);

create policy "anon write accounts"
  on public.accounts for all
  to anon, authenticated
  using (true)
  with check (true);
