import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/navigation/types';
import { trpc } from '@/lib/trpc';
import { useTheme } from '@/theme/ThemeContext';
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

const StatusBadge = ({ status, styles }: { status?: string; styles: any }) => {
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

const InfoCard = ({ title, children, icon, styles, theme }: { title: string; children: React.ReactNode; icon: string; styles: any; theme: any }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.cardIcon}>
        <Feather name={icon as any} size={16} color={theme.primary} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <View style={styles.cardContent}>
      {children}
    </View>
  </View>
);

const DetailItem = ({ label, value, styles }: { label: string; value?: string | React.ReactNode; styles: any }) => (
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
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
          <Feather name="arrow-left" size={20} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.navButton} />
      </View>

      {query.isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : !booking ? (
        <View style={styles.centerBox}>
          <Feather name="alert-circle" size={40} color={theme.muted} />
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
            <StatusBadge status={booking.status} styles={styles} />
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
          <InfoCard title="Event Information" icon="calendar" styles={styles} theme={theme}>
            <DetailItem label="Event Name" value={booking.event?.name} styles={styles} />
            <DetailItem label="Date" value={formatDate(booking.event?.eventDate)} styles={styles} />
            <DetailItem label="Time" value={`${formatTime(booking.startAt)} - ${formatTime(booking.endAt)}`} styles={styles} />
            <DetailItem label="Location" value={booking.event?.location} styles={styles} />
          </InfoCard>

          {/* Participants */}
          <InfoCard title="Participants" icon="users" styles={styles} theme={theme}>
            <DetailItem label="Vendor" value={booking.vendorCompany?.name} styles={styles} />
            <DetailItem label="Customer" value={booking.customerUser?.email} styles={styles} />
            {booking.customerCompany && <DetailItem label="Company" value={booking.customerCompany.name} styles={styles} />}
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

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
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
    color: theme.text,
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
    color: theme.muted,
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginTop: 8,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.primary,
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
    backgroundColor: theme.surface,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingIdLabel: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  bookingIdValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
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
    backgroundColor: theme.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
  },
  serviceImage: {
    width: '100%',
    height: 180,
    backgroundColor: theme.surfaceHighlight,
  },
  serviceMeta: {
    padding: 20,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 6,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.primary,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
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
    backgroundColor: '#EFF8FF', // Could be theme derived if needed?
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
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
    color: theme.muted,
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    color: theme.text,
    fontWeight: '600',
    fontSize: 14,
    flex: 1.5,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
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
    color: theme.muted,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.primary,
  },
});

export default BookingDetailsScreen;
