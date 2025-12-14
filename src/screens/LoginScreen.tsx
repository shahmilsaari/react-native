import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/authStore';
import type { AuthLoginOutput } from '@/types/trpc';
import palette from '@/theme/colors';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const error = useAuthStore((state) => state.error);
  const setError = useAuthStore((state) => state.setError);
  const setSession = useAuthStore((state) => state.setSession);

  const mutation = trpc.auth.login.useMutation({
    onMutate: () => {
      setError(undefined);
    },
    onSuccess: (data: unknown) => {
      const payload = data as Partial<AuthLoginOutput> | null | undefined;
      if (!payload?.accessToken || !payload?.refreshToken || !payload?.user?.id || !payload?.user?.email) {
        setError('Login response was invalid.');
        return;
      }

      setSession(payload as AuthLoginOutput);
    },
    onError: (error: any) => {
      setError(error?.message ?? 'Unable to sign in. Please try again.');
    }
  });

  const loading = mutation.isPending;
  const isSubmitDisabled = useMemo(() => loading || !email.trim() || !password, [email, loading, password]);

  const handleSubmit = () => {
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    mutation.mutate({ email: email.trim(), password });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container}>
            <View style={styles.hero}>
              <View style={styles.heroGlowTopLeft} />
              <View style={styles.heroGlowBottomRight} />

              <View style={styles.brandRow}>
                <View style={styles.brandMark}>
                  <Feather name="map-pin" size={18} color={palette.primary} />
                </View>
                <Text style={styles.brandName}>Venso</Text>
              </View>

              <Text style={styles.headline}>Find your next stay</Text>
              <Text style={styles.tagline}>Curated villas, lofts, and experiences—book in minutes.</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Welcome back</Text>
              <Text style={styles.cardSubtitle}>Sign in to manage your bookings.</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputRow}>
                  <Feather name="mail" size={18} color={palette.muted} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="you@company.com"
                    placeholderTextColor={palette.muted}
                    onChangeText={setEmail}
                    returnKeyType="next"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputRow}>
                  <Feather name="lock" size={18} color={palette.muted} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    placeholder="••••••••"
                    placeholderTextColor={palette.muted}
                    secureTextEntry={!passwordVisible}
                    onChangeText={setPassword}
                    returnKeyType="done"
                  />
                  <Pressable
                    onPress={() => setPasswordVisible((value) => !value)}
                    hitSlop={10}
                    style={styles.iconButton}
                    accessibilityRole="button"
                    accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                  >
                    <Feather name={passwordVisible ? 'eye-off' : 'eye'} size={18} color={palette.muted} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.linksRow}>
                <Pressable onPress={() => setError('')}>
                  <Text style={styles.linkMuted}>Forgot password?</Text>
                </Pressable>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={16} color="#F04438" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                style={[styles.button, isSubmitDisabled && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitDisabled}
              >
                {loading ? (
                  <ActivityIndicator color={palette.surface} />
                ) : (
                  <Text style={styles.buttonText}>Sign in</Text>
                )}
              </Pressable>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>New here?</Text>
                <Pressable onPress={() => setError('')}>
                  <Text style={styles.footerLink}>Create an account</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.legal}>
              By continuing, you agree to our Terms and acknowledge our Privacy Policy.
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background
  },
  root: {
    flex: 1,
    backgroundColor: palette.background
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: palette.background
  },
  hero: {
    paddingTop: 18,
    paddingBottom: 22,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: 18
  },
  heroGlowTopLeft: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(216,248,79,0.35)'
  },
  heroGlowBottomRight: {
    position: 'absolute',
    bottom: -90,
    right: -90,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(25,72,255,0.10)'
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: palette.border
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.primary,
    letterSpacing: 0.2
  },
  headline: {
    marginTop: 14,
    fontSize: 26,
    fontWeight: '800',
    color: palette.primary
  },
  tagline: {
    marginTop: 8,
    color: palette.muted,
    lineHeight: 20
  },
  card: {
    marginTop: 16,
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: palette.border
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.primary
  },
  cardSubtitle: {
    color: palette.muted,
    marginTop: -6,
    marginBottom: 6
  },
  field: {
    gap: 8
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.muted
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#FBFBFF'
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: palette.text
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  linkMuted: {
    color: palette.muted,
    fontWeight: '600'
  },
  errorBox: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FEE4E2',
    padding: 12,
    borderRadius: 12
  },
  errorText: {
    flex: 1,
    color: '#B42318',
    fontSize: 13,
    lineHeight: 18
  },
  button: {
    marginTop: 16,
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  buttonDisabled: {
    opacity: 0.55
  },
  buttonText: {
    color: palette.surface,
    fontSize: 16,
    fontWeight: '800'
  },
  footerRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6
  },
  footerText: {
    color: palette.muted,
    fontWeight: '600'
  },
  footerLink: {
    color: palette.secondary,
    fontWeight: '800'
  },
  legal: {
    marginTop: 14,
    textAlign: 'center',
    color: palette.muted,
    fontSize: 12,
    lineHeight: 18
  }
});

export default LoginScreen;
