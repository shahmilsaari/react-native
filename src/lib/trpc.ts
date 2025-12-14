import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AnyRouter } from '@trpc/server';

import { useAuthStore } from '@/store/authStore';
import { getTrpcUrl } from '@/config/api';

export const trpc = createTRPCReact<AnyRouter>() as any;

const truthy = (value: string | undefined) => value === '1' || value?.toLowerCase() === 'true';

const fetchWithTimeout: typeof fetch = async (input, init) => {
  const timeoutMs = Number(process.env.EXPO_PUBLIC_TRPC_TIMEOUT_MS ?? '15000');
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return fetch(input, init);
  }

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  const upstreamSignal = init?.signal;
  if (upstreamSignal) {
    if (upstreamSignal.aborted) {
      timeoutController.abort();
    } else {
      upstreamSignal.addEventListener('abort', () => timeoutController.abort(), { once: true });
    }
  }

  try {
    return await fetch(input, { ...init, signal: timeoutController.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

export const createTrpcClient = () => {
  const trpcUrl = getTrpcUrl();
  const shouldDebug = truthy(process.env.EXPO_PUBLIC_TRPC_DEBUG);

  if (shouldDebug) {
    console.log('[tRPC] url', trpcUrl);
  }

  return trpc.createClient({
    links: [
      httpBatchLink({
        url: trpcUrl,
        fetch: async (url, options) => {
          if (!shouldDebug) {
            return fetchWithTimeout(url, options);
          }

          console.log('[tRPC] request', options?.method ?? 'GET', url);
          const response = await fetchWithTimeout(url, options);
          const contentType = response.headers.get('content-type');
          const rawBody = await response.clone().text();
          console.log('[tRPC] response', response.status, contentType, rawBody);
          return response;
        },
        headers() {
          const token = useAuthStore.getState().accessToken;
          if (!token) {
            return {};
          }
          return {
            Authorization: `Bearer ${token}`
          };
        }
      })
    ]
  });
};
