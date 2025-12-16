import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';

export type FacilityType = 'bathtub' | 'wifi' | 'buffet' | 'pool' | 'gym' | 'parking';

type Props = {
    type: FacilityType;
    label: string;
};

const getIcon = (type: FacilityType, theme: any) => {
    switch (type) {
        case 'bathtub': return <FontAwesome5 name="bath" size={20} color={theme.muted} />;
        case 'wifi': return <Feather name="wifi" size={20} color={theme.muted} />;
        case 'buffet': return <FontAwesome5 name="utensils" size={20} color={theme.muted} />;
        case 'pool': return <FontAwesome5 name="swimming-pool" size={20} color={theme.muted} />;
        case 'gym': return <FontAwesome5 name="dumbbell" size={20} color={theme.muted} />;
        case 'parking': return <FontAwesome5 name="parking" size={20} color={theme.muted} />;
        default: return <Feather name="check" size={20} color={theme.muted} />;
    }
};

const FacilityItem = ({ type, label }: Props) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                {getIcon(type, theme)}
            </View>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        width: 70, // Fixed width for consistent spacing
        height: 70,
        backgroundColor: theme.surface,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: theme.border,
    },
    iconContainer: {
        // Icons are centered by default in container
    },
    label: {
        fontSize: 11,
        color: theme.muted,
        fontWeight: '600',
    }
});

export default FacilityItem;
