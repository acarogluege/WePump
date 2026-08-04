import { Link } from 'expo-router';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { data: profile } = useProfile();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>💪 WePump</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {profile ? `Welcome back, @${profile.username}!` : 'Compete. Track. Grow.'}
      </Text>

      <Link href="/profile" style={styles.link}>
        View my profile →
      </Link>
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
  link: {
    marginTop: Spacing.four,
    color: '#208AEF',
    fontSize: 16,
    fontWeight: '600',
  },
});
