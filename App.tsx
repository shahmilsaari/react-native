import 'react-native-gesture-handler';

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import AppNavigator from '@/navigation/AppNavigator';
import { trpc, createTrpcClient } from '@/lib/trpc';
import { ThemeProvider } from '@/theme/ThemeContext';

const queryClient = new QueryClient();

export default function App() {
  const [trpcClient] = React.useState(() => createTrpcClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
              <StatusBar style="auto" />
              <AppNavigator />
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </trpc.Provider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
