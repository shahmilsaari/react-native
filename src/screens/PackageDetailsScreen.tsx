import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions,
  ImageBackground,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '@/navigation/types';
import { usePackagesStore } from '@/store/packagesStore';
import palette from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'PackageDetails'>;

const { width } = Dimensions.get('window');
const sliderHeight = width * 0.75;
type FeatherIconName = 'wind' | 'sun' | 'coffee' | 'tv' | 'wifi' | 'feather';

const PackageDetailsScreen = ({ route, navigation }: Props) => {
  const packages = usePackagesStore((state) => state.packages);
  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === route.params.packageId),
    [packages, route.params.packageId]
  );

  const [activeSlide, setActiveSlide] = useState(0);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems?.length && viewableItems[0].index != null) {
      setActiveSlide(viewableItems[0].index);
    }
  }).current;

  if (!selectedPackage) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Package not found.</Text>
      </View>
    );
  }

  const gallery = useMemo(() => {
    const fallback = [
      selectedPackage.image,
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80'
    ];
    return Array.from(new Set(fallback));
  }, [selectedPackage.image]);

  const stayFacts = [
    { icon: 'users' as const, label: 'Guests', value: `${Math.max(2, selectedPackage.slotsAvailable)} guests` },
    { icon: 'home' as const, label: 'Service', value: `${selectedPackage.serviceLevel} vibes` },
    { icon: 'clock' as const, label: 'Duration', value: `${selectedPackage.durationDays} days` }
  ];

  const amenityIcons: FeatherIconName[] = ['wind', 'sun', 'coffee', 'tv', 'wifi', 'feather'];
  const amenities = selectedPackage.highlights.slice(0, amenityIcons.length).map((item, index) => ({
    icon: amenityIcons[index % amenityIcons.length],
    label: item
  }));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sliderWrapper}>
          <FlatList
            data={gallery}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `${item}-${index}`}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            renderItem={({ item }) => (
              <ImageBackground source={{ uri: item }} style={styles.slide} imageStyle={styles.slideImage}>
                <View style={styles.sliderTop}>
                  <Pressable style={styles.circleButton} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={18} color={palette.primary} />
                  </Pressable>
                  <Pressable style={styles.circleButton}>
                    <Feather name="heart" size={18} color={palette.primary} />
                  </Pressable>
                </View>
              </ImageBackground>
            )}
          />
          <View style={styles.dots}>
            {gallery.map((_, index) => (
              <View key={index} style={[styles.dot, index === activeSlide && styles.activeDot]} />
            ))}
          </View>
        </View>

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{selectedPackage.name}</Text>
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={16} color={palette.muted} />
              <Text style={styles.destination}>{selectedPackage.destination}</Text>
            </View>
          </View>
          <View style={styles.priceWrapper}>
            <Text style={styles.price}>${selectedPackage.price}</Text>
            <Text style={styles.priceHint}>per package</Text>
          </View>
        </View>

        <View style={styles.ratingRow}>
          <View style={styles.ratingChip}>
            <Feather name="star" size={16} color="#FACC15" />
            <Text style={styles.ratingText}>
              {selectedPackage.rating.toFixed(1)} rating
            </Text>
          </View>
        </View>

        <View style={styles.factRow}>
          {stayFacts.map((fact) => (
            <View key={fact.label} style={styles.factCard}>
              <Feather name={fact.icon} size={18} color={palette.primary} />
              <Text style={styles.factLabel}>{fact.label}</Text>
              <Text style={styles.factValue}>{fact.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{selectedPackage.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {amenities.map((item) => (
              <View key={item.label} style={styles.amenityCard}>
                <Feather name={item.icon} size={18} color={palette.primary} />
                <Text style={styles.amenityLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Highlights</Text>
          {selectedPackage.highlights.map((highlight) => (
            <View key={highlight} style={styles.highlightRow}>
              <Feather name="check-circle" color={palette.secondary} size={18} />
              <Text style={styles.highlightText}>{highlight}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.ctaBar}>
        <View>
          <Text style={styles.ctaLabel}>Total</Text>
          <Text style={styles.ctaPrice}>${selectedPackage.price}</Text>
        </View>
        <Pressable style={styles.bookButton}>
          <Text style={styles.bookText}>Book now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background
  },
  content: {
    paddingBottom: 140
  },
  sliderWrapper: {
    height: sliderHeight
  },
  slide: {
    width,
    height: sliderHeight,
    justifyContent: 'space-between'
  },
  slideImage: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32
  },
  sliderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingHorizontal: 20
  },
  circleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)'
  },
  activeDot: {
    width: 18,
    backgroundColor: palette.surface
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: 'flex-start',
    gap: 16
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: palette.primary
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6
  },
  destination: {
    color: palette.muted,
    fontSize: 15
  },
  priceWrapper: {
    alignItems: 'flex-end'
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.primary
  },
  priceHint: {
    color: palette.muted,
    fontSize: 12
  },
  ratingRow: {
    paddingHorizontal: 24,
    marginTop: 12
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.surface,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16
  },
  ratingText: {
    color: palette.primary,
    fontWeight: '600'
  },
  factRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 20,
    gap: 16
  },
  factCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: 18,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: palette.border
  },
  factLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: palette.muted,
    letterSpacing: 0.5
  },
  factValue: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.primary
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 28,
    gap: 12
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.primary
  },
  description: {
    lineHeight: 22,
    color: palette.text
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  amenityCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    gap: 8,
    backgroundColor: palette.surface
  },
  amenityLabel: {
    fontSize: 13,
    color: palette.primary
  },
  highlightRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start'
  },
  highlightText: {
    flex: 1,
    color: palette.text,
    lineHeight: 20
  },
  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderColor: palette.border
  },
  ctaLabel: {
    color: palette.muted,
    fontSize: 13
  },
  ctaPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.primary
  },
  bookButton: {
    backgroundColor: '#D8F84F',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30
  },
  bookText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.primary
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background
  },
  fallbackText: {
    color: palette.muted
  }
});

export default PackageDetailsScreen;
