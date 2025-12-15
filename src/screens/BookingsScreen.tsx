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
import palette from '@/theme/colors';
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

const getStatusStyles = (status?: string) => {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'confirmed' || normalized === 'paid' || normalized === 'completed') {
    return { backgroundColor: '#ECFDF3', textColor: palette.success, borderColor: '#ABEFC6' };
  }
  if (normalized === 'pending' || normalized === 'processing') {
    return { backgroundColor: '#EFF8FF', textColor: palette.secondary, borderColor: '#B2DDFF' };
  }
  if (normalized === 'cancelled' || normalized === 'canceled') {
    return { backgroundColor: '#F2F4F7', textColor: palette.muted, borderColor: palette.border };
  }
  return { backgroundColor: palette.surface, textColor: palette.primary, borderColor: palette.border };
};

type StatusFilter = 'all' | 'confirmed' | 'pending' | 'cancelled';

const statusFilters: Array<{ label: string; value: StatusFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Cancelled', value: 'cancelled' }
];

const BookingsScreen = ({ navigation }: Props) => {
  const query = trpc.bookings.my.useQuery(undefined, { retry: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const bookings = useMemo(() => {
    const raw = query.data as any;
    const list = Array.isArray(raw) ? raw : raw?.data;
    return (Array.isArray(list) ? list : []) as BookingListItem[];
  }, [query.data]);

  const filteredBookings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

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
  }, [bookings, search, statusFilter]);

  const isRefreshing = query.isFetching && !query.isLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {query.isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={palette.secondary} />
          <Text style={styles.loadingText}>Loading bookings…</Text>
        </View>
      ) : query.isError ? (
        <View style={styles.errorState}>
          <Text style={styles.errorTitle}>Unable to load bookings.</Text>
          <Text style={styles.errorMessage} numberOfLines={3}>
            {(query.error as any)?.message ?? 'Please try again.'}
          </Text>
          <Pressable style={styles.retryButton} onPress={() => query.refetch()}>
            <Feather name="refresh-cw" size={16} color={palette.surface} />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => query.refetch()} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                  <Feather name="arrow-left" size={18} color={palette.primary} />
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
                </View>
              </View>

              <View style={styles.searchField}>
                <Feather name="search" size={18} color={palette.muted} />
                <TextInput
                  placeholder="Search booking no, service, event…"
                  placeholderTextColor={palette.muted}
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
                {search.length ? (
                  <Pressable onPress={() => setSearch('')} hitSlop={10}>
                    <Feather name="x-circle" size={18} color={palette.muted} />
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
            const badge = getStatusStyles(item.status);
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
                        <Feather name="briefcase" size={18} color={palette.primary} />
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
                        <Feather name="hash" size={13} color={palette.muted} />
                        <Text style={styles.metaChipText} numberOfLines={1}>
                          {item.bookingNo ?? item.id}
                        </Text>
                      </View>
                      <View style={styles.metaChip}>
                        <Feather name="calendar" size={13} color={palette.muted} />
                        <Text style={styles.metaChipText} numberOfLines={1}>
                          {formatDateTime(item.bookingDate)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.detailsHint}>View details</Text>
                      <Feather name="chevron-right" size={18} color={palette.muted} />
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Feather name="calendar" size={20} color={palette.primary} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
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
    borderColor: palette.border,
    backgroundColor: palette.surface,
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
    color: palette.primary
  },
  subtitle: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700'
  },
  headerRight: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  countPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#EEF2FF',
    minWidth: 44,
    paddingHorizontal: 12,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center'
  },
  countPillText: {
    fontWeight: '900',
    color: palette.primary
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    backgroundColor: palette.surface,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: palette.border,
    height: 54
  },
  searchInput: {
    flex: 1,
    color: palette.text,
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
    borderColor: palette.border,
    backgroundColor: palette.surface
  },
  filterPillActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary
  },
  filterLabel: {
    color: palette.primary,
    fontWeight: '800',
    fontSize: 12
  },
  filterLabelActive: {
    color: palette.surface
  },
  listContent: {
    paddingBottom: 22,
    gap: 14
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
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
    borderColor: palette.border,
    backgroundColor: '#FBFBFF'
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
    color: palette.primary
  },
  cardSubtitle: {
    color: palette.muted
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
    borderColor: palette.border,
    backgroundColor: '#FBFBFF',
    paddingVertical: 9,
    paddingHorizontal: 12
  },
  metaChipText: {
    color: palette.text,
    fontSize: 13,
    flex: 1
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  detailsHint: {
    color: palette.muted,
    fontWeight: '700'
  },
  emptyText: {
    color: palette.muted,
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
    borderColor: palette.border,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyTitle: {
    fontWeight: '900',
    color: palette.primary,
    fontSize: 16
  },
  loadingState: {
    marginTop: 40,
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    color: palette.muted,
    fontWeight: '700'
  },
  errorState: {
    marginTop: 36,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 18,
    gap: 10
  },
  errorTitle: {
    fontWeight: '900',
    color: palette.primary,
    fontSize: 16
  },
  errorMessage: {
    color: palette.muted,
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
    backgroundColor: palette.primary
  },
  retryText: {
    color: palette.surface,
    fontWeight: '900'
  }
});

export default BookingsScreen;
