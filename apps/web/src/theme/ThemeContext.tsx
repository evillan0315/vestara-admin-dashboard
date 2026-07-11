/**
 * Global Theme Context
 *
 * Provides the full ThemeConfig and setters to the entire application.
 * Persists user preferences to localStorage and detects system colour
 * scheme when mode is "system".
 */

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type {
  ThemeConfig,
  ThemeContextValue,
  ThemePrimaryColor,
  ThemeDensity,
  ThemeFontFamily,
  SidebarVariant,
} from './types';
import { THEME_STORAGE_KEY } from './types';

// ── Default configuration ──

const DEFAULT_CONFIG: ThemeConfig = {
  mode: 'dark',
  resolvedMode: 'dark',
  primaryColor: 'gold',
  density: 'comfortable',
  fontFamily: 'inter',
  sidebarCollapsed: false,
  sidebarVariant: 'default',
  fontSizeScale: 1,
  borderRadiusScale: 1,
  contrastLevel: 'normal',
};

// ── Load persisted config ──

function loadConfig(): ThemeConfig {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<ThemeConfig>;
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch {
    // Ignore corrupt storage
  }
  return DEFAULT_CONFIG;
}

// ── Persist ──

function persistConfig(config: ThemeConfig): void {
  try {
    const { resolvedMode: _, ...persistable } = config; // eslint-disable-line @typescript-eslint/no-unused-vars
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(persistable));
  } catch {
    // Storage may be unavailable
  }
}

// ── Resolve "system" to actual mode ──

function resolveMode(mode: ThemeConfig['mode']): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

// ── Context ──

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ── Provider ──

interface ThemeContextProviderProps {
  children: ReactNode;
}

export function ThemeContextProvider({ children }: ThemeContextProviderProps) {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const loaded = loadConfig();
    return { ...loaded, resolvedMode: resolveMode(loaded.mode) };
  });

  const [settingsOpen, setSettingsOpen] = useState(false);

  // Listen for system colour scheme changes when mode === "system"
  useEffect(() => {
    if (config.mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      setConfig((prev) => ({ ...prev, resolvedMode: resolveMode('system') }));
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [config.mode]);

  // Persist whenever config changes (skip resolvedMode)
  useEffect(() => {
    persistConfig(config);
  }, [config]);

  // ── Setters ──

  const setMode = useCallback((mode: ThemeConfig['mode']) => {
    setConfig((prev) => ({ ...prev, mode, resolvedMode: resolveMode(mode) }));
  }, []);

  const toggleTheme = useCallback(() => {
    setConfig((prev) => {
      const newMode = prev.resolvedMode === 'dark' ? 'light' : 'dark';
      return { ...prev, mode: newMode, resolvedMode: newMode };
    });
  }, []);

  const setPrimaryColor = useCallback((primaryColor: ThemePrimaryColor) => {
    setConfig((prev) => ({ ...prev, primaryColor }));
  }, []);

  const setDensity = useCallback((density: ThemeDensity) => {
    setConfig((prev) => ({ ...prev, density }));
  }, []);

  const setFontFamily = useCallback((fontFamily: ThemeFontFamily) => {
    setConfig((prev) => ({ ...prev, fontFamily }));
  }, []);

  const setSidebarCollapsed = useCallback((sidebarCollapsed: boolean) => {
    setConfig((prev) => ({ ...prev, sidebarCollapsed }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setConfig((prev) => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  }, []);

  const setSidebarVariant = useCallback((sidebarVariant: SidebarVariant) => {
    setConfig((prev) => ({ ...prev, sidebarVariant }));
  }, []);

  const setFontSizeScale = useCallback((fontSizeScale: number) => {
    setConfig((prev) => ({ ...prev, fontSizeScale }));
  }, []);

  const setBorderRadiusScale = useCallback((borderRadiusScale: number) => {
    setConfig((prev) => ({ ...prev, borderRadiusScale }));
  }, []);

  const setContrastLevel = useCallback((contrastLevel: ThemeConfig['contrastLevel']) => {
    setConfig((prev) => ({ ...prev, contrastLevel }));
  }, []);

  const resetTheme = useCallback(() => {
    setConfig({ ...DEFAULT_CONFIG, resolvedMode: resolveMode(DEFAULT_CONFIG.mode) });
    localStorage.removeItem(THEME_STORAGE_KEY);
  }, []);

  const toggleSettings = useCallback(() => {
    setSettingsOpen((prev) => !prev);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...config,
      toggleTheme,
      setMode,
      setPrimaryColor,
      setDensity,
      setFontFamily,
      setSidebarCollapsed,
      toggleSidebar,
      setSidebarVariant,
      setFontSizeScale,
      setBorderRadiusScale,
      setContrastLevel,
      resetTheme,
      settingsOpen,
      setSettingsOpen,
      toggleSettings,
    }),
    [config, settingsOpen, toggleTheme, setMode, setPrimaryColor, setDensity,
     setFontFamily, setSidebarCollapsed, toggleSidebar, setSidebarVariant,
     setFontSizeScale, setBorderRadiusScale, setContrastLevel, resetTheme,
     toggleSettings],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Hook ──

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeContextProvider');
  }
  return context;
}
