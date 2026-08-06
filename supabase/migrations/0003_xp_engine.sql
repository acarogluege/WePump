-- WePump · Phase 3: XP engine — xp_events, streaks, levels, award function
-- Run this in the Supabase Dashboard → SQL Editor

-- ============================================================
-- 1. Track last workout day for streak logic
-- ============================================================
alter table public.profiles add column last_workout_date date;

-- ============================================================
-- 2. XP events — audit trail, source of truth for XP
-- ============================================================
create table public.xp_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount int not null check (amount >= 0),
  reason text not null,
  workout_id uuid references public.workouts (id) on delete set null,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index xp_events_user_idx on public.xp_events (user_id, created_at desc);
-- one XP award per workout (idempotency)
create unique index xp_events_workout_uidx on public.xp_events (workout_id)
  where workout_id is not null;

alter table public.xp_events enable row level security;

create policy "Users can view own xp events"
  on public.xp_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- No insert/update/delete policies: only the award function writes.

-- ============================================================
-- 3. Award function — ALL XP math happens here (anti-cheat)
--
-- Rules:
--   base XP: 50 first workout of the day, 10 for later workouts
--   set XP:  2 per set, max 40 set-XP per day
--   PR XP:   25 per personal record, max 3 per workout
--   streak:  +1 per day; a 1-day gap consumes a streak freeze;
--            otherwise resets to 1. (Days are UTC for now.)
--   multiplier: ×1.5 on base+set XP at a 7-day streak
--   level:   floor(sqrt(total_xp / 100)) + 1
--            (level 2 @ 100 XP, 3 @ 400, 4 @ 900, ...)
-- ============================================================
create or replace function public.award_workout_xp(p_workout_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := (select auth.uid());
  w record;
  p record;
  v_today date := current_date;
  v_set_count int;
  v_daily_set_xp int;
  v_base int;
  v_set_xp int;
  v_pr_count int;
  v_pr_xp int;
  v_mult numeric := 1.0;
  v_streak int;
  v_freezes int;
  v_freeze_used boolean := false;
  v_total int;
  v_new_total int;
  v_old_level int;
  v_new_level int;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select * into w from workouts where id = p_workout_id and user_id = v_user;
  if not found then
    raise exception 'Workout not found';
  end if;
  if w.completed_at is null then
    raise exception 'Workout is not completed';
  end if;
  if exists (select 1 from xp_events where workout_id = p_workout_id) then
    raise exception 'XP already awarded for this workout';
  end if;

  select count(*) into v_set_count from workout_sets where workout_id = p_workout_id;
  if v_set_count = 0 then
    raise exception 'No sets logged';
  end if;

  -- base XP: 50 for the first awarded workout today, 10 afterwards
  if exists (
    select 1 from xp_events
    where user_id = v_user
      and reason = 'workout'
      and created_at::date = v_today
  ) then
    v_base := 10;
  else
    v_base := 50;
  end if;

  -- set XP: 2 per set, shared daily budget of 40
  select coalesce(sum((detail ->> 'set_xp')::int), 0) into v_daily_set_xp
  from xp_events
  where user_id = v_user
    and reason = 'workout'
    and created_at::date = v_today;
  v_set_xp := least(v_set_count * 2, greatest(0, 40 - v_daily_set_xp));

  -- PR bonus: personal records achieved during this workout, max 3
  select count(*) into v_pr_count
  from personal_records
  where user_id = v_user and achieved_at >= w.created_at;
  v_pr_xp := least(v_pr_count, 3) * 25;

  -- streak update (lock the profile row)
  select * into p from profiles where id = v_user for update;
  v_streak := p.current_streak;
  v_freezes := p.streak_freezes;

  if p.last_workout_date is null then
    v_streak := 1;
  elsif p.last_workout_date = v_today then
    v_streak := greatest(v_streak, 1);
  elsif p.last_workout_date = v_today - 1 then
    v_streak := v_streak + 1;
  elsif p.last_workout_date = v_today - 2 and v_freezes > 0 then
    v_freezes := v_freezes - 1;
    v_freeze_used := true;
    v_streak := v_streak + 1;
  else
    v_streak := 1;
  end if;

  if v_streak >= 7 then
    v_mult := 1.5;
  end if;

  v_total := round((v_base + v_set_xp) * v_mult)::int + v_pr_xp;

  insert into xp_events (user_id, amount, reason, workout_id, detail)
  values (
    v_user, v_total, 'workout', p_workout_id,
    jsonb_build_object(
      'base_xp', v_base,
      'set_xp', v_set_xp,
      'pr_xp', v_pr_xp,
      'multiplier', v_mult,
      'set_count', v_set_count
    )
  );

  update workouts set xp_earned = v_total where id = p_workout_id;

  v_old_level := p.level;
  v_new_total := p.total_xp + v_total;
  v_new_level := floor(sqrt(v_new_total / 100.0))::int + 1;

  update profiles set
    total_xp = v_new_total,
    level = v_new_level,
    current_streak = v_streak,
    longest_streak = greatest(p.longest_streak, v_streak),
    streak_freezes = v_freezes,
    last_workout_date = v_today
  where id = v_user;

  return jsonb_build_object(
    'xp_awarded', v_total,
    'base_xp', v_base,
    'set_xp', v_set_xp,
    'pr_xp', v_pr_xp,
    'multiplier', v_mult,
    'streak', v_streak,
    'freeze_used', v_freeze_used,
    'total_xp', v_new_total,
    'level', v_new_level,
    'leveled_up', v_new_level > v_old_level,
    'next_level_xp', v_new_level * v_new_level * 100
  );
end;
$$;

revoke all on function public.award_workout_xp(uuid) from public, anon;
grant execute on function public.award_workout_xp(uuid) to authenticated;
