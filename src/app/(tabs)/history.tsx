import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useWorkoutHistory, WorkoutListItem } from '@/hooks/use-workouts';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatDuration(startedAt: string, completedAt: string | null) {
  if (!completedAt) return '';
  const minutes = Math.max(
    1,
    Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60000)
  );
  return `${minutes} min`;
}

function WorkoutRow({ workout }: { workout: WorkoutListItem }) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const setCount = workout.workout_sets[0]?.count ?? 0;

  return (
    <Pressable
      style={[styles.row, { backgroundColor: colors.backgroundElement }]}
      onPress={() => router.push({ pathname: '/workout/[id]', params: { id: workout.id } })}
    >
      <View style={styles.rowLeft}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>
          {formatDate(workout.started_at)}
        </Text>
        <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
          {setCount} sets · {formatDuration(workout.started_at, workout.completed_at)}
        </Text>
      </View>
      <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { data: workouts, isPending, error } = useWorkoutHistory();

  if (isPending) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Could not load history.</Text>
        <Text style={{ color: colors.textSecondary }}>{error.message}</Text>
      </View>
    );
  }

  if (!workouts || workouts.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={styles.emptyEmoji}>🏋️</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No workouts yet</Text>
        <Text style={{ color: colors.textSecondary }}>
          Start your first workout from the Home tab!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.list}
      data={workouts}
      keyExtractor={(w) => w.id}
      renderItem={({ item }) => <WorkoutRow workout={item} />}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  list: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: Spacing.three,
  },
  rowLeft: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 13,
  },
  chevron: {
    fontSize: 24,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});
