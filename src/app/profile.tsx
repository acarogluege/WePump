import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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

      <Pressable
        style={[styles.signOutButton, isSigningOut && styles.buttonDisabled]}
        disabled={isSigningOut}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginTop: Spacing.four,
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
  signOutButton: {
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: 'center',
    backgroundColor: '#E5484D',
    marginTop: 'auto',
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
