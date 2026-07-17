/**
 * MUI theme factory — generates a full ThemeOptions object based on the
 * user's ThemeConfig (mode, primary colour, density, font family, etc.).
 *
 * Design philosophy:
 *  - Dark luxury aesthetic with rich gold accents
 *  - Near-black backgrounds for maximum contrast
 *  - Subtle borders that don't distract from content
 *  - Clean typography hierarchy with Inter + Plus Jakarta Sans
 *  - Consistent spacing and border-radius scaling
 */

import { createTheme, type Theme, type ThemeOptions } from '@mui/material/styles';
import type { ThemeConfig } from '../theme/types';
import { primaryColors, densitySpacing, fontFamilyValues, shadows } from '../theme/tokens';

// ── Dark & light background palettes ──

const darkBackground = {
  default: '#0D0F12', // Main content — near-black
  paper: '#151923', // Elevated surfaces (cards, dialogs)
  card: '#111419', // Card base
  sidebar: '#0F1219', // Sidebar panel
  input: '#1A1F2B', // Input fields
  hover: '#1A1F2B', // Hover states
  selected: '#1E2533', // Selected/active states
};

const lightBackground = {
  default: '#F8FAFC',
  paper: '#FFFFFF',
  card: '#F1F5F9',
  sidebar: '#FFFFFF',
  input: '#F1F5F9',
  hover: '#F1F5F9',
  selected: '#E2E8F0',
};

// ── Dark & light text palettes ──

const darkText = {
  primary: '#E8E8ED', // Off-white, not pure white
  secondary: '#7A7F8E', // Muted gray
  disabled: '#3A3F4C', // Very muted
};

const lightText = {
  primary: '#0F172A',
  secondary: '#475569',
  disabled: '#94A3B8',
};

// ── Divider colours ──

