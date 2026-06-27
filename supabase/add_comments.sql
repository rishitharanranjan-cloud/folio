-- Migration: add comments table
-- Run in Supabase SQL Editor

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users on delete cascade not null,
  log_id     uuid references public.logs on delete cascade not null,
  body       text not null check (char_length(body) > 0 and char_length(body) <= 1000),
  created_at timestamptz default now()
);

alter table public.comments enable row level security;

create policy "comments: read all"   on public.comments for select using (true);
create policy "comments: insert own" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments: delete own" on public.comments for delete using (auth.uid() = user_id);
