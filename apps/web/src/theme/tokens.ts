/**
 * Vestara Design Tokens
 *
 * Dark-mode-first color palette used across the auth UI and dashboard.
 * Values mirror the reference design in `vestara-elite-companion`.
 */

import type { PrimaryColorMap } from './types';

// ── Base palette (immutable) ──

export const colors = {
  background: '#060B12',
  surface: '#0B111B',
  sidebar: '#0A0F18',
  card: '#111827',
  cardAlt: '#131C29',
  border: '#1F2937',

  gold: '#D8A441',
  goldHover: '#E5B957',
  goldSoft: 'rgba(216, 164, 65, 0.12)',

  text: '#F8FAFC',
  secondary: '#94A3B8',
  muted: '#64748B',

  success: '#22C55E',
  successSoft: 'rgba(34, 197, 94, 0.14)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245, 158, 11, 0.14)',
  error: '#EF4444',
  errorSoft: 'rgba(239, 68, 68, 0.14)',
  info: '#3B82F6',
  infoSoft: 'rgba(59, 130, 246, 0.14)',
} as const;

export const chartPalette = [
  '#D8A441',
  '#8B5CF6',
  '#3B82F6',
  '#22C55E',
  '#EF4444',
  '#64748B',
];

export const statusStyles: Record<string, { color: string; bg: string }> = {
  Confirmed: { color: colors.success, bg: colors.successSoft },
  Completed: { color: colors.success, bg: colors.successSoft },
  Pending: { color: colors.warning, bg: colors.warningSoft },
  Scheduled: { color: colors.info, bg: colors.infoSoft },
  Cancelled: { color: colors.error, bg: colors.errorSoft },
};

// ── Primary colour definitions ──

export const primaryColors: PrimaryColorMap = {
  gold: {
    light: '#E5B957',
    main: '#D8A441',
    dark: '#B8892E',
    contrastText: '#0A0F18',
  },
  blue: {
    light: '#60A5FA',
    main: '#3B82F6',
    dark: '#2563EB',
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
    main: '#22C55E',
    dark: '#16A34A',
    contrastText: '#FFFFFF',
  },
  red: {
    light: '#F87171',
    main: '#EF4444',
    dark: '#DC2626',
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
