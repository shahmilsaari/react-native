import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions,
  ImageBackground,
  Pressable,
  ActivityIndicator,
  Modal,
  StatusBar,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { formatCurrency } from '@/utils/formatCurrency';
import { trpc } from '@/lib/trpc';
import { RootStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeContext';
import FacilityItem, { FacilityType } from '@/components/FacilityItem';
import { getServiceImages } from '@/lib/serviceImages';
import { useAuthStore } from '@/store/authStore';
import { useEventStore, Event } from '@/store/eventStore';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceDetails'>;

const { width } = Dimensions.get('window');
const SLIDER_HEIGHT = width * 0.85;

type ServiceItem = {
  id: string;
  vendorCompanyId?: string;
  name?: string;
  serviceDetails?: string;
  images?: string[];
  price?: number;
  category?: string;
  vendorCompany?: string;
  coverageLocations?: Array<{
    name?: string;
    city?: string;
    state?: string;
    country?: string;
  }>;
};

type AvailabilityItem = {
  date: string;
  available: boolean;
  windows?: { startAt: string; endAt: string }[];
};

// Mock data for new fields
const FACILITIES: Array<{ type: FacilityType; label: string }> = [
  { type: 'bathtub', label: 'Bathtub' },
  { type: 'wifi', label: 'Wifi' },
  { type: 'buffet', label: 'Buffet' },
  { type: 'pool', label: 'Pool' },
];

const pad2 = (value: number) => String(value).padStart(2, '0');

const toYmdLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
};

