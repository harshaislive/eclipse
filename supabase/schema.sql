-- Protocol ECLIPSE Database Schema
-- Version: 1.0

-- 1. Enable Database Extensions
create extension if not exists "uuid-ossp";

-- 2. Create Enums
create type game_status as enum ('lobby', 'active', 'voting', 'ended');
create type player_role as enum ('crew', 'ghost');

-- 3. Create Tables

-- MATCHES
create table public.matches (
    id uuid primary key default uuid_generate_v4(),
    encryption_key text not null, -- Room Code (4 digits)
    status game_status default 'lobby'::game_status,
    extraction_progress int default 0 check (extraction_progress between 0 and 100),
    meeting_cooldown timestamp with time zone,
    created_at timestamp with time zone default now()
);

-- PLAYERS
create table public.players (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id), -- Linked to Supabase Auth
    match_id uuid references public.matches(id) on delete cascade,
    role player_role, -- SECRET: Controlled by Edge Function
    is_alive boolean default true,
    skin_id text, -- 'fixer', 'cipher', 'muscle', 'face'
    last_heartbeat timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    unique(match_id, user_id) -- One player instance per match per user
);

-- CHAT LOGS
create table public.chat_logs (
    id uuid primary key default uuid_generate_v4(),
    match_id uuid references public.matches(id) on delete cascade,
    sender_id uuid references public.players(id),
    message text not null,
    phase text, -- e.g., 'lobby', 'active', 'voting'
    created_at timestamp with time zone default now()
);

-- 4. Enable Row Level Security (RLS)
alter table public.matches enable row level security;
alter table public.players enable row level security;
alter table public.chat_logs enable row level security;

-- 5. Create Views (For Public/Safe Access)
-- View to see players WITHOUT revealing their role.
create view public.public_players as
select 
    id, 
    match_id, 
    user_id, 
    is_alive, 
    skin_id, 
    last_heartbeat,
    created_at
from public.players;

-- Grant access to the view
grant select on public.public_players to authenticated, anon;

-- 6. RLS Policies

-- MATCHES:
-- Allow anyone to create a match (authenticated)
create policy "Users can create matches"
on public.matches for insert
to authenticated
with check (true);

-- Allow everyone to view matches (to join by code)
create policy "Matches are viewable by everyone"
on public.matches for select
using (true);

-- PLAYERS:
-- 1. Users can see their OWN full record (including role)
create policy "Users can see their own player row"
on public.players for select
using (auth.uid() = user_id);

-- 2. Users can see other players in the same match (needed for game loop)
-- WARNING: If a user selects specific columns, they might see 'role'.
-- It is strongly recommended to use the 'public_players' view for fetching lists.
create policy "Users can see players in their match"
on public.players for select
using (
  match_id in (
    select match_id from public.players where user_id = auth.uid()
  )
);

-- 3. Users can join a match (insert themselves)
create policy "Users can join matches"
on public.players for insert
to authenticated
with check (auth.uid() = user_id);

-- 4. Users can update their own heartbeat/skin
create policy "Users can update own player"
on public.players for update
using (auth.uid() = user_id);

-- CHAT:
-- Users can see chat for their match
create policy "Users can see chat in their match"
on public.chat_logs for select
using (
  match_id in (
    select match_id from public.players where user_id = auth.uid()
  )
);

-- Users can post chat messages in their match
create policy "Users can insert chat in their match"
on public.chat_logs for insert
with check (
  match_id in (
    select match_id from public.players where user_id = auth.uid()
  )
);
