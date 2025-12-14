import { Platform } from 'react-native';

const DEFAULT_API_URL = 'http://localhost:3000';

const truthy = (value: string | undefined) =>
  value === '1' || value?.toLowerCase() === 'true';

const normalizeApiBaseUrl = (rawUrl: string) => {
  const trimmed = rawUrl.trim().replace(/\/$/, '');
  const withoutTrpc = trimmed.replace(/\/trpc$/, '');
  return withoutTrpc;
};

const rewriteLocalhostForAndroidEmulator = (input: string) => {
  if (Platform.OS !== 'android') {
    return input;
  }

  if (truthy(process.env.EXPO_PUBLIC_DISABLE_ANDROID_LOCALHOST_REWRITE)) {
    return input;
  }

  try {
    const parsedUrl = new URL(input);
    if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
      parsedUrl.hostname = '10.0.2.2';
    }
    return parsedUrl.toString().replace(/\/$/, '');
  } catch {
    return input;
  }
};

export const getApiBaseUrl = () => {
  const rawUrl = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;
  const normalized = normalizeApiBaseUrl(rawUrl);
  return rewriteLocalhostForAndroidEmulator(normalized);
};

export const getTrpcUrl = () => `${getApiBaseUrl()}/trpc`;
