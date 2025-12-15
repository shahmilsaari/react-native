import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/navigation/types';
import { trpc } from '@/lib/trpc';
import palette from '@/theme/colors';
import { formatCurrency } from '@/utils/formatCurrency';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingDetails'>;

type Booking = {
  id: string;
  bookingNo?: string;
  bookingDate?: string;
  status?: string;
  createdAt?: string;
  service?: { name?: string; price?: number; serviceDetails?: string; images?: string[] };
  event?: { name?: string; eventDate?: string; location?: string };
  vendorCompany?: { name?: string };
  customerUser?: { email?: string };
  customerCompany?: { name?: string } | null;
  startAt?: string;
  endAt?: string;
};

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (iso?: string) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const StatusBadge = ({ status }: { status?: string }) => {
  const normalized = status?.toLowerCase() ?? 'pending';
  let bg = '#FEF3F2';
  let color = '#B42318';
  let label = 'Pending';

  if (normalized === 'confirmed') {
    bg = '#ECFDF3';
    color = '#027A48';
    label = 'Confirmed';
  } else if (normalized === 'completed') {
    bg = '#EFF8FF';
    color = '#175CD3';
    label = 'Completed';
  } else if (normalized === 'cancelled') {
    bg = '#FEF3F2';
    color = '#B42318';
    label = 'Cancelled';
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
};

const InfoCard = ({ title, children, icon }: { title: string; children: React.ReactNode; icon: string }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.cardIcon}>
        <Feather name={icon as any} size={16} color={palette.primary} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <View style={styles.cardContent}>
      {children}
    </View>
  </View>
);

const DetailItem = ({ label, value }: { label: string; value?: string | React.ReactNode }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    {typeof value === 'string' ? (
      <Text style={styles.detailValue}>{value || '—'}</Text>
    ) : (
      value
    )}
  </View>
);

const BookingDetailsScreen = ({ navigation, route }: Props) => {
  const bookingId = route.params.bookingId;
  const query = trpc.bookings.my.useQuery(undefined, { retry: 1 });

  const booking = useMemo(() => {
    const raw = query.data as any;
    const list = Array.isArray(raw) ? raw : raw?.data;
    if (!Array.isArray(list)) return undefined;
    return list.find((item: any) => item?.id === bookingId) as Booking | undefined;
  }, [bookingId, query.data]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.navButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color={palette.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.navButton} />
      </View>

      {query.isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={palette.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : !booking ? (
        <View style={styles.centerBox}>
          <Feather name="alert-circle" size={40} color={palette.muted} />
          <Text style={styles.errorTitle}>Booking not found</Text>
          <Pressable style={styles.retryButton} onPress={() => query.refetch()}>
            <Text style={styles.retryText}>Refresh</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Top Status Section */}
          <View style={styles.statusCard}>
            <View>
              <Text style={styles.bookingIdLabel}>Booking ID</Text>
              <Text style={styles.bookingIdValue}>#{booking.bookingNo ?? booking.id.slice(0, 8)}</Text>
            </View>
            <StatusBadge status={booking.status} />
          </View>

          {/* Service Highlight */}
          <View style={styles.serviceHighlight}>
            <Image
              source={{ uri: booking.service?.images?.[0] ?? 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80' }}
              style={styles.serviceImage}
            />
            <View style={styles.serviceMeta}>
              <Text style={styles.serviceName}>{booking.service?.name}</Text>
              <Text style={styles.servicePrice}>{formatCurrency(booking.service?.price)}</Text>
            </View>
          </View>

          {/* Event Details */}
          <InfoCard title="Event Information" icon="calendar">
            <DetailItem label="Event Name" value={booking.event?.name} />
            <DetailItem label="Date" value={formatDate(booking.event?.eventDate)} />
            <DetailItem label="Time" value={`${formatTime(booking.startAt)} - ${formatTime(booking.endAt)}`} />
            <DetailItem label="Location" value={booking.event?.location} />
          </InfoCard>

          {/* Participants */}
          <InfoCard title="Participants" icon="users">
            <DetailItem label="Vendor" value={booking.vendorCompany?.name} />
            <DetailItem label="Customer" value={booking.customerUser?.email} />
            {booking.customerCompany && <DetailItem label="Company" value={booking.customerCompany.name} />}
          </InfoCard>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatCurrency(booking.service?.price)}</Text>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Light gray background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.text,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: palette.muted,
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.text,
    marginTop: 8,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: palette.primary,
    borderRadius: 12,
    marginTop: 10,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingIdLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  bookingIdValue: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.text,
    marginTop: 4,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  serviceHighlight: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
  },
  serviceImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  serviceMeta: {
    padding: 20,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.text,
    marginBottom: 6,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.primary,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.text,
  },
  cardContent: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    color: palette.muted,
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    color: palette.text,
    fontWeight: '600',
    fontSize: 14,
    flex: 1.5,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.muted,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: palette.primary,
  },
});

export default BookingDetailsScreen;
