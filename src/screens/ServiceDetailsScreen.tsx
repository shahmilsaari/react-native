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
import { Feather, Ionicons, FontAwesome } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { formatCurrency } from '@/utils/formatCurrency';
import { trpc } from '@/lib/trpc';
import { RootStackParamList } from '@/navigation/types';
import palette from '@/theme/colors';
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

  // New Event Form State
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]); // simplified YYYY-MM-DD
  const [newEventLocation, setNewEventLocation] = useState('Kuala Lumpur'); // Default to KL as per request

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingEventName, setBookingEventName] = useState(''); // Just for display if needed, but we use selectedEvent
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [selectedSlotId, setSelectedSlotId] = useState<string>(timeSlots[0]?.id ?? 'morning');
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => startOfMonth(new Date()));
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

  // When selectedEvent changes, sync calendar
  useEffect(() => {
    if (selectedEvent && selectedEvent.eventDate) {
      // Parse the event date (assuming ISO)
      const d = new Date(selectedEvent.eventDate);
      if (!Number.isNaN(d.getTime())) {
        const ymd = toYmdLocal(d);
        setSelectedDate(ymd);
        setCalendarMonth(startOfMonth(d));
      }
    }
  }, [selectedEvent]);

  const activeRange = useMemo(() => {
    const from = toYmdLocal(startOfMonth(calendarMonth));
    const to = toYmdLocal(endOfMonth(calendarMonth));
    return { fromDate: from, toDate: to };
  }, [calendarMonth]);

  const availabilityDays = useMemo(() => {
    const raw = availability.data as any;
    const list = Array.isArray(raw) ? raw : raw?.data;
    return (Array.isArray(list) ? list : []) as AvailabilityItem[];
  }, [availability.data]);

  const availabilityByDate = useMemo(() => {
    const map = new Map<string, boolean>();
    availabilityDays.forEach((item) => map.set(item.date, Boolean(item.available)));
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
        setCalendarMonth(startOfMonth(d));
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

    const slot = timeSlots.find((s) => s.id === selectedSlotId) ?? timeSlots[0];
    if (!slot) {
      Alert.alert('Select time', 'Please select a time slot.');
      return;
    }

    const startAt = zonedWallTimeToUtcIso(selectedDate, slot.startHm, timeZone);
    const endAt = addMinutesIso(startAt, slot.durationMinutes);

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
        <ActivityIndicator size="small" color={palette.primary} />
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
                <FontAwesome name="heart" size={18} color={palette.muted} />
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
                <FontAwesome5 name="glass-cheers" size={12} color={palette.primary} />
                <Text style={styles.contextValue}>{selectedEvent.name}</Text>
              </View>
              <Pressable onPress={() => setEventModalOpen(true)}>
                <Text style={styles.contextEdit}>Change</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.title}>{service.name ?? 'Luxury Hotel'}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={palette.muted} />
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
              <Ionicons name="people-outline" size={18} color={palette.muted} />
              <Text style={styles.metricText}>4 Guests</Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="bed-outline" size={18} color={palette.muted} />
              <Text style={styles.metricText}>2 Beds</Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="water-outline" size={18} color={palette.muted} />
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
              <Feather name="x" size={18} color={palette.primary} />
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
                <ActivityIndicator color={palette.primary} />
              ) : (
                <FlatList
                  data={(myEvents.data as any)?.data ?? []}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.eventItem}
                      onPress={() => {
                        setSelectedEvent(item);
                        setEventModalOpen(false);
                        setBookingModalOpen(true); // Auto proceed
                      }}
                    >
                      <View style={styles.eventIcon}>
                        <FontAwesome5 name="glass-cheers" size={14} color={palette.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.eventName}>{item.name}</Text>
                        <Text style={styles.eventDate}>
                          {new Date(item.eventDate).toLocaleDateString()} · {item.location}
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={18} color={palette.muted} />
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
                value={newEventName}
                onChangeText={setNewEventName}
              />
              <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="2025-12-20"
                value={newEventDate}
                onChangeText={setNewEventDate}
              />
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={newEventLocation}
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
              <Feather name="x" size={18} color={palette.primary} />
            </Pressable>
          </View>

          <Text style={styles.modalSubtitle}>
            Booking for <Text style={{ fontWeight: '900', color: palette.primary }}>{selectedEvent?.name}</Text>
          </Text>

          <View style={styles.monthHeader}>
            <Pressable onClick={() => {/* Disable browsing if locked to event? User might want to browse. keeping enabled */
              const prev = addMonths(calendarMonth, -1);
              setCalendarMonth(prev);
            }} style={styles.monthNav}>
              <Feather name="chevron-left" size={18} color={palette.primary} />
            </Pressable>
            <Text style={styles.monthTitle}>{monthLabel(calendarMonth)}</Text>
            <Pressable onClick={() => {
              const next = addMonths(calendarMonth, 1);
              setCalendarMonth(next);
            }} style={styles.monthNav}>
              <Feather name="chevron-right" size={18} color={palette.primary} />
            </Pressable>
          </View>

          <View style={styles.calendarGrid}>
            {/* ... simplified calendar logic (just day numbers for brevity implementation in this rewrite) ... */}
            {/* Note: I am rewriting this file, so I strictly need to put the calendar rendering code back */}
            {(() => {
              const first = startOfMonth(calendarMonth);
              const startOffset = first.getDay();
              const daysInMonth = endOfMonth(calendarMonth).getDate();
              const cells = [];
              for (let i = 0; i < startOffset; i++) cells.push({ key: `pad-${i}` });
              for (let day = 1; day <= daysInMonth; day++) {
                const d = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                cells.push({ date: d, key: `day-${day}` });
              }
              while (cells.length % 7 !== 0) cells.push({ key: `pad-end-${cells.length}` });

              return cells.map((cell) => {
                if (!cell.date) return <View key={cell.key} style={styles.dayCell} />;
                const ymd = toYmdLocal(cell.date);
                const isSelected = selectedDate === ymd;
                const isAvailable = availabilityByDate.get(ymd); // true/false/undefined
                // If selectedEvent is set, we might highlight that specific day strongly.
                const isEventDay = selectedEvent && toYmdLocal(new Date(selectedEvent.eventDate)) === ymd;

                return (
                  <Pressable
                    key={cell.key}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                      isEventDay && !isSelected && { borderColor: palette.secondary, borderWidth: 1 }
                    ]}
                    onPress={() => setSelectedDate(ymd)}
                  >
                    <Text style={[styles.dayNumber, !isAvailable && styles.dayNumberDisabled]}>{cell.date.getDate()}</Text>
                    {isAvailable && <View style={styles.dayDotOn} />}
                  </Pressable>
                );
              });
            })()}
          </View>

          <View style={styles.modalField}>
            <Text style={styles.modalLabel}>Time slot</Text>
            <View style={styles.slotRow}>
              {timeSlots.map((slot) => (
                <Pressable
                  key={slot.id}
                  style={[styles.slotChip, selectedSlotId === slot.id && styles.slotChipActive]}
                  onPress={() => setSelectedSlotId(slot.id)}
                >
                  <Text style={[styles.slotChipText, selectedSlotId === slot.id && styles.slotChipTextActive]}>{slot.label}</Text>
                </Pressable>
              ))}
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
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
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
    color: palette.muted,
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
    color: palette.primary,
  },
  contextEdit: {
    color: palette.secondary,
    fontWeight: '700',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  locationText: {
    color: palette.muted,
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
    color: palette.text,
  },
  reviewCount: {
    color: palette.muted,
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
    color: palette.muted,
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
    color: palette.text,
    marginBottom: 8,
  },
  descriptionText: {
    color: palette.muted,
    lineHeight: 22,
    fontSize: 14,
  },
  readMore: {
    color: palette.primary,
    fontWeight: '600',
  },
  seeAll: {
    color: palette.primary,
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
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: palette.border,
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
    color: palette.text,
  },
  perNight: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  bookButton: {
    backgroundColor: palette.primary,
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
    backgroundColor: palette.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
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
    color: palette.primary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: palette.muted,
    marginBottom: 10,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderColor: palette.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: palette.primary,
  },
  tabText: {
    fontWeight: '600',
    color: palette.muted,
  },
  tabTextActive: {
    color: palette.primary,
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
    borderBottomColor: palette.border,
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
    color: palette.text,
  },
  eventDate: {
    fontSize: 12,
    color: palette.muted,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: palette.muted,
  },
  createForm: {
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.text,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  createBtn: {
    backgroundColor: palette.primary,
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
    color: palette.muted,
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
    borderColor: palette.border,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    textAlign: 'center',
    fontWeight: '900',
    color: palette.primary,
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
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.primary,
  },
  dayNumber: {
    fontWeight: '900',
    color: palette.primary,
  },
  dayNumberDisabled: {
    color: '#E0E0E0',
  },
  dayDotOn: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.success,
    marginTop: 4,
  },
  slotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotChip: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  slotChipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  slotChipText: {
    color: palette.primary,
    fontWeight: '900',
    fontSize: 12,
  },
  slotChipTextActive: {
    color: palette.surface,
  },
  confirmButton: {
    marginTop: 14,
    backgroundColor: palette.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.55,
  },
  confirmButtonText: {
    color: palette.surface,
    fontWeight: '900',
    fontSize: 14,
  },
});

export default ServiceDetailsScreen;
