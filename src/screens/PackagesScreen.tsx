import React, { useLayoutEffect, useMemo, useState } from 'react';
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
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | PackageCategory>('all');
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={logout}>
          <Text style={styles.logout}>Logout</Text>
        </Pressable>
      )
    });
  }, [logout, navigation]);

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
      <View style={styles.heroRow}>
        <View>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.profileName}>Delisas UX/UI & SaaS</Text>
        </View>
        <View style={styles.heroActions}>
          <Pressable style={styles.circleButton}>
            <Feather name="bell" size={18} color={palette.primary} />
          </Pressable>
          <Pressable style={styles.circleButton}>
            <Feather name="sliders" size={18} color={palette.primary} />
          </Pressable>
        </View>
      </View>
      <Text style={styles.heroSubtitle}>Stay on-brand even when you travel. Curated villas, lofts, and suites.</Text>

      <View style={styles.searchField}>
        <Feather name="search" color={palette.muted} size={18} />
        <TextInput
          placeholder="Search cities, hotels, experiences"
          placeholderTextColor={palette.muted}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
        <Pressable style={styles.filterButton}>
          <Feather name="more-horizontal" color={palette.surface} size={18} />
        </Pressable>
      </View>

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
            <Pressable key={item.label} style={[styles.navButton, isActive && styles.navButtonActive]}>
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
  heroRow: {
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
  heroSubtitle: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: palette.surface,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: palette.border,
    height: 56
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    color: palette.text,
    fontSize: 15
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center'
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
  logout: {
    color: palette.secondary,
    fontWeight: '600'
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
