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
import BottomNavBar from '@/components/BottomNavBar';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/ThemeContext';
import { useDebounce } from '../hooks/useDebounce';
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
  const { theme } = useTheme();
  const servicesQuery = trpc.services.getServices.useQuery(undefined, { retry: 1 });
  const user = useAuthStore((state) => state.user);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400); // 400ms delay for snappier performance
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Greeting Logic
  const greeting = useMemo(() => {
    // Basic "Hello" as per design, could be dynamic
    return 'Hotels & Services'; // Changed greeting for better context
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
    const normalized = debouncedQuery.trim().toLowerCase();
    return services.filter((item) => {
      const matchesCategory = selectedCategory === 'all' ? true : item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!normalized) return true;

      const vc = typeof item.vendorCompany === 'string'
        ? item.vendorCompany
        : (item.vendorCompany as any)?.name ?? '';

      const haystack = [
        item.name,
        item.serviceDetails,
        vc,
        item.category
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [debouncedQuery, selectedCategory, services]);

  const popularServices = useMemo(() => {
    // Just take the first 5 for now as "Popular"
    return filteredServices.slice(0, 5);
  }, [filteredServices]);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.greetingRow}>
          <Text style={styles.greetingText}>{greeting} {displayName}!</Text>
          <Text style={styles.waveEmoji}>👋</Text>
        </View>
        <Pressable style={styles.notificationBtn}>
          <Feather name="bell" size={20} color={theme.text} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </Pressable>
      </View>

      <Text style={styles.mainTitle}>Plan your perfect event</Text>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Feather name="search" size={20} color={theme.muted} style={styles.searchIcon} />
        <TextInput
          placeholder="Search hotel"
          placeholderTextColor={theme.muted}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <Pressable
            onPress={() => setQuery('')}  // Just clear query, debounce will follow
            hitSlop={10}
            style={{ marginRight: 8 }}
          >
            <Feather name="x-circle" size={18} color={theme.muted} />
          </Pressable>
        )}
        <Pressable style={styles.filterBtn}>
          <Ionicons name="options-outline" size={20} color={theme.text} />
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
      <BottomNavBar />
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background, // Light gray background
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
    color: theme.muted,
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
    color: theme.text,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceHighlight, // Better contrast in dark mode
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
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
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  categoryPillActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.muted,
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
    color: theme.text,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.primary,
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
});

export default PackagesScreen;
