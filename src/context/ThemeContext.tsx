import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, ThemeName, predefinedThemes } from '../utils/theme';

interface ThemeContextType {
  themeName: ThemeName;
  colors: ThemeColors;
  setTheme: (name: ThemeName) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeState] = useState<ThemeName>('dark-gold');

  useEffect(() => {
    // Load saved theme on startup
    AsyncStorage.getItem('@dhikr_theme').then((saved) => {
      if (saved && saved in predefinedThemes) {
        setThemeState(saved as ThemeName);
      }
    });
  }, []);

  const setTheme = async (name: ThemeName) => {
    setThemeState(name);
    await AsyncStorage.setItem('@dhikr_theme', name);
  };

  return (
    <ThemeContext.Provider value={{ themeName, colors: predefinedThemes[themeName], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within AppThemeProvider');
  return ctx;
}
