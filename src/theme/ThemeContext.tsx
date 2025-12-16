import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, ThemeColors } from './colors';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: ThemeColors;
    mode: ThemeMode;
    isDark: boolean;
    setMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const systemScheme = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>('system');

    useEffect(() => {
        // Persistence would go here
    }, []);

    const setMode = (newMode: ThemeMode) => {
        setModeState(newMode);
    };

    const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
    const theme = isDark ? darkTheme : lightTheme;

    const toggleTheme = () => {
        setMode(isDark ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, mode, isDark, setMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
