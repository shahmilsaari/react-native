import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  RefreshControl,
  Pressable,
  ScrollView,
  StatusBar
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';

import PopularHotelCard from '@/components/PopularHotelCard';
import NearYouCard from '@/components/NearYouCard';
import { ServiceListItem } from '@/components/ServiceCard';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/authStore';
import palette from '@/theme/colors';
import { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Packages'>;

// Navigation items mock
const navItems = [
  { label: 'Explore', icon: 'home' as const },
  { label: 'Map', icon: 'map-pin' as const },
  { label: 'Calendar', icon: 'calendar' as const },
  { label: 'Profile', icon: 'user' as const }
];

const PackagesScreen = ({ navigation }: Props) => {
  const servicesQuery = trpc.services.getServices.useQuery(undefined, { retry: 1 });
  const user = useAuthStore((state) => state.user);

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Greeting Logic
  const greeting = useMemo(() => {
    // Basic "Hello" as per design, could be dynamic
    return 'Hello';
  }, []);

  const displayName = useMemo(() => {
    if (user?.firstName || user?.lastName) {
      return `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    }
    return user?.email ?? 'Guest';
  }, [user?.email, user?.firstName, user?.lastName]);

  // Data Processing
  const services = useMemo(() => {
    const raw = servicesQuery.data as any;
    const list = Array.isArray(raw) ? raw : raw?.data;
    return (Array.isArray(list) ? list : []) as ServiceListItem[];
  }, [servicesQuery.data]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    services.forEach((service) => {
      if (typeof service.category === 'string' && service.category.trim()) {
        unique.add(service.category.trim());
      }
    });
    return ['all', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [services]);

  const filteredServices = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return services.filter((item) => {
      const matchesCategory = selectedCategory === 'all' ? true : item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!normalized) return true;
      const haystack = [item.name, item.serviceDetails, item.vendorCompany, item.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query, selectedCategory, services]);

  const popularServices = useMemo(() => {
    // Just take the first 5 for now as "Popular"
    return filteredServices.slice(0, 5);
  }, [filteredServices]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.greetingRow}>
          <Text style={styles.greetingText}>{greeting} {displayName}!</Text>
          <Text style={styles.waveEmoji}>👋</Text>
        </View>
        <Pressable style={styles.notificationBtn}>
          <Feather name="bell" size={20} color={palette.text} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </Pressable>
      </View>

      <Text style={styles.mainTitle}>Plan your perfect event</Text>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Feather name="search" size={20} color={palette.muted} style={styles.searchIcon} />
        <TextInput
          placeholder="Search hotel"
          placeholderTextColor={palette.muted}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
        <Pressable style={styles.filterBtn}>
          <Ionicons name="options-outline" size={20} color={palette.text} />
        </Pressable>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.slice(0, 4).map((cat) => { // Limit to 4 for visual match if many
          // Or just map all
          const isActive = selectedCategory === cat;
          // If 'all' is renamed to 'Popular' in design? 
          // Design has: Popular, Modern, Beach...
          // I'll map 'all' to 'Popular' label for display if needed, but logic remains.
          const label = cat === 'all' ? 'Popular' : cat;
          return (
            <Pressable
              key={cat}
              style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                {label.charAt(0).toUpperCase() + label.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Most Popular Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Most popular</Text>
        <Pressable>
          <Text style={styles.seeAllText}>See all</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.popularScroll}
      >
        {popularServices.map((item) => (
          <PopularHotelCard
            key={item.id}
            data={item}
            onPress={() => navigation.navigate('ServiceDetails', { serviceId: item.id })}
          />
        ))}
      </ScrollView>

      {/* Near You Section Header */}
      <View style={[styles.sectionHeader, styles.nearYouHeader]}>
        <View style={styles.nearYouTitleRow}>
          <Text style={styles.sectionTitle}>Near you</Text>
          <Text style={styles.fireEmoji}>🔥</Text>
        </View>
        <Pressable>
          <Text style={styles.seeAllText}>See all</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <NearYouCard
            data={item}
            onPress={() => navigation.navigate('ServiceDetails', { serviceId: item.id })}
          />
        )}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={servicesQuery.isFetching && !servicesQuery.isLoading} onRefresh={() => servicesQuery.refetch()} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        {navItems.map((item, index) => {
          const isActive = index === 0;
          return (
            <Pressable
              key={item.label}
              style={[styles.navButton, isActive && styles.navButtonActive]}
              onPress={() => {
                if (item.label === 'Profile') {
                  navigation.navigate('Profile');
                }
              }}
            >
              <Feather
                name={item.icon}
                size={20}
                color={isActive ? palette.surface : palette.muted}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Light gray background
  },
  listContent: {
    paddingBottom: 100, // Space for bottom nav
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greetingText: {
    fontSize: 16,
    color: palette.muted,
  },
  waveEmoji: {
    fontSize: 16,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { // Too small for text, just a dot usually, but design has number
    position: 'absolute',
    // adjusting for number visibility mock
    opacity: 0,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: palette.text,
  },
  filterBtn: {
    padding: 4,
  },
  categoryScroll: {
    gap: 12,
    paddingBottom: 24,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: palette.border,
  },
  categoryPillActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.muted,
  },
  categoryTextActive: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.text,
  },
  seeAllText: {
    fontSize: 14,
    color: palette.primary,
    fontWeight: '600',
  },
  popularScroll: {
    paddingRight: 20,
    marginBottom: 24,
    overflow: 'visible', // Attempt to let shadows show
  },
  nearYouHeader: {
    marginTop: 8,
  },
  nearYouTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fireEmoji: {
    fontSize: 20,
  },
  bottomNav: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    backgroundColor: palette.surface,
    borderRadius: 32,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8
  },
  navButton: {
    alignItems: 'center',
    flex: 1
  },
  navButtonActive: {
    backgroundColor: palette.primary,
    borderRadius: 24,
    paddingVertical: 10
  },
  navLabel: {
    fontSize: 12,
    color: palette.muted,
    fontWeight: '600',
    marginTop: 4
  },
  navLabelActive: {
    color: palette.surface
  }
});

export default PackagesScreen;
