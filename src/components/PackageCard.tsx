import React from 'react';
import { View, Text, StyleSheet, Pressable, ImageBackground } from 'react-native';
import { Feather } from '@expo/vector-icons';

import palette from '@/theme/colors';
import { TravelPackage } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';

type Props = {
  data: TravelPackage;
  onPress: () => void;
};

const PackageCard = ({ data, onPress }: Props) => {
  const quickFacts = [
    { icon: 'users' as const, label: `${data.slotsAvailable} spots` },
    { icon: 'clock' as const, label: `${data.durationDays} days` },
    { icon: 'star' as const, label: data.rating.toFixed(1) }
  ];

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <ImageBackground source={{ uri: data.image }} style={styles.cover} imageStyle={styles.coverImage}>
        <View style={styles.overlay} />
        <View style={styles.favorite}>
          <Feather name="heart" size={18} color="#fff" />
        </View>
        <View style={styles.content}>
          <View style={styles.badge}>
            <Feather name="map-pin" size={12} color={palette.surface} />
            <Text style={styles.badgeText}>{data.destination}</Text>
          </View>
          <Text style={styles.name}>{data.name}</Text>
          <Text style={styles.priceLine}>
            <Text style={styles.priceValue}>{formatCurrency(data.price)}</Text>
            <Text style={styles.priceSuffix}> /package</Text>
          </Text>
          <View style={styles.metaRow}>
            {quickFacts.map((fact) => (
              <View key={fact.icon} style={styles.metaItem}>
                <Feather name={fact.icon} size={14} color={palette.surface} />
                <Text style={styles.metaText}>{fact.label}</Text>
              </View>
            ))}
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
    flex: 1
  },
  coverImage: {
    borderRadius: 28
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)'
  },
  favorite: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(17,19,34,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
    gap: 10
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  badgeText: {
    color: palette.surface,
    fontSize: 13,
    fontWeight: '600'
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.surface
  },
  priceLine: {
    marginTop: 2
  },
  priceValue: {
    color: '#FACC15',
    fontSize: 20,
    fontWeight: '700'
  },
  priceSuffix: {
    color: palette.surface,
    fontSize: 14
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  metaText: {
    color: palette.surface,
    fontSize: 13,
    fontWeight: '600'
  }
});

export default PackageCard;
