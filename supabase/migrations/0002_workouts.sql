-- WePump · Phase 2: exercise library, workouts, sets, personal records
-- Run this in the Supabase Dashboard → SQL Editor

-- ============================================================
-- 1. Exercises
-- ============================================================
create table public.exercises (
  id bigint generated always as identity primary key,
  name text not null unique,
  muscle_group text not null check (muscle_group in
    ('chest','back','shoulders','biceps','triceps','legs','core','cardio','full_body')),
  equipment text,
  is_custom boolean not null default false,
  created_by uuid references auth.users (id) on delete set null
);

alter table public.exercises enable row level security;

create policy "Exercises are viewable by authenticated users"
  on public.exercises for select
  to authenticated
  using (true);

create policy "Users can add custom exercises"
  on public.exercises for insert
  to authenticated
  with check (is_custom = true and created_by = (select auth.uid()));

-- ============================================================
-- 2. Workouts
-- ============================================================
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text check (char_length(notes) <= 500),
  xp_earned int not null default 0,
  created_at timestamptz not null default now()
);

create index workouts_user_idx on public.workouts (user_id, started_at desc);

alter table public.workouts enable row level security;

create policy "Users can view own workouts"
  on public.workouts for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own workouts"
  on public.workouts for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own workouts"
  on public.workouts for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own workouts"
  on public.workouts for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- xp_earned is server-controlled (Phase 3). Clients may not write it.
revoke insert, update on public.workouts from authenticated, anon;
grant insert (user_id, started_at, completed_at, notes) on public.workouts to authenticated;
grant update (notes, completed_at) on public.workouts to authenticated;

-- ============================================================
-- 3. Workout sets (with plausibility limits)
-- ============================================================
create table public.workout_sets (
  id bigint generated always as identity primary key,
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id bigint not null references public.exercises (id),
  set_number int not null check (set_number between 1 and 50),
  reps int not null check (reps between 1 and 200),
  weight_kg numeric(6,2) not null default 0 check (weight_kg between 0 and 600)
);

create index workout_sets_workout_idx on public.workout_sets (workout_id);

alter table public.workout_sets enable row level security;

create policy "Users can view sets of own workouts"
  on public.workout_sets for select
  to authenticated
  using (exists (
    select 1 from public.workouts w
    where w.id = workout_id and w.user_id = (select auth.uid())
  ));

create policy "Users can insert sets into own workouts"
  on public.workout_sets for insert
  to authenticated
  with check (exists (
    select 1 from public.workouts w
    where w.id = workout_id and w.user_id = (select auth.uid())
  ));

create policy "Users can delete sets of own workouts"
  on public.workout_sets for delete
  to authenticated
  using (exists (
    select 1 from public.workouts w
    where w.id = workout_id and w.user_id = (select auth.uid())
  ));