const fromYmdLocal = (ymd: string) => {
  const parsed = new Date(`${ymd}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const addMonths = (date: Date, delta: number) => new Date(date.getFullYear(), date.getMonth() + delta, 1);

const monthLabel = (date: Date) => date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

const sameYmd = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const getTimeZoneOffsetMinutes = (utcMs: number, timeZone: string) => {
  const date = new Date(utcMs);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  const zonedAsUtc = Date.UTC(
    Number(get('year')),
    Number(get('month')) - 1,
    Number(get('day')),
    Number(get('hour')),
    Number(get('minute')),
    Number(get('second'))
  );

  return (zonedAsUtc - utcMs) / 60000;
};

const zonedWallTimeToUtcIso = (ymd: string, hm: string, timeZone: string) => {
  const [yearStr, monthStr, dayStr] = ymd.split('-');
  const [hourStr, minuteStr] = hm.split(':');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  if (![year, month, day, hour, minute].every(Number.isFinite)) {
    return new Date(`${ymd}T${hm}:00.000Z`).toISOString();
  }

  let guessUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 3; i++) {
    const offsetMinutes = getTimeZoneOffsetMinutes(guessUtcMs, timeZone);
    const adjustedUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0) - offsetMinutes * 60000;
    if (Math.abs(adjustedUtcMs - guessUtcMs) < 1000) {
      guessUtcMs = adjustedUtcMs;
      break;
    }
    guessUtcMs = adjustedUtcMs;
  }

  return new Date(guessUtcMs).toISOString();
};

const addMinutesIso = (iso: string, minutes: number) => new Date(new Date(iso).getTime() + minutes * 60000).toISOString();

const timeSlots: Array<{ id: string; label: string; startHm: string; durationMinutes: number }> = [
  { id: 'morning', label: '10:00–11:30', startHm: '10:00', durationMinutes: 90 },
  { id: 'noon', label: '12:00–13:30', startHm: '12:00', durationMinutes: 90 },
  { id: 'afternoon', label: '14:00–15:30', startHm: '14:00', durationMinutes: 90 },
  { id: 'evening', label: '16:00–17:30', startHm: '16:00', durationMinutes: 90 }
];

const ServiceDetailsScreen = ({ route, navigation }: Props) => {
  const serviceId = route.params.serviceId;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const query = trpc.services.getServices.useQuery(undefined, { retry: 1 });
  const user = useAuthStore((state) => state.user);
  const availability = trpc.services.availabilityCalendar.useMutation();
  const createEvent = trpc.events.create.useMutation();
  const createBooking = trpc.bookings.create.useMutation();
  const trpcUtils = typeof trpc.useUtils === 'function' ? trpc.useUtils() : undefined;

  // Event Store
  const { selectedEvent, setSelectedEvent } = useEventStore();

  // Event Selection Modal State
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventTab, setEventTab] = useState<'select' | 'create'>('select');
  const myEvents = trpc.events.my.useQuery(undefined, { enabled: eventModalOpen && eventTab === 'select' });

  const eventItems = useMemo(() => {
    const raw = myEvents.data as any;
    const list =
      (Array.isArray(raw) && raw) ||
      (Array.isArray(raw?.data) && raw.data) ||
      (Array.isArray(raw?.data?.data) && raw.data.data) ||
      (Array.isArray(raw?.items) && raw.items) ||
      (Array.isArray(raw?.data?.items) && raw.data.items) ||
      [];
    return list as any[];
  }, [myEvents.data]);

  const toSelectableEvent = (item: any): Event | null => {
    const id = item?.id ?? item?._id ?? item?.eventId ?? item?.event_id;
    if (!id) return null;
    return {
      id: String(id),
      name: String(item?.name ?? item?.eventName ?? 'Untitled event'),
      eventDate: String(item?.eventDate ?? item?.event_date ?? item?.date ?? new Date().toISOString()),
      location: item?.location ? String(item.location) : undefined,
      isActive: item?.isActive == null ? true : Boolean(item.isActive),
    };
  };

  useEffect(() => {
    if (!eventModalOpen || eventTab !== 'select') return;
    myEvents.refetch?.();
  }, [eventModalOpen, eventTab]);

  // New Event Form State
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0]; // Local YYYY-MM-DD
  });
  const [newEventLocation, setNewEventLocation] = useState('Kuala Lumpur'); // Default to KL as per request

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingEventName, setBookingEventName] = useState(''); // Just for display if needed, but we use selectedEvent
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [selectedSlotId, setSelectedSlotId] = useState<string>(timeSlots[0]?.id ?? 'morning');
  // const [calendarMonth, setCalendarMonth] = useState<Date>(() => startOfMonth(new Date())); // No longer needed
  const timeZone = useMemo(() => process.env.EXPO_PUBLIC_TIME_ZONE ?? 'Asia/Kuala_Lumpur', []);

  const [activeSlide, setActiveSlide] = useState(0);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems?.length && viewableItems[0].index != null) {
      setActiveSlide(viewableItems[0].index);
    }
  }).current;

  // Mock description expansion
  const [readMore, setReadMore] = useState(false);

  const service = useMemo(() => {
    const raw = query.data as any;
    const list = Array.isArray(raw) ? raw : raw?.data;
    if (!Array.isArray(list)) return undefined;
    return list.find((item: any) => item?.id === serviceId) as ServiceItem | undefined;
  }, [query.data, serviceId]);

  const gallery = useMemo(() => {
    const images = service ? getServiceImages(service) : [];
    return images.length
      ? images
      : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'];
  }, [service]);

  // When selectedEvent changes, set selectedDate
  useEffect(() => {
    if (selectedEvent && selectedEvent.eventDate) {
      const d = new Date(selectedEvent.eventDate);
      if (!Number.isNaN(d.getTime())) {
        const ymd = toYmdLocal(d);
        setSelectedDate(ymd);
      }
    }
  }, [selectedEvent]);

  const activeRange = useMemo(() => {
    const now = new Date();
    // Start from today
    const from = toYmdLocal(now);
    // End 30 days from now
    const toDate = new Date(now);
    toDate.setDate(now.getDate() + 30);
    const to = toYmdLocal(toDate);
    return { fromDate: from, toDate: to };
  }, []);

  const availabilityDays = useMemo(() => {
    const raw = availability.data as any;
    const list = Array.isArray(raw) ? raw : raw?.data;
    return (Array.isArray(list) ? list : []) as AvailabilityItem[];
  }, [availability.data]);

  const availabilityByDate = useMemo(() => {
    const map = new Map<string, typeof availabilityDays[0]>();
    availabilityDays.forEach((item) => map.set(item.date, item));
    return map;
  }, [availabilityDays]);

  useEffect(() => {
    if (!bookingModalOpen) return;
    if (!service?.id) return;
    availability.mutate({ serviceId: service.id, ...activeRange, timeZone } as any);
  }, [activeRange.fromDate, activeRange.toDate, bookingModalOpen, service?.id, timeZone]);

  const minDate = useMemo(() => startOfMonth(addMonths(new Date(), -24)), []);
  const maxDate = useMemo(() => endOfMonth(addMonths(new Date(), 24)), []);

  const handleBookPress = () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to book.');
      return;
    }
    if (!selectedEvent) {
      // Open Event Selection first
      setEventModalOpen(true);
    } else {
      // Proceed to Booking
      setBookingModalOpen(true);
    }
  };

  const submitCreateEvent = async () => {
    if (!newEventName.trim()) {
      Alert.alert('Required', 'Please enter an event name.');
      return;
    }
    try {
      const res = await createEvent.mutateAsync({
        name: newEventName,
        eventDate: newEventDate + 'T00:00:00.000Z', // simplified
        location: newEventLocation,
        isActive: true
      } as any);

      const created = res?.data ?? res; // handle trpc response wrapper if any
      if (created) {
        await trpcUtils?.events?.my?.invalidate?.();
        const evt: Event = {
          id: created.id,
          name: created.name,
          eventDate: created.eventDate,
          location: created.location,
          isActive: created.isActive
        };
        setSelectedEvent(evt);
        setEventModalOpen(false);
        setBookingModalOpen(true); // Auto proceed
        // Use this new date
        const d = new Date(evt.eventDate);
        setSelectedDate(toYmdLocal(d));
        setSelectedDate(toYmdLocal(d));
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to create event');
    }
  };

  const submitBooking = async () => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in before creating a booking.');
      return;
    }
    if (!service?.id) {
      Alert.alert('Missing service', 'Please try again.');
      return;
    }
    if (!service.vendorCompanyId) {
      Alert.alert('Missing vendor', 'This service is missing vendorCompanyId.');
      return;
    }
    if (!selectedEvent) {
      Alert.alert('No Event', 'Please select an event first.');
      return;
    }
    if (!selectedDate) {
      Alert.alert('Select a date', 'Please pick an available date.');
      return;
    }
    // We allow booking even if "availability" check fails locally if user persists? 
    // Or strictly block. Let's block if loaded and false.
    if (availabilityByDate.has(selectedDate) && !availabilityByDate.get(selectedDate)) {
      Alert.alert('Unavailable', 'This date is not available.');
      return;
    }

    // Dynamic Slot Logic
    const availability = availabilityByDate.get(selectedDate);
    const window = availability?.windows?.find((w) => w.startAt === selectedSlotId);

    if (!window) {
      Alert.alert('Select time', 'Please select a valid time slot.');
      return;
    }

    const startAt = window.startAt;
    const endAt = window.endAt;

    try {
      // Create Booking directly linked to existing event
      const createdBooking = await (createBooking as any).mutateAsync({
        serviceId: service.id,
        eventId: selectedEvent.id,
        vendorCompanyId: service.vendorCompanyId,
        customerUserId: user.id,
        status: 'confirmed',
        kind: 'time_slot',
        startAt,
        endAt,
        timeZone
      });

      const bookingId =
        createdBooking?.id ?? createdBooking?.data?.id ?? createdBooking?.result?.data?.id ?? createdBooking?.booking?.id;

      await trpcUtils?.bookings?.my?.invalidate?.();

      setBookingModalOpen(false);
      if (bookingId) {
        navigation.navigate('BookingDetails', { bookingId });
      } else {
        navigation.navigate('Bookings');
      }
    } catch (error: any) {
      Alert.alert('Booking failed', error?.message ?? 'Please try again.');
    }
  };

  const locationLabel = useMemo(() => {
    const loc = service?.coverageLocations?.[0];
    if (!loc) return 'New York, USA';
    return [loc.city, loc.state ?? loc.country].filter(Boolean).join(', ');
  }, [service]);

  if (query.isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={styles.container}>
        <Pressable onPress={() => navigation.goBack()} style={{ padding: 20 }}>
          <Text>Back</Text>
        </Pressable>
        <View style={styles.center}>
          <Text>Service not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Image Slider */}
        <View style={styles.sliderContainer}>
          <FlatList
            data={gallery}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => String(index)}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            renderItem={({ item }) => (
              <ImageBackground
                source={{ uri: item }}
                style={styles.slide}
                resizeMode="cover"
              />
            )}
          />

          {/* Header Actions Overlay */}
          <View style={[styles.headerOverlay, { paddingTop: insets.top + 10 }]}>
            <Pressable style={styles.circleButton} onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={20} color="black" />
            </Pressable>
            <View style={styles.headerRight}>
              <Pressable style={styles.circleButton}>
                <FontAwesome name="heart" size={18} color={theme.muted} />
              </Pressable>
            </View>
          </View>

          {/* Dots */}
          <View style={styles.dotsContainer}>
            {gallery.map((_: string, i: number) => (
              <View key={i} style={[styles.dot, i === activeSlide ? styles.dotActive : styles.dotInactive]} />
            ))}
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.contentBody}>
          {selectedEvent && (
            <View style={styles.contextPill}>
              <Text style={styles.contextLabel}>Planning for:</Text>
              <View style={styles.contextValueRow}>
                <FontAwesome5 name="glass-cheers" size={12} color={theme.primary} />
                <Text style={styles.contextValue}>{selectedEvent.name}</Text>
              </View>
              <Pressable onPress={() => setEventModalOpen(true)}>
                <Text style={styles.contextEdit}>Change</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.title}>{service.name ?? 'Luxury Hotel'}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={theme.muted} />
            <Text style={styles.locationText}>{locationLabel}</Text>
            <View style={styles.ratingContainer}>
              <FontAwesome name="star" size={12} color="#FACC15" />
              <Text style={styles.ratingValue}>4.9</Text>
              <Text style={styles.reviewCount}>(12) Reviews</Text>
            </View>
          </View>

          {/* Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Ionicons name="people-outline" size={18} color={theme.muted} />
              <Text style={styles.metricText}>4 Guests</Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="bed-outline" size={18} color={theme.muted} />
              <Text style={styles.metricText}>2 Beds</Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="water-outline" size={18} color={theme.muted} />
              <Text style={styles.metricText}>2 Baths</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText} numberOfLines={readMore ? undefined : 2}>
              {service.serviceDetails ?? 'Experience luxury...'}
              {!readMore && <Text onPress={() => setReadMore(true)} style={styles.readMore}> Read More</Text>}
            </Text>
          </View>

          {/* Facilities */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Facilities</Text>
              <Pressable>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            <View style={styles.facilitiesGrid}>
              {FACILITIES.map(fac => (
                <FacilityItem key={fac.type} type={fac.type} label={fac.label} />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <View>
          <Text style={styles.price}>{formatCurrency(service.price)}</Text>
          <Text style={styles.perNight}>Per Night</Text>
        </View>
        <Pressable
          style={styles.bookButton}
          onPress={handleBookPress}
        >
          <Text style={styles.bookButtonText}>{selectedEvent ? 'Book Now' : 'Select Event'}</Text>
        </Pressable>
      </View>

      {/* 1. Event Selection Modal */}
      <Modal visible={eventModalOpen} transparent animationType="slide" onRequestClose={() => setEventModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEventModalOpen(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Event</Text>
            <Pressable style={styles.modalClose} onPress={() => setEventModalOpen(false)}>
              <Feather name="x" size={18} color={theme.primary} />
            </Pressable>
          </View>

          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tab, eventTab === 'select' && styles.tabActive]}
              onPress={() => setEventTab('select')}
            >
              <Text style={[styles.tabText, eventTab === 'select' && styles.tabTextActive]}>My Events</Text>
            </Pressable>
            <Pressable
              style={[styles.tab, eventTab === 'create' && styles.tabActive]}
              onPress={() => setEventTab('create')}
            >
              <Text style={[styles.tabText, eventTab === 'create' && styles.tabTextActive]}>Create New</Text>
            </Pressable>
          </View>

          {eventTab === 'select' ? (
            <View style={styles.eventListContainer}>
              {myEvents.isLoading ? (
                <ActivityIndicator color={theme.primary} />
              ) : myEvents.isError ? (
                <Text style={styles.emptyText}>Failed to load events.</Text>
              ) : (
                <FlatList
                  data={eventItems}
                  keyExtractor={(item, index) => String(item?.id ?? item?._id ?? item?.eventId ?? item?.event_id ?? index)}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.eventItem}
                      onPress={() => {
                        const evt = toSelectableEvent(item);
                        if (!evt) {
                          Alert.alert('Invalid event', 'This event is missing an id and cannot be selected.');
                          return;
                        }
                        setSelectedEvent(evt);
                        setEventModalOpen(false);
                        setBookingModalOpen(true); // Auto proceed
                      }}
                    >
                      <View style={styles.eventIcon}>
                        <FontAwesome5 name="glass-cheers" size={14} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.eventName}>{item?.name ?? item?.eventName ?? 'Untitled event'}</Text>
                        <Text style={styles.eventDate}>
                          {new Date(item?.eventDate ?? item?.event_date ?? item?.date ?? Date.now()).toLocaleDateString()} · {item?.location ?? ''}
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={18} color={theme.muted} />
                    </Pressable>
                  )}
                  ListEmptyComponent={<Text style={styles.emptyText}>No events found.</Text>}
                />
              )}
            </View>
          ) : (
            <View style={styles.createForm}>
              <Text style={styles.label}>Event Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Birthday Party"
                placeholderTextColor={theme.muted}
                value={newEventName}
                onChangeText={setNewEventName}
              />
              <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.muted}
                value={newEventDate}
                onChangeText={setNewEventDate}
              />
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={newEventLocation}
                placeholder="e.g. Kuala Lumpur"
                placeholderTextColor={theme.muted}
                onChangeText={setNewEventLocation}
              />
              <Pressable style={styles.createBtn} onPress={submitCreateEvent}>
                {createEvent.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.createBtnText}>Create & Select</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </Modal>

      {/* 2. Booking Modal */}
      <Modal visible={bookingModalOpen} transparent animationType="slide" onRequestClose={() => setBookingModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setBookingModalOpen(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Confirm Booking</Text>
            <Pressable style={styles.modalClose} onPress={() => setBookingModalOpen(false)}>
              <Feather name="x" size={18} color={theme.primary} />
            </Pressable>
          </View>

          <Text style={styles.modalSubtitle}>
            Booking for <Text style={{ fontWeight: '900', color: theme.primary }}>{selectedEvent?.name}</Text>
          </Text>

          <View style={{ marginBottom: 20 }}>
            {/* Horizontal list of next 30 days starting from Today */}
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingHorizontal: 4 }}
              data={(() => {
                const now = new Date();
                return Array.from({ length: 30 }).map((_, i) => {
                  const d = new Date(now);
                  d.setDate(now.getDate() + i);
                  return d;
                });
              })()}
              keyExtractor={(item) => item.toISOString()}
              renderItem={({ item }) => {
                const ymd = toYmdLocal(item);
                const isSelected = selectedDate === ymd;
                const isAvailable = availabilityByDate.get(ymd); // keeping this for data check
                const dayName = item.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = item.getDate();

                // Calculate today local YYYY-MM-DD
                const now = new Date();
                const offset = now.getTimezoneOffset() * 60000;
                const todayYmd = new Date(now.getTime() - offset).toISOString().split('T')[0];

                const isPast = ymd < todayYmd;

                return (
                  <Pressable
                    style={[
                      styles.dayStripItem,
                      isSelected && styles.dayStripItemSelected,
                      isPast && { opacity: 0.3, backgroundColor: theme.surfaceHighlight }
                    ]}
                    onPress={() => !isPast && setSelectedDate(ymd)}
                    disabled={isPast}
                  >
                    <Text style={[styles.dayStripName, isSelected && styles.dayStripNameSelected, isPast && { color: theme.muted }]}>{dayName}</Text>
                    <View style={[styles.dayStripNumberContainer, isSelected && styles.dayStripNumberContainerSelected, isPast && { backgroundColor: 'transparent' }]}>
                      <Text style={[styles.dayStripNumber, isSelected && styles.dayStripNumberSelected, isPast && { color: theme.muted }]}>{dayNum}</Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          </View>

          <View style={styles.modalField}>
            <Text style={styles.modalLabel}>Time slot</Text>
            <View style={styles.slotRow}>
              <View style={styles.slotRow}>
                {(() => {
                  const availability = selectedDate ? availabilityByDate.get(selectedDate) : undefined;
                  const windows = availability?.windows || [];

                  if (!selectedDate) return <Text style={{ color: theme.muted }}>Select a date first</Text>;
                  if (windows.length === 0) return <Text style={{ color: theme.muted }}>No slots available</Text>;

                  return windows.map((win, index) => {
                    const label = `${new Date(win.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(win.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
                    const id = win.startAt;
                    const isSelected = selectedSlotId === id;

                    return (
                      <Pressable
                        key={index}
                        style={[styles.slotChip, isSelected && styles.slotChipActive]}
                        onPress={() => setSelectedSlotId(id)}
                      >
                        <Text style={[styles.slotChipText, isSelected && styles.slotChipTextActive]}>{label}</Text>
                      </Pressable>
                    );
                  });
                })()}
              </View>
            </View>
          </View>

          <Pressable
            style={[styles.confirmButton, createBooking.isPending && styles.confirmButtonDisabled]}
            onPress={submitBooking}
            disabled={createBooking.isPending}
          >
            <Text style={styles.confirmButtonText}>
              {createBooking.isPending ? 'Booking...' : 'Confirm Booking'}
            </Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
};

