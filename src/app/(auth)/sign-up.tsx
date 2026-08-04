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

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export default function SignUpScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignUp() {
    setError(null);

    const trimmedUsername = username.trim();
    if (!USERNAME_REGEX.test(trimmedUsername)) {
      setError('Username must be 3-20 characters: letters, numbers, underscores.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);

    // Check username availability first for a friendly error.
    const { data: taken, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', trimmedUsername)
      .maybeSingle();

    if (checkError) {
      setIsSubmitting(false);
      setError(checkError.message);
      return;
    }
    if (taken) {
      setIsSubmitting(false);
      setError('That username is already taken.');
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username: trimmedUsername },
      },
    });

    setIsSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
    }
    // On success the AuthProvider session change redirects automatically.
  }

  const canSubmit =
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    !isSubmitting;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={[styles.title, { color: colors.text }]}>💪 WePump</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Join the competition
        </Text>

        <View style={styles.form}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, color: colors.text },
            ]}
            placeholder="Username"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
            value={username}
            onChangeText={setUsername}
          />
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
            placeholder="Password (min 8 characters)"
            placeholderTextColor={colors.textSecondary}
            autoComplete="new-password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            disabled={!canSubmit}
            onPress={handleSignUp}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </Pressable>
        </View>

        <Text style={[styles.footer, { color: colors.textSecondary }]}>
          Already have an account?{' '}
          <Link href="/sign-in" style={styles.link}>
            Sign in
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
