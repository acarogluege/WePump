import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

function BreakdownRow({ label, value }: { label: string; value: string }) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  return (
    <View style={styles.breakdownRow}>
      <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.breakdownValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

export default function WorkoutSummaryScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const params = useLocalSearchParams<{
    xp: string;
    baseXp: string;
    setXp: string;
    prXp: string;
    multiplier: string;
    streak: string;
    freezeUsed: string;
    level: string;
    leveledUp: string;
    totalXp: string;
    nextLevelXp: string;
  }>();

  const multiplier = parseFloat(params.multiplier ?? '1');
  const prXp = parseInt(params.prXp ?? '0', 10);
  const leveledUp = params.leveledUp === 'true';
  const freezeUsed = params.freezeUsed === 'true';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.bigEmoji}>🎉</Text>
      <Text style={[styles.xpText, { color: colors.text }]}>+{params.xp} XP</Text>

      {leveledUp && (
        <View style={styles.levelUpBadge}>
          <Text style={styles.levelUpText}>⬆️ Level up! You reached level {params.level}</Text>
        </View>
      )}

      <View style={[styles.streakCard, { backgroundColor: colors.backgroundElement }]}>
        <Text style={styles.streakEmoji}>🔥</Text>
        <Text style={[styles.streakText, { color: colors.text }]}>
          {params.streak}-day streak
        </Text>
        {freezeUsed && (
          <Text style={[styles.freezeText, { color: colors.textSecondary }]}>
            🧊 A streak freeze saved you!
          </Text>
        )}
      </View>

      <View style={[styles.breakdown, { backgroundColor: colors.backgroundElement }]}>
        <BreakdownRow label="Workout" value={`+${params.baseXp}`} />
        <BreakdownRow label="Sets" value={`+${params.setXp}`} />
        {prXp > 0 && <BreakdownRow label="Personal records 🏆" value={`+${params.prXp}`} />}
        {multiplier > 1 && (
          <BreakdownRow label="Streak bonus" value={`×${multiplier}`} />
        )}
        <View style={styles.divider} />
        <BreakdownRow
          label={`Progress to level ${parseInt(params.level ?? '1', 10) + 1}`}
          value={`${params.totalXp} / ${params.nextLevelXp} XP`}
        />
      </View>

      <Pressable style={styles.doneButton} onPress={() => router.back()}>
        <Text style={styles.doneText}>Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  bigEmoji: {
    fontSize: 64,
  },
  xpText: {
    fontSize: 48,
    fontWeight: '800',
  },
  levelUpBadge: {
    backgroundColor: '#30A46C',
    borderRadius: 12,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  levelUpText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  streakCard: {
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.one,
    alignSelf: 'stretch',
  },
  streakEmoji: {
    fontSize: 28,
  },
  streakText: {
    fontSize: 18,
    fontWeight: '700',
  },
  freezeText: {
    fontSize: 13,
  },
  breakdown: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 14,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#888888',
    opacity: 0.4,
  },
  doneButton: {
    backgroundColor: '#208AEF',
    borderRadius: 16,
    paddingVertical: Spacing.three,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  doneText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
