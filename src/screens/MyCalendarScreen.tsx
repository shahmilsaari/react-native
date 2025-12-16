import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { format } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
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

const MyCalendarScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Fetch events and bookings
    const eventsQuery = trpc.events.my.useQuery(undefined);
    const bookingsQuery = trpc.bookings.my.useQuery(undefined);

    const eventsList = useMemo(() => {
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
        return (eventListRaw as any[]).map((item): CalendarEvent | null => {
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
        }).filter((item): item is CalendarEvent => item !== null);
    }, [eventsQuery.data, bookingsQuery.data]);

    const styles = useMemo(() => createStyles(theme), [theme]);

    const onDayPress = (day: DateData) => {
        setSelectedDate(day.dateString);
    };

    const eventsForSelectedDate = useMemo(() => {
        return eventsList.filter(event => {
            try {
                const eventYmd = format(new Date(event.eventDate), 'yyyy-MM-dd');
                return eventYmd === selectedDate;
            } catch (e) {
                return false;
            }
        });
    }, [eventsList, selectedDate]);

    const getMarkedDates = () => {
        const marked: any = {};

        eventsList.forEach(event => {
            try {
                const date = format(new Date(event.eventDate), 'yyyy-MM-dd');
                marked[date] = {
                    marked: true,
                    dotColor: theme.primary,
                };
            } catch (e) {
                // Ignore invalid dates
            }
        });

        // Highlight selected date
        marked[selectedDate] = {
            ...marked[selectedDate],
            selected: true,
            selectedColor: theme.primary,
            disableTouchEvent: true,
        };
        return marked;
    };

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

    const renderEventItem = ({ item }: { item: CalendarEvent }) => (
        <View style={styles.eventCard}>
            <View style={styles.eventHeader}>
                <View style={styles.eventHeaderLeft}>
                    <Text style={styles.eventTitle}>{item.name}</Text>
                    <View style={styles.eventMetaRow}>
                        <Ionicons name="time-outline" size={14} color={theme.muted} />
                        <Text style={styles.eventMetaText}>
                            {format(new Date(item.eventDate), 'h:mm a')}
                        </Text>
                        {item.location && (
                            <>
                                <Text style={styles.eventMetaDivider}>•</Text>
                                <Ionicons name="location-outline" size={14} color={theme.muted} />
                                <Text style={styles.eventMetaText}>{item.location}</Text>
                            </>
                        )}
                    </View>
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
                <Text style={styles.servicesTitle}>Booked Services</Text>
                {item.services.length > 0 ? (
                    <View style={styles.servicesList}>
                        {item.services.map(renderServiceItem)}
                    </View>
                ) : (
                    <Text style={styles.noServicesText}>No services booked yet.</Text>
                )}
            </View>
        </View>
    );

    const isLoading = eventsQuery.isLoading || bookingsQuery.isLoading;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Calendar</Text>
                <View style={{ width: 24 }} />
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <>
                    <Calendar
                        theme={{
                            backgroundColor: theme.background,
                            calendarBackground: theme.background,
                            textSectionTitleColor: theme.muted,
                            selectedDayBackgroundColor: theme.primary,
                            selectedDayTextColor: theme.textInverted,
                            todayTextColor: theme.secondary,
                            dayTextColor: theme.text,
                            textDisabledColor: '#d9e1e8',
                            dotColor: theme.primary,
                            selectedDotColor: theme.textInverted,
                            arrowColor: theme.primary,
                            disabledArrowColor: '#d9e1e8',
                            monthTextColor: theme.text,
                            indicatorColor: theme.primary,
                            textDayFontWeight: '300',
                            textMonthFontWeight: 'bold',
                            textDayHeaderFontWeight: '300',
                            textDayFontSize: 16,
                            textMonthFontSize: 16,
                            textDayHeaderFontSize: 14
                        }}
                        onDayPress={onDayPress}
                        markedDates={getMarkedDates()}
                        enableSwipeMonths={true}
                    />

                    <View style={styles.eventsContainer}>
                        <Text style={styles.sectionTitle}>
                            Events for {format(new Date(selectedDate), 'MMMM d, yyyy')}
                        </Text>
                        {eventsForSelectedDate.length > 0 ? (
                            <FlatList
                                data={eventsForSelectedDate}
                                renderItem={renderEventItem}
                                keyExtractor={item => item.id}
                                contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
                                showsVerticalScrollIndicator={false}
                            />
                        ) : (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIcon}>
                                    <Ionicons name="calendar-outline" size={40} color={theme.muted} />
                                </View>
                                <Text style={styles.emptyStateTitle}>No events scheduled</Text>
                                <Text style={styles.emptyStateText}>
                                    Select another date to view your plans.
                                </Text>
                            </View>
                        )}
                    </View>
                    <BottomNavBar />
                </>
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
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
    },
    eventsContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 20,
        backgroundColor: theme.surfaceHighlight, // Light gray surface for cards
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 16,
        marginLeft: 4,
    },
    listContent: {
        paddingBottom: 40,
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
        flexWrap: 'wrap',
    },
    eventMetaText: {
        fontSize: 13,
        color: theme.muted,
        marginLeft: 4,
        fontWeight: '500',
    },
    eventMetaDivider: {
        marginHorizontal: 8,
        color: theme.muted,
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
    servicesTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.muted,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    servicesList: {
        gap: 12,
    },
    serviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.surfaceHighlight,
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
    },
    serviceImageContainer: {
        width: 40,
        height: 40,
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
        flex: 1,
        justifyContent: 'center',
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

export default MyCalendarScreen;
