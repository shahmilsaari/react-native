import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/ThemeContext';
import LoginScreen from '@/screens/LoginScreen';
import BookingDetailsScreen from '@/screens/BookingDetailsScreen';
import BookingsScreen from '@/screens/BookingsScreen';
import MyCalendarScreen from '@/screens/MyCalendarScreen';
import MyEventsListScreen from '@/screens/MyEventsListScreen';
import PackageDetailsScreen from '@/screens/PackageDetailsScreen';
import PackagesScreen from '@/screens/PackagesScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import ServiceDetailsScreen from '@/screens/ServiceDetailsScreen';
import { RootStackParamList } from './types';
const Stack = createNativeStackNavigator<RootStackParamList>();

import { LinearGradient } from 'expo-linear-gradient';

const AppNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { theme, isDark } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: 'transparent', // Transparent to show gradient
      text: theme.text,
      primary: theme.primary,
      card: theme.surface,
      border: theme.border,
    }
  };

  return (
    <LinearGradient
      colors={theme.gradients.background}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: isDark ? 'transparent' : theme.surface }, // Transparent header in dark mode
          headerTintColor: theme.text,
          contentStyle: { backgroundColor: 'transparent' }, // Transparent content
          animation: 'slide_from_right', // Smooth standardized transition
        }}>
          {isAuthenticated ? (
            <>
              <Stack.Screen name="Packages" component={PackagesScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Bookings" component={BookingsScreen} options={{ headerShown: false }} />
              <Stack.Screen name="MyCalendar" component={MyCalendarScreen} options={{ headerShown: false }} />
              <Stack.Screen name="MyEventsList" component={MyEventsListScreen} options={{ headerShown: false }} />
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
    </LinearGradient>
  );
};

export default AppNavigator;
