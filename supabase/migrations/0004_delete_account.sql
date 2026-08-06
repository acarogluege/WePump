-- WePump · Account self-deletion (required by App Store guideline 5.1.1(v))
-- Run this in the Supabase Dashboard → SQL Editor

create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not authenticated';
  end if;

  -- Cascades: auth.users → profiles → workouts → workout_sets,
  -- personal_records, xp_events.
  delete from auth.users where id = (select auth.uid());
end;
$$;

revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
