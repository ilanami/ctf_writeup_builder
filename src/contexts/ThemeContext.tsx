"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';

export type AppTheme = 'hacker' | 'dark' | 'light';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'hacker',
  setTheme: () => {},
});

const VALID_THEMES: AppTheme[] = ['hacker', 'dark', 'light'];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>('hacker');

  // Read from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.theme);
      if (saved && VALID_THEMES.includes(saved as AppTheme)) {
        setThemeState(saved as AppTheme);
      }
    } catch {
      // localStorage unavailable, keep default
    }
  }, []);

  // Sync data-theme attribute and persist to localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEYS.theme, theme);
    } catch {
      // localStorage unavailable or full
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: AppTheme) => {
    if (VALID_THEMES.includes(newTheme)) {
      setThemeState(newTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);