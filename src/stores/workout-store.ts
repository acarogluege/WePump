import { create } from 'zustand';

import { Exercise } from '@/types/database';

export type ActiveSet = {
  reps: string;
  weightKg: string;
};

export type ActiveExercise = {
  exercise: Exercise;
  sets: ActiveSet[];
};

type WorkoutStore = {
  startedAt: string | null;
  exercises: ActiveExercise[];
  start: () => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (exerciseIndex: number) => void;
  addSet: (exerciseIndex: number) => void;
  updateSet: (
    exerciseIndex: number,
    setIndex: number,
    patch: Partial<ActiveSet>
  ) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  reset: () => void;
};

const EMPTY_SET: ActiveSet = { reps: '', weightKg: '' };

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  startedAt: null,
  exercises: [],

  start: () =>
    set((state) =>
      state.startedAt ? state : { startedAt: new Date().toISOString(), exercises: [] }
    ),

  addExercise: (exercise) =>
    set((state) => {
      if (state.exercises.some((e) => e.exercise.id === exercise.id)) {
        return state;
      }
      return {
        exercises: [...state.exercises, { exercise, sets: [{ ...EMPTY_SET }] }],
      };
    }),

  removeExercise: (exerciseIndex) =>
    set((state) => ({
      exercises: state.exercises.filter((_, i) => i !== exerciseIndex),
    })),

  addSet: (exerciseIndex) =>
    set((state) => ({
      exercises: state.exercises.map((e, i) => {
        if (i !== exerciseIndex) return e;
        const last = e.sets[e.sets.length - 1] ?? EMPTY_SET;
        return { ...e, sets: [...e.sets, { ...last }] };
      }),
    })),

  updateSet: (exerciseIndex, setIndex, patch) =>
    set((state) => ({
      exercises: state.exercises.map((e, i) =>
        i === exerciseIndex
          ? {
              ...e,
              sets: e.sets.map((s, j) => (j === setIndex ? { ...s, ...patch } : s)),
            }
          : e
      ),
    })),

  removeSet: (exerciseIndex, setIndex) =>
    set((state) => ({
      exercises: state.exercises.map((e, i) =>
        i === exerciseIndex
          ? { ...e, sets: e.sets.filter((_, j) => j !== setIndex) }
          : e
      ),
    })),

  reset: () => set({ startedAt: null, exercises: [] }),
}));