const darkDivider = '#1E2533';
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

  // Scale a base font size (px) by the user's font-size preference.
  const scaleFontSize = (px: number): number => Math.round(px * scale);

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
        main: '#DA3743',
        light: '#F87171',
        dark: '#B82D38',
      },
      warning: {
        main: '#D4A843',
        light: '#DFBA5A',
        dark: '#B8933A',
      },
      success: {
        main: '#2EA043',
        light: '#4ADE80',
        dark: '#1A8A32',
      },
      info: {
        main: '#4A90D9',
        light: '#6BA3D9',
        dark: '#3678B8',
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
      // ── CssBaseline ──
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: isDark ? '#2A3040 #0D0F12' : '#CBD5E1 #F8FAFC',
            ...(config.maintenanceMode && {
              overflow: 'hidden',
            }),
          },
          '*, *::before, *::after': {
            scrollbarWidth: 'thin',
            scrollbarColor: isDark ? '#2A3040 #0D0F12' : '#CBD5E1 #F8FAFC',
          },
          '::-webkit-scrollbar': {
            width: 6,
            height: 6,
          },
          '::-webkit-scrollbar-track': {
            background: isDark ? '#0D0F12' : '#F8FAFC',
          },
          '::-webkit-scrollbar-thumb': {
            background: isDark ? '#2A3040' : '#CBD5E1',
            borderRadius: 3,
            '&:hover': {
              background: isDark ? '#3A4050' : '#94A3B8',
            },
          },
        },
      },

      // ── Typography globals ──
      MuiTypography: {
        defaultProps: {
          variantMapping: {
            h1: 'h1',
            h2: 'h2',
            h3: 'h3',
            h4: 'h4',
            h5: 'h5',
            h6: 'h6',
            subtitle1: 'h6',
            subtitle2: 'h6',
            body1: 'p',
            body2: 'p',
            caption: 'span',
            overline: 'span',
            button: 'span',
          },
        },
      },

      // ── Button ──
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: density.borderRadius,
            padding:
              density.padding === 1.5
                ? '6px 16px'
                : density.padding === 2
                  ? '8px 20px'
                  : '10px 24px',
            fontWeight: 600,
            fontSize: scaleFontSize(14),
            letterSpacing: '0.01em',
            textTransform: 'none' as const,
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          },
          containedPrimary: {
            '&:hover': {
              boxShadow: `0 4px 14px 0 ${primary.main}40`,
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          outlinedPrimary: {
            borderWidth: 1.5,
            '&:hover': {
              borderWidth: 1.5,
              backgroundColor: `${primary.main}10`,
            },
          },
          textPrimary: {
            '&:hover': {
              backgroundColor: `${primary.main}10`,
            },
          },
          containedError: {
            '&:hover': {
              boxShadow: '0 4px 14px 0 rgba(218, 55, 67, 0.3)',
            },
          },
          sizeSmall: {
            fontSize: scaleFontSize(12),
            padding: '4px 12px',
          },
          sizeLarge: {
            fontSize: scaleFontSize(16),
            padding: '10px 28px',
          },
        },
        defaultProps: {
          disableElevation: true,
        },
      },

      // ── Card ──
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: density.borderRadius + 4,
            border: `1px solid ${divider}`,
            boxShadow: 'none',
            backgroundImage: 'none',
            backgroundColor: isDark ? darkBackground.paper : lightBackground.paper,
            transition: 'border-color 200ms ease, box-shadow 200ms ease',
            '&:hover': {
              borderColor: isDark ? '#252D3A' : '#CBD5E1',
            },
            ...(config.maintenanceMode && {
              opacity: 0.5,
              pointerEvents: 'none',
              '&::after': {
                content: '"MAINTENANCE MODE"',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(218, 55, 67, 0.9)',
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

      // ── Paper ──
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? darkBackground.paper : lightBackground.paper,
            ...(config.maintenanceMode && {
              position: 'relative',
              overflow: 'hidden',
            }),
          },
          outlined: {
            border: `1px solid ${divider}`,
          },
        },
      },

      // ── Dialog ──
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: density.borderRadius + 4,
            border: `1px solid ${divider}`,
            boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : undefined,
            ...(config.maintenanceMode && {
              '&::before': {
                content: '"MAINTENANCE"',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(218, 55, 67, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '600',
                color: '#DA3743',
                zIndex: 1,
              },
            }),
          },
        },
      },

      // ── Chip ──
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: density.borderRadius,
            fontWeight: 600,
            fontSize: scaleFontSize(12),
            ...(config.maintenanceMode && {
              backgroundColor: config.maintenanceMode ? '#DA374320' : undefined,
              color: config.maintenanceMode ? '#DA3743' : undefined,
            }),
          },
          filled: {
            backgroundColor: isDark ? '#1A1F2B' : '#F1F5F9',
          },
          outlined: {
            borderWidth: 1,
          },
          sizeSmall: {
            height: 22,
            fontSize: scaleFontSize(11),
          },
        },
      },

      // ── Table ──
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding:
              density.padding === 1.5
                ? '8px 12px'
                : density.padding === 2
                  ? '12px 16px'
                  : '16px 20px',
            borderColor: divider,
            fontSize: scaleFontSize(13),
            ...(config.maintenanceMode && {
              color: config.maintenanceMode ? '#7A7F8E80' : undefined,
            }),
          },
          head: {
            fontWeight: 700,
            fontSize: scaleFontSize(12),
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            color: isDark ? '#7A7F8E' : '#475569',
          },
        },
      },

      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#0D0F12' : '#F8FAFC',
          },
        },
      },

      MuiTableBody: {
        styleOverrides: {
          root: {
            '& tr:hover': {
              backgroundColor: isDark ? '#1A1F2B10' : '#F1F5F9',
            },
          },
        },
      },

      // ── Tooltip ──
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: density.borderRadius - 2,
            backgroundColor: isDark ? '#1A1F2B' : '#0F172A',
            fontSize: scaleFontSize(12),
            fontWeight: 500,
            padding: '6px 12px',
            boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.4)' : undefined,
          },
          arrow: {
            color: isDark ? '#1A1F2B' : '#0F172A',
          },
        },
      },

      // ── TextField ──
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: density.borderRadius,
              backgroundColor: isDark ? '#1A1F2B' : '#F1F5F9',
              transition: 'border-color 200ms ease, box-shadow 200ms ease',
              '& fieldset': {
                borderColor: isDark ? '#252D3A' : '#E2E8F0',
              },
              '&:hover fieldset': {
                borderColor: isDark ? '#3A4050' : '#CBD5E1',
              },
              '&.Mui-focused fieldset': {
                borderColor: primary.main,
                borderWidth: 1.5,
              },
              '&.Mui-focused': {
                boxShadow: `0 0 0 3px ${primary.main}20`,
              },
            },
          },
        },
      },

      // ── Select ──
      MuiSelect: {
        styleOverrides: {
          root: {
            borderRadius: density.borderRadius,
          },
        },
      },

      // ── OutlinedInput ──
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: density.borderRadius,
            backgroundColor: isDark ? '#1A1F2B' : '#F1F5F9',
          },
        },
      },

      // ── InputBase ──
      MuiInputBase: {
        styleOverrides: {
          root: {
            fontSize: scaleFontSize(14),
          },
        },
      },

      // ── ListItemButton ──
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: density.borderRadius,
            transition: 'background-color 150ms ease',
            '&.Mui-selected': {
              backgroundColor: isDark ? `${primary.main}15` : `${primary.main}10`,
              '&:hover': {
                backgroundColor: isDark ? `${primary.main}20` : `${primary.main}15`,
              },
            },
          },
        },
      },

      // ── Tab ──
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none' as const,
            fontWeight: 600,
            fontSize: scaleFontSize(13),
            minHeight: 44,
            transition: 'color 200ms ease, border-color 200ms ease',
          },
        },
      },

      // ── Tabs ──
      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: primary.main,
            height: 2,
            borderRadius: '1px 1px 0 0',
          },
        },
      },

      // ── Avatar ──
      MuiAvatar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1A1F2B' : '#E2E8F0',
            color: isDark ? '#7A7F8E' : '#475569',
            fontWeight: 600,
          },
        },
      },

      // ── Badge ──
      MuiBadge: {
        styleOverrides: {
          badge: {
            fontWeight: 700,
            fontSize: 10,
          },
        },
      },

      // ── Switch ──
      MuiSwitch: {
        styleOverrides: {
          root: {
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: primary.main,
              '& + .MuiSwitch-track': {
                backgroundColor: primary.main,
              },
            },
          },
        },
      },

      // ── Checkbox ──
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: isDark ? '#3A4050' : '#94A3B8',
            '&.Mui-checked': {
              color: primary.main,
            },
          },
        },
      },

      // ── Radio ──
      MuiRadio: {
        styleOverrides: {
          root: {
            color: isDark ? '#3A4050' : '#94A3B8',
            '&.Mui-checked': {
              color: primary.main,
            },
          },
        },
      },

      // ── Divider ──
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: divider,
          },
        },
      },

      // ── LinearProgress ──
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            backgroundColor: isDark ? '#1A1F2B' : '#E2E8F0',
          },
          colorPrimary: {
            backgroundColor: primary.main,
          },
        },
      },

      // ── CircularProgress ──
      MuiCircularProgress: {
        styleOverrides: {
          colorPrimary: {
            color: primary.main,
          },
        },
      },

      // ── Alert ──
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: density.borderRadius,
            fontSize: scaleFontSize(13),
          },
          standardSuccess: {
            backgroundColor: isDark ? '#0D2818' : '#F0FDF4',
            color: isDark ? '#4ADE80' : '#16A34A',
          },
          standardError: {
            backgroundColor: isDark ? '#2D0F13' : '#FEF2F2',
            color: isDark ? '#F87171' : '#DC2626',
          },
          standardWarning: {
            backgroundColor: isDark ? '#2D2510' : '#FFFBEB',
            color: isDark ? '#DFBA5A' : '#D97706',
          },
          standardInfo: {
            backgroundColor: isDark ? '#0F1D2D' : '#EFF6FF',
            color: isDark ? '#6BA3D9' : '#2563EB',
          },
        },
      },

      // ── Snackbar ──
      MuiSnackbar: {
        styleOverrides: {
          root: {
            '& .MuiSnackbarContent-root': {
              borderRadius: density.borderRadius,
            },
          },
        },
      },

      // ── Drawer ──
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${divider}`,
          },
        },
      },

      // ── AppBar ──
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
        defaultProps: {
          elevation: 0,
        },
      },

      // ── Breadcrumb ──
      MuiBreadcrumbs: {
        styleOverrides: {
          separator: {
            color: isDark ? '#4A5060' : '#94A3B8',
          },
          li: {
            fontSize: scaleFontSize(13),
          },
        },
      },

      // ── Link ──
      MuiLink: {
        styleOverrides: {
          root: {
            transition: 'color 150ms ease',
          },
        },
      },

      // ── IconButton ──
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: density.borderRadius,
            transition: 'background-color 150ms ease, color 150ms ease',
          },
        },
      },

      // ── Skeleton ──
      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1A1F2B' : '#E2E8F0',
          },
          rectangular: {
            borderRadius: density.borderRadius,
          },
        },
      },

      // ── Popover ──
      MuiPopover: {
        styleOverrides: {
          paper: {
            borderRadius: density.borderRadius + 4,
            border: `1px solid ${divider}`,
            boxShadow: isDark ? '0 10px 25px rgba(0, 0, 0, 0.4)' : undefined,
          },
        },
      },

      // ── Menu ──
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: density.borderRadius,
            border: `1px solid ${divider}`,
            backgroundColor: isDark ? '#151923' : '#FFFFFF',
          },
        },
      },

      // ── MenuItem ──
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: scaleFontSize(13),
            borderRadius: density.borderRadius / 2,
            margin: '2px 4px',
            padding: '6px 12px',
          },
        },
      },

      // ── Accordion ──
      MuiAccordion: {
        styleOverrides: {
          root: {
            borderRadius: density.borderRadius,
            border: `1px solid ${divider}`,
            '&:before': {
              display: 'none',
            },
          },
        },
      },
    },

    typography: {
      fontFamily,
      fontSize: Math.round(14 * scale),
      h1: {
        fontWeight: 700,
        fontSize: scaleFontSize(32),
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontWeight: 700,
        fontSize: scaleFontSize(28),
        lineHeight: 1.25,
        letterSpacing: '-0.015em',
      },
      h3: {
        fontWeight: 600,
        fontSize: scaleFontSize(24),
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
      },
      h4: {
        fontWeight: 600,
        fontSize: scaleFontSize(20),
        lineHeight: 1.35,
      },
      h5: {
        fontWeight: 600,
        fontSize: scaleFontSize(18),
        lineHeight: 1.4,
      },
      h6: {
        fontWeight: 600,
        fontSize: scaleFontSize(16),
        lineHeight: 1.4,
      },
      subtitle1: {
        fontSize: scaleFontSize(15),
        fontWeight: 500,
        lineHeight: 1.5,
      },
      subtitle2: {
        fontSize: scaleFontSize(13),
        fontWeight: 600,
        lineHeight: 1.5,
      },
      body1: {
        fontSize: scaleFontSize(14),
        lineHeight: 1.6,
      },
      body2: {
        fontSize: scaleFontSize(13),
        lineHeight: 1.5,
      },
      caption: {
        fontSize: scaleFontSize(12),
        lineHeight: 1.4,
        color: isDark ? '#7A7F8E' : '#475569',
      },
      overline: {
        fontSize: scaleFontSize(11),
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        lineHeight: 1.4,
      },
      button: {
        textTransform: 'none' as const,
        fontWeight: 600,
        fontSize: scaleFontSize(14),
        letterSpacing: '0.01em',
      },
    },

    shape: {
      borderRadius:
        config.borderRadiusScale > 1
          ? Math.round(density.borderRadius * config.borderRadiusScale)
          : density.borderRadius,
    },

    spacing: (factor: number) =>
      `${factor * (density.padding === 1.5 ? 8 : density.padding === 2 ? 8 : 8)}px`,

    shadows: [
      'none',
      shadows.sm,
      shadows.sm,
      shadows.base,
      shadows.base,
      shadows.md,
      shadows.md,
      shadows.lg,
      shadows.lg,
      shadows.lg,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
      shadows.xl,
    ] as ThemeOptions['shadows'],
  };

  return createTheme(options);
}
