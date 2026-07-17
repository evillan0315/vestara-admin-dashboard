/**
 * useSidebarConfig
 *
 * Resolves theme context (density, variant, collapsed, font scale, contrast)
 * into concrete CSS values that the Sidebar consumes.  This keeps the Sidebar
 * itself free of layout math.
 */

import { useTheme } from '@mui/material';
import { useThemeContext } from '../../providers/ThemeProvider';
import { densitySpacing, type DensitySpacing } from '../../theme/tokens';

export interface SidebarConfig {
  /** Final sidebar width in px (collapsed or expanded). */
  width: number;
  /** Whether to render only icons (no labels / group titles). */
  iconOnly: boolean;
  /** Whether the sidebar should be completely hidden. */
  hidden: boolean;
  /** Font-size multiplier from user preference. */
  fontScale: number;
  /** Border-radius multiplier from user preference. */
  borderRadiusScale: number;
  /** Resolved density spacing values. */
  spacing: DensitySpacing;
  /** Primary text colour – boosted when contrastLevel is high. */
  textPrimary: string;
  /** Muted text colour. */
  textMuted: string;
  /** Divider / border colour. */
  divider: string;
  /** Sidebar background – resolved from MUI palette. */
  sidebarBg: string;
  /** Card / elevated surface background. */
  cardBg: string;
  /** Whether we are in dark mode. */
  isDark: boolean;
}

export function useSidebarConfig(): SidebarConfig {
  const theme = useTheme();
  const {
    density,
    sidebarVariant,
    sidebarCollapsed,
    fontSizeScale,
    borderRadiusScale,
    contrastLevel,
  } = useThemeContext();

  const spacing = densitySpacing[density];
  const isDark = theme.palette.mode === 'dark';
  const iconOnly = sidebarCollapsed || sidebarVariant === 'compact';
  const hidden = sidebarVariant === 'hidden';

  const width = sidebarCollapsed ? spacing.sidebarCollapsedWidth : spacing.sidebarWidth;

  // Boost text opacity in high-contrast mode
  const textPrimary =
    contrastLevel === 'high'
      ? theme.palette.text.primary
      : isDark
        ? 'rgba(232,232,237,0.87)'
        : 'rgba(30,30,35,0.87)';

  const textMuted =
    contrastLevel === 'high' ? theme.palette.text.secondary : theme.palette.text.disabled;

  return {
    width,
    iconOnly,
    hidden,
    fontScale: fontSizeScale,
    borderRadiusScale,
    spacing,
    textPrimary,
    textMuted,
    divider: theme.palette.divider,
    sidebarBg: theme.palette.background.paper,
    cardBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    isDark,
  };
}