// Styles
const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderContainer: {
    height: SLIDER_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  slide: {
    width: width,
    height: SLIDER_HEIGHT,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 44,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 32,
    backgroundColor: theme.background,
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  contentBody: {
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    backgroundColor: theme.background,
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF8FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1E9FF',
    gap: 8,
  },
  contextLabel: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  contextValueRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contextValue: {
    fontWeight: '700',
    color: theme.primary,
  },
  contextEdit: {
    color: theme.secondary,
    fontWeight: '700',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  locationText: {
    color: theme.muted,
    fontSize: 14,
    marginRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    fontWeight: '700',
    color: theme.text,
  },
  reviewCount: {
    color: theme.muted,
    fontSize: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    color: theme.muted,
    fontSize: 13,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
  },
  descriptionText: {
    color: theme.muted,
    lineHeight: 22,
    fontSize: 14,
  },
  readMore: {
    color: theme.primary,
    fontWeight: '600',
  },
  seeAll: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  facilitiesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
  },
  perNight: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  bookButton: {
    backgroundColor: theme.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 999,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(16,24,40,0.35)',
  },
  modalSheet: {
    backgroundColor: theme.surface, // Solid/Glass surface instead of transparent background
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 28,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.primary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.muted,
    marginBottom: 10,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.primary,
  },
  tabText: {
    fontWeight: '600',
    color: theme.muted,
  },
  tabTextActive: {
    color: theme.primary,
    fontWeight: '700',
  },
  eventListContainer: {
    height: 300,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventName: {
    fontWeight: '700',
    color: theme.text,
  },
  eventDate: {
    fontSize: 12,
    color: theme.muted,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: theme.muted,
  },
  createForm: {
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.text,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  createBtn: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  modalField: {
    gap: 8,
    marginTop: 10,
  },
  modalLabel: {
    color: theme.muted,
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 12,
    paddingBottom: 10,
  },
  monthNav: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    textAlign: 'center',
    fontWeight: '900',
    color: theme.primary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: theme.surfaceHighlight || '#333', // Theme aware instead of hardcoded light
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  dayNumber: {
    fontWeight: '900',
    color: theme.primary,
  },
  dayNumberDisabled: {
    color: '#E0E0E0',
  },
  // New Horizontal Date Strip Styles
  dayStripItem: {
    width: 50,
    height: 80,
    borderRadius: 25,
    backgroundColor: theme.surfaceHighlight, // Unselected background (Charcoal/Gray)
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayStripItemSelected: {
    backgroundColor: theme.primary, // Selected background (Gold)
    borderColor: theme.primary,
  },
  dayStripName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.muted,
  },
  dayStripNameSelected: {
    color: '#000', // Contrast against gold
    fontWeight: '700',
  },
  dayStripNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dayStripNumberContainerSelected: {
    backgroundColor: '#fff', // White circle behind number for extra pop
  },
  dayStripNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  dayStripNumberSelected: {
    color: '#000', // Black number inside white circle inside gold pill
  },
  dayDotOn: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.success,
    marginTop: 4,
  },
  slotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotChip: {
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: theme.surfaceHighlight, // Dark Gray
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  slotChipActive: {
    backgroundColor: theme.primary, // Gold
    borderColor: theme.primary,
  },
  slotChipText: {
    color: theme.muted,
    fontWeight: '600',
    fontSize: 14,
  },
  slotChipTextActive: {
    color: '#000', // Black text on Gold
    fontWeight: '700',
  },
  confirmButton: {
    marginTop: 14,
    backgroundColor: theme.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.55,
  },
  confirmButtonText: {
    color: theme.textInverted || '#fff',
    fontWeight: '900',
    fontSize: 14,
  },
});

export default ServiceDetailsScreen;
