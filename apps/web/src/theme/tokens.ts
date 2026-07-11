/**
 * Vestara Design Tokens
 *
 * Dark-mode-first color palette used across the auth UI and can be
 * extended for the rest of the dashboard.  Values mirror the reference
 * design in `vestara-elite-companion`.
 */
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
