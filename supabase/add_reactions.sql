-- Migration: add reactions table for social feed
-- Run in Supabase SQL Editor

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users on delete cascade not null,
  log_id uuid references public.logs on delete cascade not null,
  emoji text not null default '❤',
  created_at timestamptz default now(),
  unique (user_id, log_id, emoji)
);

alter table public.reactions enable row level security;

create policy "reactions: read all"   on public.reactions for select using (true);
create policy "reactions: insert own" on public.reactions for insert with check (auth.uid() = user_id);
create policy "reactions: delete own" on public.reactions for delete using (auth.uid() = user_id);

-- Allow reading trail completions across users (user_trails already has RLS)
-- Add a read-all policy so the feed can show other users' trail completions
create policy "user_trails: read all" on public.user_trails for select using (true);
