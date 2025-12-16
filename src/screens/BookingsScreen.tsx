import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { trpc } from '@/lib/trpc';
import { useTheme } from '@/theme/ThemeContext';
import { useDebounce } from '../hooks/useDebounce';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Bookings'>;

type BookingListItem = {
  id: string;
  bookingNo?: string;
  bookingDate?: string;
  status?: string;
  service?: { name?: string; images?: string[] };
  event?: { name?: string; eventDate?: string; location?: string };
  vendorCompany?: { name?: string };
  customerUser?: { email?: string };
};

const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
};

const getStatusStyles = (status: string | undefined, theme: any) => {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'confirmed' || normalized === 'paid' || normalized === 'completed') {
    return { backgroundColor: '#ECFDF3', textColor: theme.success, borderColor: '#ABEFC6' };
  }
  if (normalized === 'pending' || normalized === 'processing') {
    return { backgroundColor: '#EFF8FF', textColor: theme.secondary, borderColor: '#B2DDFF' };
  }
  if (normalized === 'cancelled' || normalized === 'canceled') {
    return { backgroundColor: '#F2F4F7', textColor: theme.muted, borderColor: theme.border };
  }
  return { backgroundColor: theme.surface, textColor: theme.primary, borderColor: theme.border };
};

type StatusFilter = 'all' | 'confirmed' | 'pending' | 'cancelled';

const statusFilters: Array<{ label: string; value: StatusFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Cancelled', value: 'cancelled' }
];

