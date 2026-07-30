import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [status, setStatus] = useState('Checking Supabase connection…');

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(() => setStatus('✅ Connected to Supabase'))
      .catch((e: Error) => setStatus(`❌ Supabase error: ${e.message}`));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>💪 WePump</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Compete. Track. Grow.
      </Text>
      <Text style={[styles.status, { color: colors.textSecondary }]}>{status}</Text>
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
  status: {
    fontSize: 14,
    marginTop: Spacing.five,
  },
});
