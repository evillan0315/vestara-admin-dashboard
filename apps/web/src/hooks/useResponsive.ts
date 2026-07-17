/**
 * useResponsive
 *
 * Shared responsive breakpoint hook.
 * Wraps MUI's useMediaQuery + useTheme into a single call that returns
 * boolean flags for common viewport categories.
 *
 * Breakpoints (MUI defaults):
 *   xs: 0–599px   → Phone portrait
 *   sm: 600–899px → Phone landscape / small tablet
 *   md: 900–1199px→ Tablet
 *   lg: 1200+     → Desktop
 */

import { useTheme, useMediaQuery } from '@mui/material';

export interface ResponsiveFlags {
  /** true when viewport < 600px (phone portrait) */
  isXs: boolean;
  /** true when viewport >= 600px and < 900px */
  isSm: boolean;
  /** true when viewport >= 900px and < 1200px */
  isMd: boolean;
  /** true when viewport >= 1200px */
  isLg: boolean;
  /** alias for isXs */
  isMobile: boolean;
  /** true on sm + md */
  isTablet: boolean;
  /** alias for isLg */
  isDesktop: boolean;
}

export function useResponsive(): ResponsiveFlags {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isLg = useMediaQuery(theme.breakpoints.up('lg'));

  return {
    isXs,
    isSm,
    isMd,
    isLg,
    isMobile: isXs,
    isTablet: isSm || isMd,
    isDesktop: isLg,
  };
}
