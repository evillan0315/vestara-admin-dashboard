/**
 * Root Theme Provider
 *
 * Wraps the app in:
 *  1. ThemeContextProvider (state & logic)
 *  2. MUI ThemeProvider (material theme derived from config)
 *  3. CssBaseline (normalize + base styles)
 *
 * Re-exports useThemeContext for convenience.
 */

import { type ReactNode, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { ThemeContextProvider, useThemeContext } from '../theme/ThemeContext';
import { createAppTheme } from '../styles/theme';

// ── Inner component that reads context ──

interface InnerProps {
  children: ReactNode;
}

function ThemedApp({ children }: InnerProps) {
  const config = useThemeContext();

  const theme = useMemo(() => createAppTheme(config), [
    config.resolvedMode,
    config.primaryColor,
    config.density,
    config.fontFamily,
    config.fontSizeScale,
    config.borderRadiusScale,
    config.contrastLevel,
  ]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

// ── Outer provider ──

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ThemeContextProvider>
      <ThemedApp>{children}</ThemedApp>
    </ThemeContextProvider>
  );
}

export { useThemeContext } from '../theme/ThemeContext';
