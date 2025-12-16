import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { ServiceListItem } from './ServiceCard';

type Props = {
    data: ServiceListItem;
    onPress: () => void;
};

const NearYouCard = ({ data, onPress }: Props) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const image = data.images?.[0] ?? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80';
    const rating = 4.9; // Mock

    return (
        <Pressable onPress={onPress} style={styles.container}>
            <Image source={{ uri: image }} style={styles.thumbnail} />

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title} numberOfLines={1}>
                        {data.name ?? 'Luxury Hotel'}
                    </Text>
                    <View style={styles.ratingContainer}>
                        <FontAwesome name="star" size={12} color="#FACC15" />
                        <Text style={styles.ratingText}>{rating}</Text>
                    </View>
                </View>

                <View style={styles.facilitiesRow}>
                    <View style={styles.facilityItem}>
                        <Ionicons name="people-outline" size={14} color={theme.muted} />
                        <Text style={styles.facilityText}>4 Guests</Text>
                    </View>
                    <View style={styles.facilityItem}>
                        <Ionicons name="bed-outline" size={14} color={theme.muted} />
                        <Text style={styles.facilityText}>2 Beds</Text>
                    </View>
                    <View style={styles.facilityItem}>
                        <Ionicons name="water-outline" size={14} color={theme.muted} />
                        <Text style={styles.facilityText}>2 Baths</Text>
                    </View>
                </View>
            </View>

            <View style={styles.favoriteButton}>
                <FontAwesome name="heart" size={14} color="white" />
            </View>
        </Pressable>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: theme.surface,
        borderRadius: 16,
        marginBottom: 16,
        alignItems: 'center',
        gap: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: theme.border,
    },
    thumbnail: {
        width: 70,
        height: 70,
        borderRadius: 12,
        backgroundColor: theme.border,
    },
    content: {
        flex: 1,
        gap: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text,
        flex: 1,
        marginRight: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.text,
    },
    facilitiesRow: {
        flexDirection: 'row',
        gap: 12,
    },
    facilityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    facilityText: {
        fontSize: 12,
        color: theme.muted,
    },
    favoriteButton: {
        position: 'absolute',
        left: 12 + 6, // 12 padding + some offset
        top: 12 + 6,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default NearYouCard;
