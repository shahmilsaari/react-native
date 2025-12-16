import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, ScrollView } from 'react-native';
import { format, isPast, isFuture, isToday } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '@/theme/ThemeContext';
import { trpc } from '@/lib/trpc';
import BottomNavBar from '@/components/BottomNavBar';

type CalendarEvent = {
    id: string;
    name: string;
    eventDate: string; // ISO
    location?: string;
    isActive: boolean;
    services: ServiceBooking[];
};

type ServiceBooking = {
    id: string;
    serviceName: string;
    status: string;
    image?: string;
};

const MyEventsListScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();

    // Fetch events and bookings
    const eventsQuery = trpc.events.my.useQuery(undefined);
    const bookingsQuery = trpc.bookings.my.useQuery(undefined);

    const { upcomingEvents, pastEvents } = useMemo(() => {
        const rawEvents = eventsQuery.data as any;
        const eventListRaw =
            (Array.isArray(rawEvents) && rawEvents) ||
            (Array.isArray(rawEvents?.data) && rawEvents.data) ||
            [];

        const rawBookings = bookingsQuery.data as any;
        const bookingListRaw =
            (Array.isArray(rawBookings) && rawBookings) ||
            (Array.isArray(rawBookings?.data) && rawBookings.data) ||
            [];

        // Normalize Bookings
        const bookings = (bookingListRaw as any[]).map(b => ({
            id: b.id,
            eventId: b.event?.id ?? b.eventId,
            serviceName: b.service?.name ?? 'Unknown Service',
            status: b.status,
            image: b.service?.images?.[0]
        }));

        // Map Events and attach bookings
        const allEvents = (eventListRaw as any[]).map((item): CalendarEvent | null => {
            const id = item?.id ?? item?._id ?? item?.eventId ?? item?.event_id;
            if (!id) return null;

            const eventBookings = bookings.filter((b: any) => b.eventId === id).map((b: any) => ({
                id: b.id,
                serviceName: b.serviceName,
                status: b.status,
                image: b.image
            }));

            return {
                id: String(id),
                name: String(item?.name ?? item?.eventName ?? 'Untitled event'),
                eventDate: String(item?.eventDate ?? item?.event_date ?? item?.date ?? new Date().toISOString()),
                location: item?.location ? String(item.location) : undefined,
                isActive: item?.isActive == null ? true : Boolean(item.isActive),
                services: eventBookings
            };
        }).filter((item): item is CalendarEvent => item !== null)
            .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

        const now = new Date();
        const upcoming = allEvents.filter(e => isFuture(new Date(e.eventDate)) || isToday(new Date(e.eventDate)));
        const past = allEvents.filter(e => isPast(new Date(e.eventDate)) && !isToday(new Date(e.eventDate))).reverse(); // Most recent past first

        return { upcomingEvents: upcoming, pastEvents: past };
    }, [eventsQuery.data, bookingsQuery.data]);

    const styles = useMemo(() => createStyles(theme), [theme]);

    const renderServiceItem = (service: ServiceBooking) => (
        <View key={service.id} style={styles.serviceItem}>
            <View style={styles.serviceImageContainer}>
                {service.image ? (
                    <Image source={{ uri: service.image }} style={styles.serviceImage} />
                ) : (
                    <FontAwesome5 name="concierge-bell" size={16} color={theme.primary} />
                )}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{service.serviceName}</Text>
                <Text style={[styles.serviceStatus, { color: service.status === 'confirmed' ? theme.success : theme.muted }]}>
                    {service.status}
                </Text>
            </View>
        </View>
    );

    const renderEventItem = (item: CalendarEvent) => (
        <View key={item.id} style={styles.eventCard}>
            <View style={styles.eventHeader}>
                <View style={styles.eventHeaderLeft}>
                    <Text style={styles.eventTitle}>{item.name}</Text>
                    <View style={styles.eventMetaRow}>
                        <Ionicons name="calendar-outline" size={14} color={theme.muted} />
                        <Text style={styles.eventMetaText}>
                            {format(new Date(item.eventDate), 'MMM d, yyyy • h:mm a')}
                        </Text>
                    </View>
                    {item.location && (
                        <View style={[styles.eventMetaRow, { marginTop: 4 }]}>
                            <Ionicons name="location-outline" size={14} color={theme.muted} />
                            <Text style={styles.eventMetaText}>{item.location}</Text>
                        </View>
                    )}
                </View>
                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#ECFDF3' : theme.surfaceHighlight }]}>
                    <Text style={[styles.statusText, { color: item.isActive ? theme.success : theme.muted }]}>
                        {item.isActive ? 'Active' : 'Past'}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.servicesSection}>
                {item.services.length > 0 ? (
                    <View style={styles.servicesList}>
                        {item.services.map(renderServiceItem)}
                    </View>
                ) : (
                    <Text style={styles.noServicesText}>No services booked.</Text>
                )}
            </View>
        </View>
    );

    const isLoading = eventsQuery.isLoading || bookingsQuery.isLoading;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Events</Text>
                <TouchableOpacity onPress={() => navigation.navigate('MyCalendar')} style={styles.calendarButton}>
                    <Feather name="calendar" size={24} color={theme.primary} />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {upcomingEvents.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Upcoming</Text>
                                {upcomingEvents.map(renderEventItem)}
                            </View>
                        )}

                        {pastEvents.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Past</Text>
                                {pastEvents.map(renderEventItem)}
                            </View>
                        )}

                        {upcomingEvents.length === 0 && pastEvents.length === 0 && (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIcon}>
                                    <Feather name="calendar" size={40} color={theme.muted} />
                                </View>
                                <Text style={styles.emptyStateTitle}>No events found</Text>
                                <Text style={styles.emptyStateText}>
                                    You haven't created any events yet.
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                    <BottomNavBar />
                </View>
            )}
        </SafeAreaView>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        backgroundColor: theme.surface,
    },
    backButton: {
        padding: 4,
    },
    calendarButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 12,
        marginLeft: 4,
    },
    eventCard: {
        backgroundColor: theme.surface,
        borderRadius: 16,
        marginBottom: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: theme.border,
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    eventHeaderLeft: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 6,
    },
    eventMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    eventMetaText: {
        fontSize: 13,
        color: theme.muted,
        marginLeft: 6,
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginLeft: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    divider: {
        height: 1,
        backgroundColor: theme.border,
        marginVertical: 12,
    },
    servicesSection: {
        marginTop: 4,
    },
    servicesList: {
        gap: 12,
    },
    serviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.surfaceHighlight,
        padding: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
    },
    serviceImageContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: theme.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    serviceImage: {
        width: '100%',
        height: '100%',
    },
    serviceName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 2,
    },
    serviceStatus: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    noServicesText: {
        color: theme.muted,
        fontStyle: 'italic',
        fontSize: 13,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: theme.muted,
        textAlign: 'center',
    },
});

export default MyEventsListScreen;
