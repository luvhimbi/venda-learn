import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchThemeSettings } from '../services/dataCache';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeSettings {
    primaryColor: string;
    bgPrimary: string;
    bgSecondary: string;
    fontFamily: string;
}

const defaultTheme: ThemeSettings = {
    primaryColor: '#f59e0b',
    bgPrimary: '#0f172a',
    bgSecondary: '#1e293b',
    fontFamily: 'Outfit, sans-serif'
};

interface ThemeContextType {
    theme: ThemeSettings;
    setTheme: (theme: ThemeSettings) => void;
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: defaultTheme,
    setTheme: () => {},
    mode: 'system',
    setMode: () => {},
    isLoading: true
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<ThemeSettings>(defaultTheme);
    const [mode, setModeState] = useState<ThemeMode>(() => {
        const stored = localStorage.getItem('theme_mode');
        return (stored as ThemeMode) || 'system';
    });
    const [isLoading, setIsLoading] = useState(true);

    // Load Database Theme Settings (Admin-Level)
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const settings = await fetchThemeSettings();
                if (settings) {
                    setThemeState({ ...defaultTheme, ...settings });
                }
            } catch (error) {
                console.error("Failed to load theme settings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadTheme();
    }, []);

    // Handle Manual/System Mode Switching
    useEffect(() => {
        const root = document.documentElement;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = () => {
            let activeMode = mode;
            if (activeMode === 'system') {
                activeMode = mediaQuery.matches ? 'dark' : 'light';
            }

            if (activeMode === 'dark') {
                root.classList.add('dark-theme');
                root.setAttribute('data-theme', 'dark');
            } else {
                root.classList.remove('dark-theme');
                root.setAttribute('data-theme', 'light');
            }
        };

        applyTheme();

        // Listen for system changes if in system mode
        const listener = (_e: MediaQueryListEvent) => {
            if (mode === 'system') {
                applyTheme();
            }
        };

        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
    }, [mode]);

    // Apply Admin Theme CSS Variables to :root
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--game-primary', theme.primaryColor);
        root.style.setProperty('--game-bg-primary', theme.bgPrimary);
        root.style.setProperty('--game-bg-secondary', theme.bgSecondary);
        root.style.setProperty('--game-font-family', theme.fontFamily);
    }, [theme]);

    const setMode = (newMode: ThemeMode) => {
        setModeState(newMode);
        localStorage.setItem('theme_mode', newMode);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme: setThemeState, mode, setMode, isLoading }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
