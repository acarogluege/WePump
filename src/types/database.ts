export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  level: number;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  streak_freezes: number;
  created_at: string;
  updated_at: string;
};
