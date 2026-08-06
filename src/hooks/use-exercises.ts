import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { Exercise } from '@/types/database';

export function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    staleTime: 24 * 60 * 60 * 1000,
    queryFn: async (): Promise<Exercise[]> => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}
