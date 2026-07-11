/**
 * MUI theme factory — generates a full ThemeOptions object based on the
 * user's ThemeConfig (mode, primary colour, density, font family, etc.).
 */

import { createTheme, type Theme, type ThemeOptions } from '@mui/material/styles';
import type { ThemeConfig } from '../theme/types';
import { primaryColors, densitySpacing, fontFamilyValues } from '../theme/tokens';

// ── Dark & light background palettes ──

const darkBackground = {
  default: '#060B12',
  paper: '#111827',
  card: '#0B111B',
  sidebar: '#0A0F18',
};

const lightBackground = {
  default: '#F8FAFC',
  paper: '#FFFFFF',
  card: '#F1F5F9',
  sidebar: '#FFFFFF',
};

// ── Dark & light text palettes ──

const darkText = {
  primary: '#F1F5F9',
  secondary: '#94A3B8',
  disabled: '#475569',
};

const lightText = {
  primary: '#0F172A',
  secondary: '#475569',
  disabled: '#94A3B8',
};

// ── Divider colours ──

const darkDivider = '#1F2937';
const lightDivider = '#E2E8F0';

// ── Factory ──

export function createAppTheme(config: ThemeConfig): Theme {
  const isDark = config.resolvedMode === 'dark';

  const bg = isDark ? darkBackground : lightBackground;
  const text = isDark ? darkText : lightText;
  const divider = isDark ? darkDivider : lightDivider;
  const primary = primaryColors[config.primaryColor];
  const density = densitySpacing[config.density];
  const fontFamily = fontFamilyValues[config.fontFamily];
  const scale = config.fontSizeScale;

  // Maintenance mode styles
  const maintenanceStyles = config.maintenanceMode
    ? {
        '&::before': {
          content: '"MAINTENANCE"',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: '#FFFFFF',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          fontWeight: '700',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          animation: 'fadeIn 0.5s ease-in-out',
        },
        '@keyframes fadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }
    : {};

  const options: ThemeOptions = {
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: primary.main,
        light: primary.light,
        dark: primary.dark,
        contrastText: primary.contrastText,
      },
      secondary: {
        main: '#8B5CF6',
        light: '#A78BFA',
        dark: '#7C3AED',
        contrastText: '#FFFFFF',
      },
      error: {
        main: '#EF4444',
        light: '#F87171',
        dark: '#DC2626',
      },
      warning: {
        main: '#F59E0B',
        light: '#FBBF24',
        dark: '#D97706',
      },
      success: {
        main: '#22C55E',
        light: '#4ADE80',
        dark: '#16A34A',
      },
      info: {
        main: '#3B82F6',
        light: '#60A5FA',
        dark: '#2563EB',
      },
      background: {
        default: bg.default,
        paper: bg.paper,
      },
      text,
      divider,
      ...(config.contrastLevel === 'high' && isDark
        ? {
            tonalOffset: 0.2,
            contrastThreshold: 7,
          }
        : {}),
    },

    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: density.borderRadius,
            padding: density.padding === 1.5 ? '6px 16px' : density.padding === 2 ? '8px 20px' : '10px 24px',
            fontWeight: 600,
          },
          containedPrimary: {
            '&:hover': {
              boxShadow: `0 4px 14px 0 ${primary.main}40`,
            },
          },
        },
        defaultProps: {
          disableElevation: true,
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: density.borderRadius + 4,
            border: `1px solid ${divider}`,
            boxShadow: 'none',
            backgroundImage: 'none',
            ...(config.maintenanceMode && {
              opacity: 0.5,
              pointerEvents: 'none',
              '&::after': {
                content: '"MAINTENANCE MODE"',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(239, 68, 68, 0.9)',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                zIndex: 10,
              },
            }),
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            ...(config.maintenanceMode && {
              position: 'relative',
              overflow: 'hidden',
            }),
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: density.borderRadius + 4,
            ...(config.maintenanceMode && {
              '&::before': {
                content: '"MAINTENANCE"',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '600',
                color: '#EF4444',
                zIndex: 1,
              },
            }),
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: density.borderRadius,
            ...(config.maintenanceMode && {
              backgroundColor: config.maintenanceMode
                ? '#EF4444' + '20'
                : undefined,
              color: config.maintenanceMode ? '#EF4444' : undefined,
            }),
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: density.padding === 1.5 ? '8px 12px' : density.padding === 2 ? '12px 16px' : '16px 20px',
            ...(config.maintenanceMode && {
              color: config.maintenanceMode ? '#94A3B8' + '80' : undefined,
            }),
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: density.borderRadius - 2,
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: isDark ? '#334155 #0B111B' : '#CBD5E1 #F8FAFC',
            ...(config.maintenanceMode && {
              overflow: 'hidden',
            }),
          },
        },
      },
    },

    typography: {
      fontFamily,
      fontSize: Math.round(14 * scale),
      h1: { fontWeight: 700, fontSize: fontSize(32) },
      h2: { fontWeight: 700, fontSize: fontSize(28) },
      h3: { fontWeight: 600, fontSize: fontSize(24) },
      h4: { fontWeight: 600, fontSize: fontSize(20) },
      h5: { fontWeight: 600, fontSize: fontSize(18) },
      h6: { fontWeight: 600, fontSize: fontSize(16) },
      body1: { fontSize: fontSize(14) },
      body2: { fontSize: fontSize(13) },
      caption: { fontSize: fontSize(12) },
      button: { textTransform: 'none', fontWeight: 600, fontSize: fontSize(14) },
    },

    shape: {
      borderRadius: config.borderRadiusScale > 1
        ? Math.round(density.borderRadius * config.borderRadiusScale)
        : density.borderRadius,
    },

    spacing: (factor: number) => `${factor * (density.padding === 1.5 ? 8 : density.padding === 2 ? 8 : 8)}px`,

    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: density.borderRadius,
            padding: density.padding === 1.5 ? '6px 16px' : density.padding === 2 ? '8px 20px' : '10px 24px',
            fontWeight: 600,
          },
          containedPrimary: {
            '&:hover': {
              boxShadow: `0 4px 14px 0 ${primary.main}40`,
            },
          },
        },
        defaultProps: {
          disableElevation: true,
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: density.borderRadius + 4,
            border: `1px solid ${divider}`,
            boxShadow: 'none',
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: density.borderRadius + 4,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: density.borderRadius,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: density.padding === 1.5 ? '8px 12px' : density.padding === 2 ? '12px 16px' : '16px 20px',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: density.borderRadius - 2,
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: isDark ? '#334155 #0B111B' : '#CBD5E1 #F8FAFC',
          },
        },
      },
    },
  };

  return createTheme(options);
}
