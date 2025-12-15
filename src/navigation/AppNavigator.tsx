import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useAuthStore } from '@/store/authStore';
import LoginScreen from '@/screens/LoginScreen';
import BookingDetailsScreen from '@/screens/BookingDetailsScreen';
import BookingsScreen from '@/screens/BookingsScreen';
import PackageDetailsScreen from '@/screens/PackageDetailsScreen';
import PackagesScreen from '@/screens/PackagesScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import ServiceDetailsScreen from '@/screens/ServiceDetailsScreen';
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
            <Stack.Screen name="Packages" component={PackagesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Bookings" component={BookingsScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="PackageDetails"
              component={PackageDetailsScreen}
              options={{ title: 'Package details', presentation: 'card' }}
            />
            <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="BookingDetails"
              component={BookingDetailsScreen}
              options={{ headerShown: false, presentation: 'card' }}
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
