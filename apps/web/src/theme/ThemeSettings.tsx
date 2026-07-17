/**
 * ThemeSettings — a slide-in drawer panel where users can customise
 * every aspect of their theme: mode, primary colour, density, font,
 * sidebar variant, font size, border radius, and contrast.
 *
 * Accessed from the Header via a paint-roller / settings gear icon.
 */

import {
  Box,
  Drawer,
  Typography,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Slider,
  Divider,
  Button,
  styled,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  DarkMode,
  LightMode,
  SettingsSuggest as SettingsIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';
import { type ReactElement } from 'react';
import { useThemeContext } from './ThemeContext';
import { primaryColors, densitySpacing, fontFamilyValues } from './tokens';
import type { ThemePrimaryColor, ThemeDensity, ThemeFontFamily, SidebarVariant } from './types';

// ── Styled ──

const DRAWER_WIDTH = 360;

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 2.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: 64,
}));

const Section = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 2.5),
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(1.5),
}));

const ColorSwatch = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'swatchColor' && prop !== 'isActive',
})<{ swatchColor: string; isActive: boolean }>(({ theme, swatchColor, isActive }) => ({
  width: 36,
  height: 36,
  borderRadius: '50%',
  backgroundColor: swatchColor,
  cursor: 'pointer',
  border: isActive ? `3px solid ${theme.palette.common.white}` : `2px solid transparent`,
  boxShadow: isActive ? `0 0 0 2px ${swatchColor}` : 'none',
  transition: 'all 0.15s ease',
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.8125rem',
  padding: '6px 14px',
  borderRadius: '8px !important',
  border: `1px solid ${theme.palette.divider}`,
  '&.Mui-selected': {
    backgroundColor: `${theme.palette.primary.main}20`,
    color: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
  },
}));

const PreviewBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  padding: theme.spacing(1.5, 2),
  borderRadius: 8,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default,
  marginTop: theme.spacing(1),
}));

// ── Labels ──

const PRIMARY_COLOR_NAMES: Record<ThemePrimaryColor, string> = {
  gold: 'Gold',
  blue: 'Blue',
  purple: 'Purple',
  green: 'Green',
  red: 'Red',
  indigo: 'Indigo',
  teal: 'Teal',
};

const MODE_OPTIONS: { value: ThemeConfigModeLabel; label: string; icon: ReactElement }[] = [
  { value: 'light', label: 'Light', icon: <LightMode sx={{ fontSize: 18 }} /> },
  { value: 'dark', label: 'Dark', icon: <DarkMode sx={{ fontSize: 18 }} /> },
  { value: 'system', label: 'System', icon: <SettingsIcon sx={{ fontSize: 18 }} /> },
];

type ThemeConfigModeLabel = 'light' | 'dark' | 'system';

const DENSITY_OPTIONS: { value: ThemeDensity; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'spacious', label: 'Spacious' },
];

const FONT_OPTIONS: { value: ThemeFontFamily; label: string }[] = [
  { value: 'inter', label: 'Inter' },
  { value: 'plus-jakarta-sans', label: 'Jakarta Sans' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'system', label: 'System UI' },
];

const SIDEBAR_OPTIONS: { value: SidebarVariant; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'compact', label: 'Compact' },
  { value: 'hidden', label: 'Hidden' },
];

// ── Component ──

