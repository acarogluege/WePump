import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { usePersonalRecords } from '@/hooks/use-workouts';
import { supabase } from '@/lib/supabase';

function StatCard({ label, value }: { label: string; value: string | number }) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  return (
    <View style={[styles.statCard, { backgroundColor: colors.backgroundElement }]}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const queryClient = useQueryClient();
  const { data: profile, isPending, error } = useProfile();
  const { data: personalRecords } = usePersonalRecords();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    queryClient.clear();
  }

  if (isPending) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Could not load profile.</Text>
        <Text style={{ color: colors.textSecondary }}>{error?.message}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.avatar}>💪</Text>
        <Text style={[styles.username, { color: colors.text }]}>
          @{profile.username}
        </Text>
        <Text style={[styles.level, { color: colors.textSecondary }]}>
          Level {profile.level}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Total XP" value={profile.total_xp} />
        <StatCard label="Streak" value={`${profile.current_streak}🔥`} />
        <StatCard label="Best streak" value={profile.longest_streak} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          🏆 Personal Records
        </Text>
        {!personalRecords || personalRecords.length === 0 ? (
          <Text style={{ color: colors.textSecondary }}>
            No PRs yet — go lift something heavy!
          </Text>
        ) : (
          personalRecords.slice(0, 10).map((pr) => (
            <View
              key={pr.exercise_id}
              style={[styles.prRow, { backgroundColor: colors.backgroundElement }]}
            >
              <Text style={[styles.prName, { color: colors.text }]}>
                {pr.exercises.name}
              </Text>
              <Text style={[styles.prValue, { color: colors.textSecondary }]}>
                {Number(pr.best_weight_kg) > 0
                  ? `${Number(pr.best_weight_kg)} kg × ${pr.best_reps}`
                  : `${pr.best_reps} reps`}
              </Text>
            </View>
          ))
        )}
      </View>

      <Pressable
        style={[styles.signOutButton, isSigningOut && styles.buttonDisabled]}
        disabled={isSigningOut}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    gap: Spacing.five,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  avatar: {
    fontSize: 64,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  level: {
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: Spacing.three,
  },
  prName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  prValue: {
    fontSize: 14,
  },
  signOutButton: {
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: 'center',
    backgroundColor: '#E5484D',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  signOutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
