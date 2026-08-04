import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignIn() {
    setError(null);
    setIsSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setIsSubmitting(false);
    if (signInError) {
      setError(signInError.message);
    }
    // On success the AuthProvider session change redirects automatically.
  }

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={[styles.title, { color: colors.text }]}>💪 WePump</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Welcome back, champ
        </Text>

        <View style={styles.form}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, color: colors.text },
            ]}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, color: colors.text },
            ]}
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            autoComplete="password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            disabled={!canSubmit}
            onPress={handleSignIn}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </Pressable>
        </View>

        <Text style={[styles.footer, { color: colors.textSecondary }]}>
          New here?{' '}
          <Link href="/sign-up" style={styles.link}>
            Create an account
          </Link>
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.five,
  },
  form: {
    gap: Spacing.three,
  },
  input: {
    borderRadius: 12,
    padding: Spacing.three,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#208AEF',
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#E5484D',
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    marginTop: Spacing.four,
    fontSize: 14,
  },
  link: {
    color: '#208AEF',
    fontWeight: '600',
  },
});
