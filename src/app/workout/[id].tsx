import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useWorkoutDetail } from '@/hooks/use-workouts';

export default function WorkoutDetailScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: workout, isPending, error } = useWorkoutDetail(id);

  if (isPending) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !workout) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Could not load workout.</Text>
        <Text style={{ color: colors.textSecondary }}>{error?.message}</Text>
      </View>
    );
  }

  const setsByExercise = workout.workout_sets.reduce<
    Map<number, typeof workout.workout_sets>
  >((groups, set) => {
    const group = groups.get(set.exercise_id) ?? [];
    group.push(set);
    groups.set(set.exercise_id, group);
    return groups;
  }, new Map());

  const date = new Date(workout.started_at).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.date, { color: colors.textSecondary }]}>{date}</Text>

      {[...setsByExercise.values()].map((sets) => (
        <View
          key={sets[0].exercise_id}
          style={[styles.card, { backgroundColor: colors.backgroundElement }]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {sets[0].exercises.name}
          </Text>
          {sets
            .sort((a, b) => a.set_number - b.set_number)
            .map((set) => (
              <View key={set.id} style={styles.setRow}>
                <Text style={[styles.setNum, { color: colors.textSecondary }]}>
                  Set {set.set_number}
                </Text>
                <Text style={[styles.setValue, { color: colors.text }]}>
                  {Number(set.weight_kg) > 0
                    ? `${Number(set.weight_kg)} kg × ${set.reps}`
                    : `${set.reps} reps`}
                </Text>
              </View>
            ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  date: {
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  setNum: {
    fontSize: 14,
  },
  setValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
