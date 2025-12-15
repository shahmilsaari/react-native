import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import palette from '@/theme/colors';

export type FacilityType = 'bathtub' | 'wifi' | 'buffet' | 'pool' | 'gym' | 'parking';

type Props = {
    type: FacilityType;
    label: string;
};

const getIcon = (type: FacilityType) => {
    switch (type) {
        case 'bathtub': return <FontAwesome5 name="bath" size={20} color={palette.muted} />;
        case 'wifi': return <Feather name="wifi" size={20} color={palette.muted} />;
        case 'buffet': return <FontAwesome5 name="utensils" size={20} color={palette.muted} />;
        case 'pool': return <FontAwesome5 name="swimming-pool" size={20} color={palette.muted} />;
        case 'gym': return <FontAwesome5 name="dumbbell" size={20} color={palette.muted} />;
        case 'parking': return <FontAwesome5 name="parking" size={20} color={palette.muted} />;
        default: return <Feather name="check" size={20} color={palette.muted} />;
    }
};

const FacilityItem = ({ type, label }: Props) => {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                {getIcon(type)}
            </View>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 70, // Fixed width for consistent spacing
        height: 70,
        backgroundColor: '#fff', // White surface
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: palette.border,
    },
    iconContainer: {
        // Icons are centered by default in container
    },
    label: {
        fontSize: 11,
        color: palette.muted,
        fontWeight: '600',
    }
});

export default FacilityItem;
