import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ActiveExercise } from '@/stores/workout-store';
import { Exercise, PersonalRecord, Workout, WorkoutSet } from '@/types/database';

export type WorkoutListItem = Workout & {
  workout_sets: { count: number }[];
};

export type WorkoutDetail = Workout & {
  workout_sets: (WorkoutSet & { exercises: Pick<Exercise, 'name' | 'muscle_group'> })[];
};

export function useWorkoutHistory() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['workouts', userId],
    enabled: !!userId,
    queryFn: async (): Promise<WorkoutListItem[]> => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*, workout_sets(count)')
        .order('started_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
}

export function useWorkoutDetail(workoutId: string) {
  return useQuery({
    queryKey: ['workout', workoutId],
    enabled: !!workoutId,
    queryFn: async (): Promise<WorkoutDetail> => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*, workout_sets(*, exercises(name, muscle_group))')
        .eq('id', workoutId)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function usePersonalRecords() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['personal-records', userId],
    enabled: !!userId,
    queryFn: async (): Promise<
      (PersonalRecord & { exercises: Pick<Exercise, 'name'> })[]
    > => {
      const { data, error } = await supabase
        .from('personal_records')
        .select('*, exercises(name)')
        .eq('user_id', userId!)
        .order('achieved_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

type FinishWorkoutInput = {
  startedAt: string;
  exercises: ActiveExercise[];
};

export function useFinishWorkout() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ startedAt, exercises }: FinishWorkoutInput) => {
      const userId = session!.user.id;

      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: userId,
          started_at: startedAt,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (workoutError) throw workoutError;

      const sets = exercises.flatMap((activeExercise) =>
        activeExercise.sets
          .map((s) => ({
            reps: parseInt(s.reps, 10),
            weight_kg: parseFloat(s.weightKg.replace(',', '.')) || 0,
          }))
          .filter((s) => Number.isFinite(s.reps) && s.reps > 0)
          .map((s, setIndex) => ({
            workout_id: workout.id as string,
            exercise_id: activeExercise.exercise.id,
            set_number: setIndex + 1,
            ...s,
          }))
      );

      if (sets.length > 0) {
        const { error: setsError } = await supabase.from('workout_sets').insert(sets);
        if (setsError) throw setsError;
      }

      return { workout: workout as Workout, setCount: sets.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['personal-records'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