export function ThemeSettings(): ReactElement {
  const theme = useTheme();
  const ctx = useThemeContext();

  const colorEntries = Object.entries(primaryColors) as [
    ThemePrimaryColor,
    typeof primaryColors.gold,
  ][];

  return (
    <Drawer
      anchor="right"
      open={ctx.settingsOpen}
      onClose={() => ctx.setSettingsOpen(false)}
      PaperProps={{
        sx: {
          width: DRAWER_WIDTH,
          maxWidth: '100vw',
          bgcolor: theme.palette.background.paper,
        },
      }}
    >
      {/* ── Header ── */}
      <DrawerHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon sx={{ color: theme.palette.primary.main }} />
          <Typography variant="h6" fontWeight={700}>
            Theme Settings
          </Typography>
        </Box>
        <IconButton onClick={() => ctx.setSettingsOpen(false)} size="small">
          <CloseIcon />
        </IconButton>
      </DrawerHeader>

      {/* ── Scrollable content ── */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {/* Mode */}
        <Section>
          <SectionTitle>Theme Mode</SectionTitle>
          <ToggleButtonGroup
            value={ctx.mode}
            exclusive
            onChange={(_, val) => val && ctx.setMode(val)}
            fullWidth
            size="small"
          >
            {MODE_OPTIONS.map((opt) => (
              <StyledToggleButton key={opt.value} value={opt.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {opt.icon}
                  {opt.label}
                </Box>
              </StyledToggleButton>
            ))}
          </ToggleButtonGroup>
          {ctx.mode === 'system' && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.75, display: 'block' }}
            >
              Currently: {ctx.resolvedMode === 'dark' ? 'Dark' : 'Light'} mode
            </Typography>
          )}
        </Section>

        <Divider />

        {/* Primary Color */}
        <Section>
          <SectionTitle>Primary Color</SectionTitle>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {colorEntries.map(([key, palette]) => (
              <Tooltip key={key} title={PRIMARY_COLOR_NAMES[key]} arrow placement="top">
                <ColorSwatch
                  swatchColor={palette.main}
                  isActive={ctx.primaryColor === key}
                  onClick={() => ctx.setPrimaryColor(key)}
                />
              </Tooltip>
            ))}
          </Box>
        </Section>

        <Divider />

        {/* Density */}
        <Section>
          <SectionTitle>Layout Density</SectionTitle>
          <ToggleButtonGroup
            value={ctx.density}
            exclusive
            onChange={(_, val) => val && ctx.setDensity(val)}
            fullWidth
            size="small"
          >
            {DENSITY_OPTIONS.map((opt) => (
              <StyledToggleButton key={opt.value} value={opt.value}>
                {opt.label}
              </StyledToggleButton>
            ))}
          </ToggleButtonGroup>
          <PreviewBox>
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                bgcolor: theme.palette.primary.main,
                flexShrink: 0,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" fontWeight={600} display="block">
                Preview
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sidebar: {densitySpacing[ctx.density].sidebarWidth}px · Radius:{' '}
                {densitySpacing[ctx.density].borderRadius}px
              </Typography>
            </Box>
          </PreviewBox>
        </Section>

        <Divider />

        {/* Font Family */}
        <Section>
          <SectionTitle>Font Family</SectionTitle>
          <ToggleButtonGroup
            value={ctx.fontFamily}
            exclusive
            onChange={(_, val) => val && ctx.setFontFamily(val)}
            fullWidth
            size="small"
          >
            {FONT_OPTIONS.map((opt) => (
              <StyledToggleButton key={opt.value} value={opt.value}>
                {opt.label}
              </StyledToggleButton>
            ))}
          </ToggleButtonGroup>
          <PreviewBox>
            <Typography variant="body2" sx={{ fontFamily: fontFamilyValues[ctx.fontFamily] }}>
              Aa Bb Cc — The quick brown fox jumps over the lazy dog.
            </Typography>
          </PreviewBox>
        </Section>

        <Divider />

        {/* Font Size Scale */}
        <Section>
          <SectionTitle>
            Font Size Scale
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {Math.round(ctx.fontSizeScale * 100)}%
            </Typography>
          </SectionTitle>
          <Slider
            value={ctx.fontSizeScale}
            min={0.75}
            max={1.25}
            step={0.05}
            onChange={(_, val) => ctx.setFontSizeScale(val as number)}
            size="small"
            sx={{ mx: 1 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              75%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              125%
            </Typography>
          </Box>
        </Section>

        <Divider />

        {/* Border Radius */}
        <Section>
          <SectionTitle>
            Border Radius
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {Math.round(ctx.borderRadiusScale * 100)}%
            </Typography>
          </SectionTitle>
          <Slider
            value={ctx.borderRadiusScale}
            min={0.5}
            max={2}
            step={0.1}
            onChange={(_, val) => ctx.setBorderRadiusScale(val as number)}
            size="small"
            sx={{ mx: 1 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              Sharp
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Rounded
            </Typography>
          </Box>
        </Section>

        <Divider />

        {/* Sidebar Variant */}
        <Section>
          <SectionTitle>Sidebar Style</SectionTitle>
          <ToggleButtonGroup
            value={ctx.sidebarVariant}
            exclusive
            onChange={(_, val) => val && ctx.setSidebarVariant(val)}
            fullWidth
            size="small"
          >
            {SIDEBAR_OPTIONS.map((opt) => (
              <StyledToggleButton key={opt.value} value={opt.value}>
                {opt.label}
              </StyledToggleButton>
            ))}
          </ToggleButtonGroup>
        </Section>

        <Divider />

        {/* Contrast */}
        <Section>
          <SectionTitle>Contrast</SectionTitle>
          <ToggleButtonGroup
            value={ctx.contrastLevel}
            exclusive
            onChange={(_, val) => val && ctx.setContrastLevel(val)}
            fullWidth
            size="small"
          >
            <StyledToggleButton value="normal">Normal</StyledToggleButton>
            <StyledToggleButton value="high">High Contrast</StyledToggleButton>
          </ToggleButtonGroup>
        </Section>

        {/* Reset */}
        <Section>
          <Button
            variant="outlined"
            color="error"
            startIcon={<ResetIcon />}
            onClick={ctx.resetTheme}
            fullWidth
            sx={{ mt: 1 }}
          >
            Reset to Defaults
          </Button>
        </Section>

        {/* Bottom spacer */}
        <Box sx={{ height: 24 }} />
      </Box>
    </Drawer>
  );
}