const BookingsScreen = ({ navigation }: Props) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const query = trpc.bookings.my.useQuery(undefined, { retry: 1 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const bookings = useMemo(() => {
    const raw = query.data as any;
    const list = Array.isArray(raw) ? raw : raw?.data;
    return (Array.isArray(list) ? list : []) as BookingListItem[];
  }, [query.data]);

  const filteredBookings = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase();

    return bookings.filter((item) => {
      const normalizedStatus = (item.status ?? '').toLowerCase();
      const matchesStatus =
        statusFilter === 'all' ? true : normalizedStatus === statusFilter || (statusFilter === 'cancelled' && (normalizedStatus === 'canceled' || normalizedStatus === 'cancelled'));

      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;

      const haystack = [
        item.bookingNo,
        item.id,
        item.status,
        item.service?.name,
        item.event?.name,
        item.vendorCompany?.name,
        item.customerUser?.email
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [bookings, debouncedSearch, statusFilter]);

  const isRefreshing = query.isFetching && !query.isLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {query.isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={theme.secondary} />
          <Text style={styles.loadingText}>Loading bookings…</Text>
        </View>
      ) : query.isError ? (
        <View style={styles.errorState}>
          <Text style={styles.errorTitle}>Unable to load bookings.</Text>
          <Text style={styles.errorMessage} numberOfLines={3}>
            {(query.error as any)?.message ?? 'Please try again.'}
          </Text>
          <Pressable style={styles.retryButton} onPress={() => query.refetch()}>
            <Feather name="refresh-cw" size={16} color={theme.surface} />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => query.refetch()} tintColor={theme.primary} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                  <Feather name="arrow-left" size={18} color={theme.primary} />
                </Pressable>
                <View style={styles.headerTitleBlock}>
                  <Text style={styles.title}>Bookings</Text>
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {bookings.length} total · Pull to refresh
                  </Text>
                </View>
                <View style={styles.headerRight}>
                  <View style={styles.countPill}>
                    <Text style={styles.countPillText}>{filteredBookings.length}</Text>
                  </View>
                  <Pressable
                    style={styles.calendarButton}
                    onPress={() => navigation.navigate('MyCalendar')}
                    hitSlop={10}
                  >
                    <Feather name="calendar" size={20} color={theme.primary} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.searchField}>
                <Feather name="search" size={18} color={theme.muted} />
                <TextInput
                  placeholder="Search booking no, service, event…"
                  placeholderTextColor={theme.muted}
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
                {search.length ? (
                  <Pressable
                    onPress={() => {
                      setSearch('');
                    }}
                    hitSlop={10}
                  >
                    <Feather name="x-circle" size={18} color={theme.muted} />
                  </Pressable>
                ) : null}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                {statusFilters.map((filter) => {
                  const isActive = statusFilter === filter.value;
                  return (
                    <Pressable
                      key={filter.value}
                      style={[styles.filterPill, isActive && styles.filterPillActive]}
                      onPress={() => setStatusFilter(filter.value)}
                    >
                      <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>{filter.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          }
          renderItem={({ item }) => {
            const badge = getStatusStyles(item.status, theme);
            const title = item.service?.name ?? 'Service booking';
            const subtitle = item.event?.name ?? item.vendorCompany?.name ?? item.customerUser?.email ?? '—';
            const coverImage = item.service?.images?.[0];
            return (
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate('BookingDetails', { bookingId: item.id })}
              >
                <View style={styles.cardRow}>
                  <View style={styles.cover}>
                    {coverImage ? (
                      <Image source={{ uri: coverImage }} style={styles.coverImage} />
                    ) : (
                      <View style={styles.coverPlaceholder}>
                        <Feather name="briefcase" size={18} color={theme.primary} />
                      </View>
                    )}
                  </View>

                  <View style={styles.cardMain}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.cardTitleBlock}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {title}
                        </Text>
                        <Text style={styles.cardSubtitle} numberOfLines={1}>
                          {subtitle}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: badge.backgroundColor, borderColor: badge.borderColor }
                        ]}
                      >
                        <Text style={[styles.statusText, { color: badge.textColor }]} numberOfLines={1}>
                          {item.status ?? '—'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.metaRow}>
                      <View style={styles.metaChip}>
                        <Feather name="hash" size={13} color={theme.muted} />
                        <Text style={styles.metaChipText} numberOfLines={1}>
                          {item.bookingNo ?? item.id}
                        </Text>
                      </View>
                      <View style={styles.metaChip}>
                        <Feather name="calendar" size={13} color={theme.muted} />
                        <Text style={styles.metaChipText} numberOfLines={1}>
                          {formatDateTime(item.bookingDate)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.detailsHint}>View details</Text>
                      <Feather name="chevron-right" size={18} color={theme.muted} />
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Feather name="calendar" size={20} color={theme.primary} />
              </View>
              <Text style={styles.emptyTitle}>No bookings</Text>
              <Text style={styles.emptyText}>Try clearing search or switching status filters.</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    paddingHorizontal: 20
  },
  headerBlock: {
    paddingTop: 10,
    paddingBottom: 14,
    gap: 14
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitleBlock: {
    flex: 1,
    gap: 2
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.primary
  },
  subtitle: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: '700'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  countPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceHighlight,
    minWidth: 44,
    paddingHorizontal: 12,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center'
  },
  countPillText: {
    fontWeight: '900',
    color: theme.primary
  },
  calendarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    backgroundColor: theme.surfaceHighlight, // Better contrast in dark mode
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.border,
    height: 54
  },
  searchInput: {
    flex: 1,
    color: theme.text,
    fontSize: 15
  },
  filters: {
    gap: 10,
    paddingVertical: 2
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface
  },
  filterPillActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary
  },
  filterLabel: {
    color: theme.primary,
    fontWeight: '800',
    fontSize: 12
  },
  filterLabelActive: {
    color: theme.surface
  },
  listContent: {
    paddingBottom: 22,
    gap: 14
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    padding: 14
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12
  },
  cover: {
    width: 64,
    height: 84,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceHighlight
  },
  coverImage: {
    width: '100%',
    height: '100%'
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardMain: {
    flex: 1,
    gap: 12
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12
  },
  cardTitleBlock: {
    flex: 1,
    gap: 3
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.primary
  },
  cardSubtitle: {
    color: theme.muted
  },
  statusBadge: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    maxWidth: 140
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize'
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10
  },
  metaChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceHighlight,
    paddingVertical: 9,
    paddingHorizontal: 12
  },
  metaChipText: {
    color: theme.text,
    fontSize: 13,
    flex: 1
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  detailsHint: {
    color: theme.muted,
    fontWeight: '700'
  },
  emptyText: {
    color: theme.muted,
    lineHeight: 20,
    textAlign: 'center'
  },
  emptyState: {
    paddingTop: 40,
    alignItems: 'center',
    gap: 10
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyTitle: {
    fontWeight: '900',
    color: theme.primary,
    fontSize: 16
  },
  loadingState: {
    marginTop: 40,
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    color: theme.muted,
    fontWeight: '700'
  },
  errorState: {
    marginTop: 36,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 18,
    gap: 10
  },
  errorTitle: {
    fontWeight: '900',
    color: theme.primary,
    fontSize: 16
  },
  errorMessage: {
    color: theme.muted,
    lineHeight: 20
  },
  retryButton: {
    marginTop: 6,
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.primary
  },
  retryText: {
    color: theme.surface,
    fontWeight: '900'
  }
});

export default BookingsScreen;
