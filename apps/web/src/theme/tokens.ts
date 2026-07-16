/**
 * Vestara Design Tokens
 *
 * Dark-mode-first color palette used across the auth UI and dashboard.
 * Values mirror the reference design in `vestara-elite-companion`.
 *
 * Color philosophy:
 *  - Near-black backgrounds for maximum contrast with gold accents
 *  - Rich warm gold (#D4A843) as the signature primary
 *  - Subtle borders that don't distract from content
 *  - Muted secondary text that recedes into the dark background
 */

import type { PrimaryColorMap } from './types';

// ── Base palette (immutable) ──

export const colors = {
  // ── Backgrounds ──
  background: '#0D0F12',       // Main content area — near-black
  surface: '#111419',          // Elevated surfaces (cards, dialogs)
  sidebar: '#0F1219',          // Sidebar panel — slightly warmer than background
  card: '#151923',             // Card backgrounds — subtle lift from surface
  cardAlt: '#1A1F2B',         // Alternate card background (hover, secondary cards)
  border: '#1E2533',           // Default borders — dark blue-gray, very subtle
  borderLight: '#252D3A',      // Lighter border for emphasis (hover, focus rings)

  // ── Gold (signature primary) ──
  gold: '#D4A843',             // Primary gold — rich, warm
  goldHover: '#DFBA5A',        // Gold hover — slightly brighter
  goldMuted: '#B8933A',        // Muted gold for less prominent elements
  goldSoft: 'rgba(212, 168, 67, 0.10)',  // Gold tint for backgrounds
  goldBorder: 'rgba(212, 168, 67, 0.25)', // Gold border tint

  // ── Text ──
  text: '#E8E8ED',             // Primary text — off-white, not pure white
  secondary: '#7A7F8E',        // Secondary text — muted gray
  muted: '#4A5060',            // Tertiary text — very muted
  disabled: '#3A3F4C',         // Disabled text

  // ── Status colors ──
  success: '#2EA043',          // Green — active, enabled, healthy
  successSoft: 'rgba(46, 160, 67, 0.12)',
  warning: '#D4A843',          // Warning — uses gold tone
  warningSoft: 'rgba(212, 168, 67, 0.12)',
  error: '#DA3743',            // Red — errors, destructive actions
  errorSoft: 'rgba(218, 55, 67, 0.12)',
  info: '#4A90D9',             // Blue — informational
  infoSoft: 'rgba(74, 144, 217, 0.12)',

  // ── Accent colors ──
  purple: '#8B5CF6',
  purpleSoft: 'rgba(139, 92, 246, 0.12)',
  teal: '#14B8A6',
  tealSoft: 'rgba(20, 184, 166, 0.12)',
} as const;

export const chartPalette = [
  '#D4A843', // Gold
  '#8B5CF6', // Purple
  '#4A90D9', // Blue
  '#2EA043', // Green
  '#DA3743', // Red
  '#4A5060', // Muted gray
];

export const statusStyles: Record<string, { color: string; bg: string }> = {
  Confirmed: { color: colors.success, bg: colors.successSoft },
  Completed: { color: colors.success, bg: colors.successSoft },
  Active: { color: colors.success, bg: colors.successSoft },
  Enabled: { color: colors.success, bg: colors.successSoft },
  Pending: { color: colors.gold, bg: colors.goldSoft },
  Scheduled: { color: colors.info, bg: colors.infoSoft },
  Cancelled: { color: colors.error, bg: colors.errorSoft },
  Disabled: { color: colors.muted, bg: 'rgba(74, 80, 96, 0.12)' },
};

// ── Primary colour definitions ──

export const primaryColors: PrimaryColorMap = {
  gold: {
    light: '#DFBA5A',
    main: '#D4A843',
    dark: '#B8933A',
    contrastText: '#0A0F18',
  },
  blue: {
    light: '#6BA3D9',
    main: '#4A90D9',
    dark: '#3678B8',
    contrastText: '#FFFFFF',
  },
  purple: {
    light: '#A78BFA',
    main: '#8B5CF6',
    dark: '#7C3AED',
    contrastText: '#FFFFFF',
  },
  green: {
    light: '#4ADE80',
    main: '#2EA043',
    dark: '#1A8A32',
    contrastText: '#FFFFFF',
  },
  red: {
    light: '#F87171',
    main: '#DA3743',
    dark: '#B82D38',
    contrastText: '#FFFFFF',
  },
  indigo: {
    light: '#818CF8',
    main: '#6366F1',
    dark: '#4F46E5',
    contrastText: '#FFFFFF',
  },
  teal: {
    light: '#2DD4BF',
    main: '#14B8A6',
    dark: '#0D9488',
    contrastText: '#FFFFFF',
  },
};

// ── Density spacing multipliers ──

export const densitySpacing = {
  compact: {
    sidebarWidth: 220,
    sidebarCollapsedWidth: 68,
    headerHeight: 56,
    padding: 1.5,
    gap: 1.5,
    borderRadius: 6,
  },
  comfortable: {
    sidebarWidth: 264,
    sidebarCollapsedWidth: 76,
    headerHeight: 64,
    padding: 2,
    gap: 2,
    borderRadius: 8,
  },
  spacious: {
    sidebarWidth: 300,
    sidebarCollapsedWidth: 84,
    headerHeight: 72,
    padding: 3,
    gap: 3,
    borderRadius: 12,
  },
} as const;

// ── Font family CSS values ──

export const fontFamilyValues = {
  inter: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
  'plus-jakarta-sans': '"Plus Jakarta Sans", "Inter", "Roboto", sans-serif',
  roboto: '"Roboto", "Helvetica Neue", Arial, sans-serif',
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
} as const;

// ── Font size presets (base sizes before scaling) ──

export const fontSizePresets = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
} as const;

// ── Box shadow presets ──

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
  gold: '0 4px 14px 0 rgba(212, 168, 67, 0.25)',
  goldLg: '0 10px 25px 0 rgba(212, 168, 67, 0.30)',
  inset: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
} as const;

// ── Transition presets ──

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;
