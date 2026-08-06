export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  level: number;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  streak_freezes: number;
  last_workout_date: string | null;
  created_at: string;
  updated_at: string;
};

export type XpAward = {
  xp_awarded: number;
  base_xp: number;
  set_xp: number;
  pr_xp: number;
  multiplier: number;
  streak: number;
  freeze_used: boolean;
  total_xp: number;
  level: number;
  leveled_up: boolean;
  next_level_xp: number;
};

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'core'
  | 'cardio'
  | 'full_body';

export type Exercise = {
  id: number;
  name: string;
  muscle_group: MuscleGroup;
  equipment: string | null;
  is_custom: boolean;
  created_by: string | null;
};

export type Workout = {
  id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  xp_earned: number;
  created_at: string;
};

export type WorkoutSet = {
  id: number;
  workout_id: string;
  exercise_id: number;
  set_number: number;
  reps: number;
  weight_kg: number;
};

export type PersonalRecord = {
  user_id: string;
  exercise_id: number;
  best_weight_kg: number;
  best_reps: number;
  achieved_at: string;
};
