import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { useWorkoutStore } from '@/stores/workout-store';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { data: profile } = useProfile();
  const startWorkout = useWorkoutStore((s) => s.start);
  const hasActiveWorkout = useWorkoutStore((s) => s.startedAt !== null);

  function handleStartWorkout() {
    startWorkout();
    router.push('/workout/new');
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>💪 WePump</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {profile ? `Welcome back, @${profile.username}!` : 'Compete. Track. Grow.'}
      </Text>

      {profile && (
        <View style={[styles.streakCard, { backgroundColor: colors.backgroundElement }]}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={[styles.streakValue, { color: colors.text }]}>
            {profile.current_streak}-day streak
          </Text>
          <Text style={[styles.streakHint, { color: colors.textSecondary }]}>
            {profile.total_xp} XP · Level {profile.level}
          </Text>
        </View>
      )}

      <Pressable style={styles.startButton} onPress={handleStartWorkout}>
        <Text style={styles.startButtonText}>
          {hasActiveWorkout ? 'Resume Workout →' : 'Start Workout 🏋️'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
  },
  streakCard: {
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.one,
    alignSelf: 'stretch',
    marginTop: Spacing.four,
  },
  streakEmoji: {
    fontSize: 32,
  },
  streakValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  streakHint: {
    fontSize: 14,
  },
  startButton: {
    backgroundColor: '#208AEF',
    borderRadius: 16,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
