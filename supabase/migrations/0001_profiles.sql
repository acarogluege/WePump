-- WePump · Phase 1: profiles table, RLS policies, auto-create profile on signup
-- Run this in the Supabase Dashboard → SQL Editor

-- ============================================================
-- 1. Profiles table
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (char_length(username) between 3 and 20 and username ~ '^[a-zA-Z0-9_]+$'),
  avatar_url text,
  level int not null default 1,
  total_xp int not null default 0,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  streak_freezes int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Explicit even though auto-RLS is enabled on this project
alter table public.profiles enable row level security;

-- ============================================================
-- 2. RLS policies
-- ============================================================
-- Everyone (even signed-out users checking username availability)
-- can read profiles. Needed for leaderboards + public profiles.
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Users can update only their own row…
create policy "Users can update own profile"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- …and only harmless columns. XP / level / streaks stay server-controlled
-- (anti-cheat): clients get column-level UPDATE on username + avatar only.
revoke update on public.profiles from authenticated, anon;
grant update (username, avatar_url) on public.profiles to authenticated;

-- No INSERT/DELETE policies: profile rows are created by the trigger below
-- and removed via the auth.users cascade.

-- ============================================================
-- 3. Auto-create profile when a user signs up
--    (username passed as metadata from the app)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired text;
begin
  desired := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    'user_' || substr(new.id::text, 1, 8)
  );

  -- fall back to a unique generated name if taken/invalid
  begin
    insert into public.profiles (id, username) values (new.id, desired);
  exception when unique_violation or check_violation then
    insert into public.profiles (id, username)
    values (new.id, 'user_' || substr(new.id::text, 1, 8));
  end;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 4. Keep updated_at fresh
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
