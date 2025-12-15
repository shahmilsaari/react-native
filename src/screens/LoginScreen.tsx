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
  Keyboard,
  ImageBackground,
  StatusBar
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
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

  // Friendly error logic kept same
  const getFriendlyErrorMessage = (rawError: any) => {
    const fallback = 'Unable to sign in. Please try again.';
    const message = rawError?.message;
    if (typeof message === 'string') {
      const trimmed = message.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          const issueMessage =
            parsed?.[0]?.message ??
            parsed?.issues?.[0]?.message ??
            parsed?.message ??
            parsed?.error?.message;
          if (typeof issueMessage === 'string' && issueMessage.trim()) {
            return issueMessage;
          }
        } catch { }
      }
      if (trimmed) return trimmed;
    }
    return fallback;
  };

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
      setError(getFriendlyErrorMessage(error));
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
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80' }} // Elegant event hall
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Dark Overlay */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.container}>

              {/* Branding Section */}
              <View style={styles.brandingSection}>
                <View style={styles.logoCircle}>
                  <FontAwesome5 name="wine-glass-alt" size={24} color={palette.primary} />
                </View>
                <Text style={styles.brandTitle}>VENSO</Text>
                <Text style={styles.tagline}>Unlock exclusive events & venues</Text>
              </View>

              {/* Login Form */}
              <View style={styles.formCard}>

                <View style={styles.field}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputContainer}>
                    <Feather name="mail" size={18} color={palette.muted} />
                    <TextInput
                      style={styles.input}
                      value={email}
                      placeholder="you@example.com"
                      placeholderTextColor={'rgba(0,0,0,0.4)'}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onChangeText={setEmail}
                      returnKeyType="next"
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Feather name="lock" size={18} color={palette.muted} />
                    <TextInput
                      style={styles.input}
                      value={password}
                      placeholder="••••••••"
                      placeholderTextColor={'rgba(0,0,0,0.4)'}
                      secureTextEntry={!passwordVisible}
                      onChangeText={setPassword}
                      returnKeyType="done"
                    />
                    <Pressable onPress={() => setPasswordVisible(!passwordVisible)} hitSlop={10}>
                      <Feather name={passwordVisible ? 'eye-off' : 'eye'} size={18} color={palette.muted} />
                    </Pressable>
                  </View>
                </View>

                <Pressable onPress={() => setError('')} style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </Pressable>

                {error ? (
                  <View style={styles.errorBox}>
                    <Feather name="alert-circle" size={14} color="#F04438" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <Pressable
                  style={[styles.button, isSubmitDisabled && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitDisabled}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Log In</Text>
                  )}
                </Pressable>

                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>New to Venso? </Text>
                  <Pressable onPress={() => setError('')}>
                    <Text style={styles.signUpText}>Sign Up</Text>
                  </Pressable>
                </View>

              </View>

            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)', // Darken background image
  },
  safeArea: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 40,
  },
  brandingSection: {
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
  },
  tagline: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.95)', // Nearly opaque white for readability
    borderRadius: 24,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.primary, // Teal label
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: palette.text,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3F2',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#B42318',
    fontSize: 12,
  },
  button: {
    backgroundColor: palette.primary,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: {
    color: palette.muted,
    fontSize: 14,
  },
  signUpText: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default LoginScreen;
