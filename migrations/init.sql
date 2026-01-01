-- Protocol ECLIPSE Database Schema (Standard Postgres)
-- Version: 1.1 (Supabase Dependencies Removed)

-- 1. Enable Database Extensions
create extension if not exists "uuid-ossp";

-- 2. Create Enums
create type game_status as enum ('lobby', 'active', 'voting', 'ended');
create type player_role as enum ('crew', 'ghost');

-- 3. Create Tables

-- MATCHES
create table public.matches (
    id uuid primary key default uuid_generate_v4(),
    encryption_key text not null unique, -- Room Code (4 digits)
    status game_status default 'lobby'::game_status,
    extraction_progress int default 0 check (extraction_progress between 0 and 100),
    meeting_cooldown timestamp with time zone,
    created_at timestamp with time zone default now()
);

-- PLAYERS
create table public.players (
    id uuid primary key default uuid_generate_v4(),
    user_id text, -- Mapped to NextAuth User ID or Session ID
    match_id uuid references public.matches(id) on delete cascade,
    role player_role, -- SECRET: Application Layer must handle visibility
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

-- Indexes for performance
create index idx_matches_code on public.matches(encryption_key);
create index idx_players_match on public.players(match_id);
create index idx_chat_match on public.chat_logs(match_id);
