import React from 'react';
import { View, Text, StyleSheet, Pressable, ImageBackground } from 'react-native';
import { Feather } from '@expo/vector-icons';

import palette from '@/theme/colors';
import { formatCurrency } from '@/utils/formatCurrency';

export type ServiceListItem = {
  id: string;
  name?: string;
  serviceDetails?: string;
  images?: string[];
  price?: number;
  category?: string;
  vendorCompany?: string;
  coverageLocations?: Array<{ name?: string; city?: string; state?: string }>;
};

type Props = {
  data: ServiceListItem;
  onPress: () => void;
};



const getLocationLabel = (item: ServiceListItem) => {
  const location = item.coverageLocations?.[0];
  if (!location) return undefined;
  const parts = [location.name, location.city, location.state].filter(Boolean);
  return parts.join(' · ');
};

const ServiceCard = ({ data, onPress }: Props) => {
  const image = data.images?.[0];
  const locationLabel = getLocationLabel(data);

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <ImageBackground
        source={image ? { uri: image } : undefined}
        style={styles.cover}
        imageStyle={styles.coverImage}
      >
        <View style={styles.overlay} />

        <View style={styles.topRow}>
          {data.category ? (
            <View style={styles.pill}>
              <Text style={styles.pillText} numberOfLines={1}>
                {data.category}
              </Text>
            </View>
          ) : (
            <View />
          )}
          <View style={styles.favorite}>
            <Feather name="bookmark" size={18} color="#fff" />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {data.name ?? 'Service'}
          </Text>
          {data.vendorCompany ? (
            <View style={styles.metaLine}>
              <Feather name="briefcase" size={14} color={palette.surface} />
              <Text style={styles.metaText} numberOfLines={1}>
                {data.vendorCompany}
              </Text>
            </View>
          ) : null}
          {locationLabel ? (
            <View style={styles.metaLine}>
              <Feather name="map-pin" size={14} color={palette.surface} />
              <Text style={styles.metaText} numberOfLines={1}>
                {locationLabel}
              </Text>
            </View>
          ) : null}

          <View style={styles.footerRow}>
            <View>
              <Text style={styles.price}>{formatCurrency(data.price)}</Text>
              <Text style={styles.priceHint}>Starting price</Text>
            </View>
            <View style={styles.cta}>
              <Text style={styles.ctaText}>View</Text>
              <Feather name="arrow-up-right" size={16} color={palette.primary} />
            </View>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 20,
    height: 320,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 6
  },
  cover: {
    flex: 1,
    backgroundColor: '#EDEFF5'
  },
  coverImage: {
    borderRadius: 28
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18
  },
  pill: {
    maxWidth: '80%',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.92)'
  },
  pillText: {
    color: palette.primary,
    fontWeight: '900',
    fontSize: 12
  },
  favorite: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(17,19,34,0.5)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 22,
    gap: 10
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: palette.surface
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  metaText: {
    color: palette.surface,
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.95,
    flex: 1
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12
  },
  price: {
    color: '#FACC15',
    fontSize: 22,
    fontWeight: '900'
  },
  priceHint: {
    color: palette.surface,
    opacity: 0.9,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  ctaText: {
    color: palette.primary,
    fontWeight: '900'
  }
});

export default ServiceCard;

