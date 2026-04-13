import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { KumiteTheme, KumiteThemeDark } from '../constants/theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggle: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggle: () => {},
  isDark: false,
});

const STORAGE_KEY = 'kumite-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (stored === 'dark' || stored === 'light') setMode(stored);
    } catch {
      // localStorage unavailable (SSR)
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const dark = mode === 'dark';
    document.documentElement.classList.toggle('dark', dark);
    // Paint the full-page background so the area outside of cards also changes
    document.body.style.background = dark ? KumiteThemeDark.colors.background : KumiteTheme.colors.background;
    document.body.style.color      = dark ? KumiteThemeDark.colors.text       : KumiteTheme.colors.text;
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {}
  }, [mode]);

  const toggle = useCallback(() => {
    setMode(m => (m === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, toggle, isDark: mode === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Returns the KumiteTheme token set for the current mode.
 * Drop-in replacement for `KumiteTheme as T` static imports:
 *   import { useKumiteTheme } from '../../context/ThemeContext';
 *   const T = useKumiteTheme();
 */
export function useKumiteTheme() {
  const { isDark } = useTheme();
  return isDark ? KumiteThemeDark : KumiteTheme;
}

// ── Color palettes from AI stitch designs ────────────────────────────────────

export const aiTheme = {
  light: {
    background:          '#f5f6f7',
    surface:             '#ffffff',
    surfaceContainer:    '#e6e8ea',
    surfaceContainerLow: '#eff1f2',
    primary:             '#5949be',
    onPrimary:           '#f5f0ff',
    primaryContainer:    '#9f93ff',
    onSurface:           '#2c2f30',
    onSurfaceVariant:    '#595c5d',
    secondaryContainer:  '#dcc9ff',
    onSecondaryContainer:'#543099',
    outline:             '#757778',
    outlineVariant:      '#abadae',
    error:               '#b41340',
    errorContainer:      '#fce8e6',
    success:             '#2e7d32',
    successContainer:    '#e8f5e9',
  },
  dark: {
    background:          '#10141a',
    surface:             '#1c2026',
    surfaceContainer:    '#262a31',
    surfaceContainerLow: '#181c22',
    primary:             '#c7bfff',
    onPrimary:           '#2c1092',
    primaryContainer:    '#4331a8',
    onSurface:           '#dfe2eb',
    onSurfaceVariant:    '#c9c4d5',
    secondaryContainer:  '#3f2e00',
    onSecondaryContainer:'#ffdf9e',
    outline:             '#928f9e',
    outlineVariant:      '#474553',
    error:               '#ffb4ab',
    errorContainer:      '#93000a',
    success:             '#81c784',
    successContainer:    '#1b5e20',
  },
} as const;
