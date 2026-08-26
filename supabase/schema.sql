-- Supabase schema for shared cloud storage (GitHub Pages deploy).
-- Run in Supabase SQL Editor after creating a project.

create table if not exists public.app_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_state (id, payload)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

alter table public.app_state enable row level security;

drop policy if exists "public read" on public.app_state;
drop policy if exists "public insert" on public.app_state;
drop policy if exists "public update" on public.app_state;

create policy "public read"
  on public.app_state for select
  using (true);

create policy "public insert"
  on public.app_state for insert
  with check (true);

create policy "public update"
  on public.app_state for update
  using (true);
