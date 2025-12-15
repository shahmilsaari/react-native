import React from 'react';
import { View, Text, StyleSheet, Pressable, ImageBackground } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import palette from '@/theme/colors';
import { ServiceListItem } from './ServiceCard';
import { formatCurrency } from '@/utils/formatCurrency';

type Props = {
    data: ServiceListItem;
    onPress: () => void;
};

const PopularHotelCard = ({ data, onPress }: Props) => {
    const image = data.images?.[0] ?? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';

    // Mock rating since it's not in the type
    const rating = 4.9;

    const location = data.coverageLocations?.[0];
    const locationString = location ? `${location.city ?? ''}, ${location.state ?? ''}` : 'New York, USA';

    return (
        <Pressable onPress={onPress} style={styles.container}>
            <ImageBackground
                source={{ uri: image }}
                style={styles.imageBackground}
                imageStyle={styles.imageStyle}
            >
                <View style={styles.overlay} />

                <View style={styles.header}>
                    <View style={styles.ratingPill}>
                        <FontAwesome name="star" size={12} color="black" />
                        <Text style={styles.ratingText}>{rating}</Text>
                    </View>

                    <View style={styles.favoriteButton}>
                        <FontAwesome name="heart" size={16} color="white" />
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.name} numberOfLines={2}>
                        {data.name ?? 'Hotel Name'}
                    </Text>

                    <View style={styles.bottomRow}>
                        <View style={styles.locationContainer}>
                            <Feather name="map-pin" size={14} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.locationText} numberOfLines={1}>{locationString}</Text>
                        </View>

                        <View style={styles.priceContainer}>
                            <Text style={styles.priceValue}>{formatCurrency(data.price ?? 135)}</Text>
                            <Text style={styles.priceUnit}>/night</Text>
                        </View>
                    </View>
                </View>
            </ImageBackground>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 260,
        height: 320,
        marginRight: 16,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        backgroundColor: '#fff', // fallback
    },
    imageBackground: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 16,
    },
    imageStyle: {
        borderRadius: 24,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.25)', // darken slightly for text readability
        borderRadius: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ratingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    ratingText: {
        fontWeight: '700',
        fontSize: 12,
        color: '#000',
    },
    favoriteButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        gap: 8,
    },
    name: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
        marginRight: 8,
    },
    locationText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    priceValue: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    priceUnit: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
});

export default PopularHotelCard;
