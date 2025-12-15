import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/navigation/types';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/authStore';
import palette from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ProfileScreen = ({ navigation }: Props) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const bookingsQuery = trpc.bookings.my.useQuery(undefined, { retry: 1 });

  const displayName =
    user?.firstName || user?.lastName ? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() : undefined;

  const bookingsCount = React.useMemo(() => {
    const raw = bookingsQuery.data as any;
    const list = Array.isArray(raw) ? raw : raw?.data;
    return Array.isArray(list) ? list.length : 0;
  }, [bookingsQuery.data]);

  const handleLogout = () => {
    logout();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={18} color={palette.primary} />
        </Pressable>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Feather name="user" size={20} color={palette.primary} />
        </View>
        <View style={styles.userBlock}>
          <Text style={styles.userName} numberOfLines={1}>
            {displayName ?? 'Logged in'}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {user?.email ?? '—'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <Pressable style={styles.row} onPress={() => {}}>
          <View style={styles.rowLeft}>
            <View style={styles.rowIcon}>
              <Feather name="calendar" size={18} color={palette.primary} />
            </View>
            <View>
              <Text style={styles.rowTitle}>My Planning</Text>
              <Text style={styles.rowSubtitle}>Saved ideas and upcoming trips</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color={palette.muted} />
        </Pressable>

        <Pressable style={styles.row} onPress={() => navigation.navigate('Bookings')}>
          <View style={styles.rowLeft}>
            <View style={styles.rowIcon}>
              <Feather name="briefcase" size={18} color={palette.primary} />
            </View>
            <View>
              <Text style={styles.rowTitle}>My Booking</Text>
              <Text style={styles.rowSubtitle}>Manage reservations and receipts</Text>
            </View>
          </View>
          <View style={styles.rowRight}>
            {bookingsQuery.isLoading ? (
              <View style={styles.badgeSkeleton} />
            ) : (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{bookingsCount}</Text>
              </View>
            )}
            <Feather name="chevron-right" size={18} color={palette.muted} />
          </View>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={palette.surface} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    paddingHorizontal: 20
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 16
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.primary
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 16
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  userBlock: {
    flex: 1,
    gap: 2
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.primary
  },
  userEmail: {
    color: palette.muted
  },
  section: {
    marginTop: 18,
    gap: 12
  },
  sectionTitle: {
    color: palette.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.6
  },
  row: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#FBFBFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rowTitle: {
    color: palette.primary,
    fontWeight: '800'
  },
  rowSubtitle: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 2
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: palette.border
  },
  badgeText: {
    color: palette.primary,
    fontWeight: '900',
    fontSize: 12
  },
  badgeSkeleton: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: palette.border
  },
  footer: {
    marginTop: 'auto',
    paddingVertical: 22
  },
  logoutButton: {
    backgroundColor: palette.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10
  },
  logoutText: {
    color: palette.surface,
    fontWeight: '800',
    fontSize: 16
  }
});

export default ProfileScreen;
