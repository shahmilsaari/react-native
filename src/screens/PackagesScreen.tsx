import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  RefreshControl,
  Pressable,
  ScrollView
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import PackageCard from '@/components/PackageCard';
import { usePackagesStore } from '@/store/packagesStore';
import { useAuthStore } from '@/store/authStore';
import palette from '@/theme/colors';
import { RootStackParamList } from '@/navigation/types';
import { PackageCategory } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Packages'>;

const categoryFilters: Array<{ label: string; value: 'all' | PackageCategory }> = [
  { label: 'All', value: 'all' },
  { label: 'Culture', value: 'culture' },
  { label: 'Relax', value: 'relax' },
  { label: 'Adventure', value: 'adventure' }
];

const navItems = [
  { label: 'Explore', icon: 'home' as const },
  { label: 'Map', icon: 'map-pin' as const },
  { label: 'Calendar', icon: 'calendar' as const },
  { label: 'Profile', icon: 'user' as const }
];

const PackagesScreen = ({ navigation }: Props) => {
  const packages = usePackagesStore((state) => state.packages);
  const refreshPackages = usePackagesStore((state) => state.refreshPackages);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | PackageCategory>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (searchExpanded) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [searchExpanded]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const displayName = useMemo(() => {
    if (user?.firstName || user?.lastName) {
      return `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    }
    return user?.email ?? 'Guest';
  }, [user?.email, user?.firstName, user?.lastName]);

  const filteredPackages = useMemo(() => {
    const normalized = query.toLowerCase();

    return packages.filter(
      (item) =>
        (item.name.toLowerCase().includes(normalized) ||
          item.destination.toLowerCase().includes(normalized) ||
          item.category.toLowerCase().includes(normalized)) &&
        (selectedCategory === 'all' || item.category === selectedCategory)
    );
  }, [packages, query, selectedCategory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshPackages();
    setRefreshing(false);
  };

  const renderHeader = () => (
    <View style={styles.hero}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.profileName} numberOfLines={1}>
            {displayName}
          </Text>
        </View>
        <View style={styles.topBarActions}>
          {searchExpanded ? (
            <Pressable
              style={styles.iconButton}
              onPress={() => {
                setSearchExpanded(false);
                setQuery('');
              }}
            >
              <Feather name="x" size={20} color={palette.primary} />
            </Pressable>
          ) : (
            <Pressable style={styles.iconButton} onPress={() => setSearchExpanded(true)}>
              <Feather name="search" size={18} color={palette.primary} />
            </Pressable>
          )}
          <Pressable style={styles.iconButton} onPress={logout}>
            <Feather name="menu" size={20} color={palette.primary} />
          </Pressable>
        </View>
      </View>

      {searchExpanded ? (
        <View style={styles.searchField}>
          <Feather name="search" size={18} color={palette.muted} />
          <TextInput
            ref={searchInputRef}
            placeholder="Search cities, stays, experiences"
            placeholderTextColor={palette.muted}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <Feather name="x-circle" size={18} color={palette.muted} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        {categoryFilters.map((filter) => {
          const isActive = selectedCategory === filter.value;
          return (
            <Pressable
              key={filter.value}
              style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(filter.value)}
            >
              <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredPackages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        renderItem={({ item }) => (
          <PackageCard data={item} onPress={() => navigation.navigate('PackageDetails', { packageId: item.id })} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No stays match "{query}". Try another keyword or category.</Text>
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

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
    backgroundColor: palette.background
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 160
  },
  hero: {
    paddingTop: 8,
    paddingBottom: 12,
    gap: 18
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  greeting: {
    fontSize: 14,
    color: palette.muted
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.primary,
    marginTop: 4
  },
  topBarActions: {
    flexDirection: 'row',
    gap: 12
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface
  },
  searchField: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    backgroundColor: palette.surface,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: palette.border,
    height: 54
  },
  searchInput: {
    flex: 1,
    color: palette.text,
    fontSize: 15
  },
  categories: {
    gap: 12,
    paddingVertical: 6
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#EEF2FF'
  },
  categoryPillActive: {
    backgroundColor: palette.primary
  },
  categoryLabel: {
    color: palette.primary,
    fontWeight: '600'
  },
  categoryLabelActive: {
    color: palette.surface
  },
  emptyText: {
    textAlign: 'center',
    color: palette.muted,
    marginTop: 40
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
