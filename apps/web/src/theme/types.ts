/**
 * Theme types — configuration surface for the global theme system.
 *
 * Every setting can be persisted to localStorage and restored on reload.
 */

// ── Colour primaries the user can choose from ──

export type ThemePrimaryColor =
  | 'gold' // Vestara signature gold (#D8A441)
  | 'blue' // Professional blue (#3B82F6)
  | 'purple' // Royal purple (#8B5CF6)
  | 'green' // Emerald (#22C55E)
  | 'red' // Ruby (#EF4444)
  | 'indigo' // Indigo (#6366F1)
  | 'teal'; // Teal (#14B8A6)

// ── Density / layout spacing ──

export type ThemeDensity = 'compact' | 'comfortable' | 'spacious';

// ── Font family options ──

export type ThemeFontFamily = 'inter' | 'plus-jakarta-sans' | 'roboto' | 'system';

// ── Sidebar variant ──

export type SidebarVariant = 'default' | 'compact' | 'hidden';

// ── Full theme configuration ──

export interface ThemeConfig {
  /** Light / dark / system-follow */
  mode: 'light' | 'dark' | 'system';
  /** Resolved effective mode (never "system") */
  resolvedMode: 'light' | 'dark';
  /** Accent colour */
  primaryColor: ThemePrimaryColor;
  /** Layout density */
  density: ThemeDensity;
  /** Font family preset */
  fontFamily: ThemeFontFamily;
  /** Sidebar collapsed state */
  sidebarCollapsed: boolean;
  /** Sidebar variant */
  sidebarVariant: SidebarVariant;
  /** Font size scaling factor (0.875 – 1.125) */
  fontSizeScale: number;
  /** Border radius multiplier (0.5 – 2) */
  borderRadiusScale: number;
  /** Contrast level */
  contrastLevel: 'normal' | 'high';
  /** Maintenance mode enabled */
  maintenanceMode: boolean;
}

// ── Context value (extends config with actions) ──

export interface ThemeContextValue extends ThemeConfig {
  toggleTheme: () => void;
  setMode: (mode: ThemeConfig['mode']) => void;
  setPrimaryColor: (color: ThemePrimaryColor) => void;
  setDensity: (density: ThemeDensity) => void;
  setFontFamily: (font: ThemeFontFamily) => void;
  setFontWeight: (weight: 'light' | 'normal' | 'medium' | 'semibold' | 'bold') => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setSidebarVariant: (variant: SidebarVariant) => void;
  setFontSizeScale: (scale: number) => void;
  setBorderRadiusScale: (scale: number) => void;
  setContrastLevel: (level: ThemeConfig['contrastLevel']) => void;
  resetTheme: () => void;
  /** Whether the theme settings drawer is open */
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  toggleSettings: () => void;
}

// ── Primary colour palette map ──

export interface PrimaryColorPalette {
  light: string;
  main: string;
  dark: string;
  contrastText: string;
}

export type PrimaryColorMap = Record<ThemePrimaryColor, PrimaryColorPalette>;

// ── Storage key ──

export const THEME_STORAGE_KEY = 'vestara-theme-config';
