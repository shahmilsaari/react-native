import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeContext';

const navItems = [
    { label: 'Explore', icon: 'home' as const, route: 'Packages' },
    { label: 'Map', icon: 'map-pin' as const, route: 'Map' },
    { label: 'Calendar', icon: 'calendar' as const, route: 'MyCalendar' },
    { label: 'Profile', icon: 'user' as const, route: 'Profile' }
];

const BottomNavBar = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { theme } = useTheme();

    // Determine active tab based on current route name
    const activeRouteIndex = navItems.findIndex(item => item.route === route.name);
    const activeIndex = activeRouteIndex >= 0 ? activeRouteIndex : 0;

    const handlePress = (item: typeof navItems[0]) => {
        if (item.route === 'Map') return;
        navigation.navigate(item.route);
    };

    const styles = React.useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.bottomNav}>
            {navItems.map((item, index) => {
                const isActive = index === activeIndex;
                return (
                    <Pressable
                        key={item.label}
                        style={[styles.navButton, isActive && styles.navButtonActive]}
                        onPress={() => handlePress(item)}
                    >
                        <Feather
                            name={item.icon}
                            size={20}
                            color={isActive ? theme.textInverted : theme.muted}
                        />
                        <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    bottomNav: {
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: 24,
        backgroundColor: theme.surface,
        borderRadius: 32,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: theme.border
    },
    navButton: {
        alignItems: 'center',
        flex: 1
    },
    navButtonActive: {
        backgroundColor: theme.tabBarActive,
        borderRadius: 24,
        paddingVertical: 10
    },
    navLabel: {
        fontSize: 12,
        color: theme.muted,
        fontWeight: '600',
        marginTop: 4
    },
    navLabelActive: {
        color: theme.textInverted
    }
});

export default BottomNavBar;