-- ============================================================
-- 4. Personal records — maintained ONLY by trigger (anti-cheat)
-- ============================================================
create table public.personal_records (
  user_id uuid not null references public.profiles (id) on delete cascade,
  exercise_id bigint not null references public.exercises (id),
  best_weight_kg numeric(6,2) not null,
  best_reps int not null,
  achieved_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

alter table public.personal_records enable row level security;

-- Public read: PRs appear on public profiles / leaderboards later.
create policy "Personal records are viewable by everyone"
  on public.personal_records for select
  using (true);

-- No insert/update/delete policies: writes happen via the trigger below.

create or replace function public.update_personal_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  wk_user uuid;
begin
  select user_id into wk_user from public.workouts where id = new.workout_id;

  insert into public.personal_records (user_id, exercise_id, best_weight_kg, best_reps, achieved_at)
  values (wk_user, new.exercise_id, new.weight_kg, new.reps, now())
  on conflict (user_id, exercise_id) do update
    set best_weight_kg = excluded.best_weight_kg,
        best_reps = excluded.best_reps,
        achieved_at = excluded.achieved_at
    where excluded.best_weight_kg > personal_records.best_weight_kg
       or (excluded.best_weight_kg = personal_records.best_weight_kg
           and excluded.best_reps > personal_records.best_reps);

  return new;
end;
$$;

create trigger on_workout_set_inserted
  after insert on public.workout_sets
  for each row execute function public.update_personal_record();

-- ============================================================
-- 5. Seed exercise library (~100 exercises)
-- ============================================================
insert into public.exercises (name, muscle_group, equipment) values
  -- Chest
  ('Bench Press', 'chest', 'barbell'),
  ('Incline Bench Press', 'chest', 'barbell'),
  ('Decline Bench Press', 'chest', 'barbell'),
  ('Dumbbell Bench Press', 'chest', 'dumbbell'),
  ('Incline Dumbbell Press', 'chest', 'dumbbell'),
  ('Dumbbell Fly', 'chest', 'dumbbell'),
  ('Cable Crossover', 'chest', 'cable'),
  ('Pec Deck', 'chest', 'machine'),
  ('Machine Chest Press', 'chest', 'machine'),
  ('Chest Dip', 'chest', 'bodyweight'),
  ('Push-Up', 'chest', 'bodyweight'),
  -- Back
  ('Deadlift', 'back', 'barbell'),
  ('Bent-Over Row', 'back', 'barbell'),
  ('Pendlay Row', 'back', 'barbell'),
  ('T-Bar Row', 'back', 'barbell'),
  ('Rack Pull', 'back', 'barbell'),
  ('Dumbbell Row', 'back', 'dumbbell'),
  ('Pull-Up', 'back', 'bodyweight'),
  ('Chin-Up', 'back', 'bodyweight'),
  ('Lat Pulldown', 'back', 'cable'),
  ('Seated Cable Row', 'back', 'cable'),
  ('Straight-Arm Pulldown', 'back', 'cable'),
  ('Face Pull', 'back', 'cable'),
  ('Machine Row', 'back', 'machine'),
  ('Back Extension', 'back', 'bodyweight'),
  ('Good Morning', 'back', 'barbell'),
  -- Shoulders
  ('Overhead Press', 'shoulders', 'barbell'),
  ('Push Press', 'shoulders', 'barbell'),
  ('Dumbbell Shoulder Press', 'shoulders', 'dumbbell'),
  ('Arnold Press', 'shoulders', 'dumbbell'),
  ('Lateral Raise', 'shoulders', 'dumbbell'),
  ('Front Raise', 'shoulders', 'dumbbell'),
  ('Rear Delt Fly', 'shoulders', 'dumbbell'),
  ('Cable Lateral Raise', 'shoulders', 'cable'),
  ('Upright Row', 'shoulders', 'barbell'),
  ('Machine Shoulder Press', 'shoulders', 'machine'),
  ('Barbell Shrug', 'shoulders', 'barbell'),
  ('Dumbbell Shrug', 'shoulders', 'dumbbell'),
  -- Biceps
  ('Barbell Curl', 'biceps', 'barbell'),
  ('EZ-Bar Curl', 'biceps', 'barbell'),
  ('Dumbbell Curl', 'biceps', 'dumbbell'),
  ('Hammer Curl', 'biceps', 'dumbbell'),
  ('Incline Dumbbell Curl', 'biceps', 'dumbbell'),
  ('Concentration Curl', 'biceps', 'dumbbell'),
  ('Preacher Curl', 'biceps', 'barbell'),
  ('Cable Curl', 'biceps', 'cable'),
  -- Triceps
  ('Close-Grip Bench Press', 'triceps', 'barbell'),
  ('Skull Crusher', 'triceps', 'barbell'),
  ('Triceps Pushdown', 'triceps', 'cable'),
  ('Overhead Triceps Extension', 'triceps', 'dumbbell'),
  ('Cable Overhead Extension', 'triceps', 'cable'),
  ('Triceps Dip', 'triceps', 'bodyweight'),
  ('Diamond Push-Up', 'triceps', 'bodyweight'),
  ('Triceps Kickback', 'triceps', 'dumbbell'),
  -- Legs
  ('Squat', 'legs', 'barbell'),
  ('Front Squat', 'legs', 'barbell'),
  ('Goblet Squat', 'legs', 'dumbbell'),
  ('Hack Squat', 'legs', 'machine'),
  ('Leg Press', 'legs', 'machine'),
  ('Romanian Deadlift', 'legs', 'barbell'),
  ('Sumo Deadlift', 'legs', 'barbell'),
  ('Leg Extension', 'legs', 'machine'),
  ('Lying Leg Curl', 'legs', 'machine'),
  ('Seated Leg Curl', 'legs', 'machine'),
  ('Bulgarian Split Squat', 'legs', 'dumbbell'),
  ('Walking Lunge', 'legs', 'dumbbell'),
  ('Step-Up', 'legs', 'dumbbell'),
  ('Hip Thrust', 'legs', 'barbell'),
  ('Glute Bridge', 'legs', 'bodyweight'),
  ('Standing Calf Raise', 'legs', 'machine'),
  ('Seated Calf Raise', 'legs', 'machine'),
  ('Box Jump', 'legs', 'bodyweight'),
  -- Core
  ('Plank', 'core', 'bodyweight'),
  ('Side Plank', 'core', 'bodyweight'),
  ('Crunch', 'core', 'bodyweight'),
  ('Bicycle Crunch', 'core', 'bodyweight'),
  ('Sit-Up', 'core', 'bodyweight'),
  ('Russian Twist', 'core', 'bodyweight'),
  ('Hanging Leg Raise', 'core', 'bodyweight'),
  ('Cable Crunch', 'core', 'cable'),
  ('Ab Wheel Rollout', 'core', 'other'),
  ('Mountain Climber', 'core', 'bodyweight'),
  ('Dead Bug', 'core', 'bodyweight'),
  ('Hollow Body Hold', 'core', 'bodyweight'),
  -- Cardio
  ('Treadmill Run', 'cardio', 'machine'),
  ('Rowing Machine', 'cardio', 'machine'),
  ('Assault Bike', 'cardio', 'machine'),
  ('Stair Climber', 'cardio', 'machine'),
  ('Elliptical', 'cardio', 'machine'),
  ('Cycling', 'cardio', 'machine'),
  ('Jump Rope', 'cardio', 'other'),
  ('Sprint', 'cardio', 'bodyweight'),
  ('Burpee', 'cardio', 'bodyweight'),
  -- Full body
  ('Clean and Jerk', 'full_body', 'barbell'),
  ('Power Clean', 'full_body', 'barbell'),
  ('Snatch', 'full_body', 'barbell'),
  ('Thruster', 'full_body', 'barbell'),
  ('Kettlebell Swing', 'full_body', 'kettlebell'),
  ('Turkish Get-Up', 'full_body', 'kettlebell'),
  ('Farmer''s Carry', 'full_body', 'dumbbell'),
  ('Battle Ropes', 'full_body', 'other'),
  ('Sled Push', 'full_body', 'other'),
  ('Wall Ball', 'full_body', 'other');
