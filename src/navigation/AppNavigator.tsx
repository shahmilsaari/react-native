import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useAuthStore } from '@/store/authStore';
import LoginScreen from '@/screens/LoginScreen';
import PackageDetailsScreen from '@/screens/PackageDetailsScreen';
import PackagesScreen from '@/screens/PackagesScreen';
import palette from '@/theme/colors';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.background,
    text: palette.text,
    primary: palette.secondary
  }
};

const AppNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Packages" component={PackagesScreen} options={{ title: 'Venso Packages' }} />
            <Stack.Screen
              name="PackageDetails"
              component={PackageDetailsScreen}
              options={{ title: 'Package details', presentation: 'card' }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
