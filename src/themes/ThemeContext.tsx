import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeId, ThemeLabels } from './types';
import { akashicTheme } from './akashic';
import { tenebraluxTheme } from './tenebralux';

const THEMES: Record<ThemeId, ThemeLabels> = {
  akashic: akashicTheme,
  tenebralux: tenebraluxTheme,
};

const STORAGE_KEY = 'tenebralux_active_theme';

interface ThemeContextType {
  activeTheme: ThemeId;
  setActiveTheme: (theme: ThemeId) => void;
  labels: ThemeLabels;
  themes: typeof THEMES;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [activeTheme, setActiveThemeState] = useState<ThemeId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'akashic' || saved === 'tenebralux') {
        return saved;
      }
    }
    return 'tenebralux'; // Default theme
  });
  
  const setActiveTheme = (theme: ThemeId) => {
    setActiveThemeState(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  };
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeTheme);
  }, [activeTheme]);
  
  const value: ThemeContextType = {
    activeTheme,
    setActiveTheme,
    labels: THEMES[activeTheme],
    themes: THEMES,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export function useLabels() {
  const { labels } = useTheme();
  return labels;
}
