import 'react-native-gesture-handler';

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import AppNavigator from '@/navigation/AppNavigator';
import palette from '@/theme/colors';
import { trpc, createTrpcClient } from '@/lib/trpc';

const queryClient = new QueryClient();

export default function App() {
  const [trpcClient] = React.useState(() => createTrpcClient());

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.background }}>
          <SafeAreaProvider>
            <StatusBar style="dark" />
            <AppNavigator />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </trpc.Provider>
    </QueryClientProvider>
  );
}
