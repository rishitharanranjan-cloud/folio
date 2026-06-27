-- Folio schema — run once in Supabase SQL Editor

-- Users
create table if not exists public.users (
  id uuid primary key references auth.users on delete cascade,
  handle text unique,
  name text,
  bio text,
  mode text default 'dark',
  avatar_url text,
  created_at timestamptz default now()
);

-- Logs
create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users on delete cascade,
  media_type text not null,
  title text not null,
  creator text,
  year int,
  status text default 'finished',
  rating int check (rating between 1 and 5),
  review text,
  cover_url text,
  dominant_colour text,
  logged_at timestamptz default now(),
  external_id text
);

-- Taste seeds
create table if not exists public.taste_seeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users on delete cascade,
  name text not null,
  type text not null,
  added_at timestamptz default now()
);

-- Trails
create table if not exists public.trails (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  tag text,
  created_by uuid references public.users,
  stop_count int default 0,
  follower_count int default 0
);

-- Trail stops
create table if not exists public.trail_stops (
  id uuid primary key default gen_random_uuid(),
  trail_id uuid references public.trails on delete cascade,
  position int not null,
  media_type text,
  title text,
  creator text,
  cover_colour text,
  external_id text
);

-- User trail progress
create table if not exists public.user_trails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users on delete cascade,
  trail_id uuid references public.trails on delete cascade,
  joined_at timestamptz default now(),
  completed_at timestamptz
);

-- Social graph
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references public.users on delete cascade,
  following_id uuid references public.users on delete cascade,
  created_at timestamptz default now(),
  unique (follower_id, following_id)
);

-- Row-level security
alter table public.users enable row level security;
alter table public.logs enable row level security;
alter table public.taste_seeds enable row level security;
alter table public.trails enable row level security;
alter table public.trail_stops enable row level security;
alter table public.user_trails enable row level security;
alter table public.follows enable row level security;

-- RLS policies: users can read all, write own
create policy "users: read all" on public.users for select using (true);
create policy "users: write own" on public.users for all using (auth.uid() = id);

create policy "logs: read all" on public.logs for select using (true);
create policy "logs: write own" on public.logs for all using (auth.uid() = user_id);

create policy "taste_seeds: write own" on public.taste_seeds for all using (auth.uid() = user_id);

create policy "trails: read all" on public.trails for select using (true);
create policy "trail_stops: read all" on public.trail_stops for select using (true);

create policy "user_trails: own" on public.user_trails for all using (auth.uid() = user_id);
create policy "follows: own" on public.follows for all using (auth.uid() = follower_id);
