import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchThemeSettings } from '../services/dataCache';

export interface ThemeSettings {
    primaryColor: string;
    bgPrimary: string;
    bgSecondary: string;
    fontFamily: string;
}

const defaultTheme: ThemeSettings = {
    primaryColor: '#f59e0b', // var(--game-primary)
    bgPrimary: '#0f172a',    // var(--game-bg-primary)
    bgSecondary: '#1e293b',  // var(--game-bg-secondary)
    fontFamily: 'Outfit, sans-serif'
};

interface ThemeContextType {
    theme: ThemeSettings;
    setTheme: (theme: ThemeSettings) => void;
    isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: defaultTheme,
    setTheme: () => {},
    isLoading: true
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<ThemeSettings>(defaultTheme);
    const [isLoading, setIsLoading] = useState(true);

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

    // Apply CSS Variables to :root
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--game-primary', theme.primaryColor);
        // Also update variations if primary is changed
        // For simplicity, we can just apply primary
        root.style.setProperty('--game-bg-primary', theme.bgPrimary);
        root.style.setProperty('--game-bg-secondary', theme.bgSecondary);
        root.style.setProperty('--game-font-family', theme.fontFamily);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme: setThemeState, isLoading }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
