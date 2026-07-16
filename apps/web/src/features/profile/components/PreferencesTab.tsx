import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Slider,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import { RotateCcw, Undo2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Switch } from '../../../components/ui/Switch';
import { useToast } from '../../../components/feedback/Toast';
import { useUpdateProfile } from '../hooks';
import { useDebounce } from '../hooks/useDebounce';
import { useThemeContext } from '../../../theme/ThemeContext';
import type { ProfileResponse } from '../../../api/profile';
import { ProfileSectionCard, useProfileFieldSx } from './ProfileSectionCard';
import { ThemePreviewCard } from './ThemePreviewCard';

interface PreferencesTabProps {
  profile: ProfileResponse['profile'];
}

// ── Static option arrays ──

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese' },
];

const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const DATE_FORMATS = [
  { value: 'mdy', label: 'MM/DD/YYYY' },
  { value: 'dmy', label: 'DD/MM/YYYY' },
  { value: 'ymd', label: 'YYYY-MM-DD' },
];

const FONT_FAMILIES = [
  { value: 'inter' as const, label: 'Inter' },
  { value: 'plus-jakarta-sans' as const, label: 'Plus Jakarta Sans' },
  { value: 'roboto' as const, label: 'Roboto' },
  { value: 'system' as const, label: 'System UI' },
];

const FONT_WEIGHTS = [
  { value: 'light' as const, label: 'Light' },
  { value: 'normal' as const, label: 'Normal' },
  { value: 'medium' as const, label: 'Medium' },
  { value: 'semibold' as const, label: 'Semibold' },
  { value: 'bold' as const, label: 'Bold' },
];

const PRIMARY_COLORS = [
  { value: 'gold' as const, label: 'Gold', hex: '#D4A843' },
  { value: 'blue' as const, label: 'Blue', hex: '#4A90D9' },
  { value: 'purple' as const, label: 'Purple', hex: '#8B5CF6' },
  { value: 'green' as const, label: 'Green', hex: '#2EA043' },
  { value: 'red' as const, label: 'Red', hex: '#DA3743' },
  { value: 'indigo' as const, label: 'Indigo', hex: '#6366F1' },
  { value: 'teal' as const, label: 'Teal', hex: '#14B8A6' },
];

const DENSITIES = [
  { value: 'compact' as const, label: 'Compact', desc: 'Tighter spacing, smaller elements' },
  { value: 'comfortable' as const, label: 'Comfortable', desc: 'Balanced spacing (default)' },
  { value: 'spacious' as const, label: 'Spacious', desc: 'Extra padding, roomy layout' },
];

const SIDEBAR_VARIANTS = [
  { value: 'default' as const, label: 'Default', desc: 'Full sidebar with labels' },
  { value: 'compact' as const, label: 'Compact', desc: 'Icons only, collapsed' },
  { value: 'hidden' as const, label: 'Hidden', desc: 'Auto-hide sidebar' },
];

/** Factory defaults for theme fields. */
const THEME_DEFAULTS = {
  fontFamily: 'inter' as const,
  fontSizeScale: 1.0,
  fontWeight: 'normal' as const,
  primaryColor: 'gold' as const,
  density: 'comfortable' as const,
  sidebarVariant: 'default' as const,
  borderRadiusScale: 1.0,
  contrastLevel: 'normal' as const,
};

const SLIDER_DEBOUNCE_MS = 120;

/**
 * "Preferences" tab — notification, language, theme, and expanded theming
 * options (font, colors, layout) persisted to the server-side profile.
 *
 * Live preview: every discrete change (select, toggle, click) immediately
 * updates the global ThemeContext so the dashboard reflects the new setting.
 * Slider-driven values (font size, border radius) are debounced to avoid
 * jank from frequent MUI theme recomputation.
 *
 * Undo / Reset: a snapshot of the last-saved state is kept. When local state
 * diverges, an undo bar appears. "Reset to defaults" restores factory values.
 */
export function PreferencesTab({ profile }: PreferencesTabProps) {
  const theme = useTheme();
  const { text, primary } = theme.palette;
  const { showSuccess, showError } = useToast();
  const themeCtx = useThemeContext();
  const updateMutation = useUpdateProfile();
  const fieldSx = useProfileFieldSx();

  // ── Track the last-saved snapshot for undo ──
  const savedRef = useRef<Record<string, unknown>>({});

  // ── Notification preferences ──
  const [emailNotifications, setEmailNotifications] = useState(profile.emailNotifications);
  const [pushNotifications, setPushNotifications] = useState(profile.pushNotifications);
  const [loginAlerts, setLoginAlerts] = useState(profile.loginAlerts);
  const [marketingEmails, setMarketingEmails] = useState(profile.marketingEmails);

  // ── Localization ──
  const [language, setLanguage] = useState(profile.language);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [dateFormat, setDateFormat] = useState(profile.dateFormat);

  // ── Theme ──
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(profile.themeMode as 'light' | 'dark' | 'system');

  // ── Custom theming ──
  const [fontFamily, setFontFamily] = useState<'inter' | 'plus-jakarta-sans' | 'roboto' | 'system'>(
    (profile.fontFamily ?? THEME_DEFAULTS.fontFamily) as 'inter' | 'plus-jakarta-sans' | 'roboto' | 'system',
  );
  const [fontSizeScale, setFontSizeScale] = useState(profile.fontSizeScale ?? THEME_DEFAULTS.fontSizeScale);
  const [fontWeight, setFontWeight] = useState<'light' | 'normal' | 'medium' | 'semibold' | 'bold'>(
    (profile.fontWeight ?? THEME_DEFAULTS.fontWeight) as 'light' | 'normal' | 'medium' | 'semibold' | 'bold',
  );
  const [primaryColor, setPrimaryColor] = useState<'gold' | 'blue' | 'purple' | 'green' | 'red' | 'indigo' | 'teal'>(
    (profile.primaryColor ?? THEME_DEFAULTS.primaryColor) as 'gold' | 'blue' | 'purple' | 'green' | 'red' | 'indigo' | 'teal',
  );
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>(
    (profile.density ?? THEME_DEFAULTS.density) as 'compact' | 'comfortable' | 'spacious',
  );
  const [sidebarVariant, setSidebarVariant] = useState<'default' | 'compact' | 'hidden'>(
    (profile.sidebarVariant ?? THEME_DEFAULTS.sidebarVariant) as 'default' | 'compact' | 'hidden',
  );
  const [borderRadiusScale, setBorderRadiusScale] = useState(profile.borderRadiusScale ?? THEME_DEFAULTS.borderRadiusScale);
  const [contrastLevel, setContrastLevel] = useState<'normal' | 'high'>(
    (profile.contrastLevel ?? THEME_DEFAULTS.contrastLevel) as 'normal' | 'high',
  );

  // ── Debounced slider values (only the ThemeContext update is debounced) ──
  const debouncedFontSize = useDebounce(fontSizeScale, SLIDER_DEBOUNCE_MS);
  const debouncedRadius = useDebounce(borderRadiusScale, SLIDER_DEBOUNCE_MS);

  // ── Initialise saved snapshot on mount and when profile reloads ──
  useEffect(() => {
    savedRef.current = {
      emailNotifications: profile.emailNotifications,
      pushNotifications: profile.pushNotifications,
      loginAlerts: profile.loginAlerts,
      marketingEmails: profile.marketingEmails,
      language: profile.language,
      timezone: profile.timezone,
      dateFormat: profile.dateFormat,
      themeMode: profile.themeMode,
      fontFamily: profile.fontFamily ?? THEME_DEFAULTS.fontFamily,
      fontSizeScale: profile.fontSizeScale ?? THEME_DEFAULTS.fontSizeScale,
      fontWeight: profile.fontWeight ?? THEME_DEFAULTS.fontWeight,
      primaryColor: profile.primaryColor ?? THEME_DEFAULTS.primaryColor,
      density: profile.density ?? THEME_DEFAULTS.density,
      sidebarVariant: profile.sidebarVariant ?? THEME_DEFAULTS.sidebarVariant,
      borderRadiusScale: profile.borderRadiusScale ?? THEME_DEFAULTS.borderRadiusScale,
      contrastLevel: profile.contrastLevel ?? THEME_DEFAULTS.contrastLevel,
    };
  }, [profile]);

  // ── Sync local state when profile reloads ──
  useEffect(() => {
    setEmailNotifications(profile.emailNotifications);
    setPushNotifications(profile.pushNotifications);
    setLoginAlerts(profile.loginAlerts);
    setMarketingEmails(profile.marketingEmails);
    setLanguage(profile.language);
    setTimezone(profile.timezone);
    setDateFormat(profile.dateFormat);
    setThemeMode(profile.themeMode);
    setFontFamily(profile.fontFamily ?? THEME_DEFAULTS.fontFamily);
    setFontSizeScale(profile.fontSizeScale ?? THEME_DEFAULTS.fontSizeScale);
    setFontWeight(profile.fontWeight ?? THEME_DEFAULTS.fontWeight);
    setPrimaryColor(profile.primaryColor ?? THEME_DEFAULTS.primaryColor);
    setDensity(profile.density ?? THEME_DEFAULTS.density);
    setSidebarVariant(profile.sidebarVariant ?? THEME_DEFAULTS.sidebarVariant);
    setBorderRadiusScale(profile.borderRadiusScale ?? THEME_DEFAULTS.borderRadiusScale);
    setContrastLevel(profile.contrastLevel ?? THEME_DEFAULTS.contrastLevel);
  }, [profile]);

  // ── Live preview: apply debounced sliders to ThemeContext ──
  useEffect(() => {
    themeCtx.setFontSizeScale(debouncedFontSize);
  }, [debouncedFontSize]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    themeCtx.setBorderRadiusScale(debouncedRadius);
  }, [debouncedRadius]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived: has unsaved changes? ──
  const hasChanges = useMemo(() => {
    const s = savedRef.current;
    return (
      emailNotifications !== s.emailNotifications ||
      pushNotifications !== s.pushNotifications ||
      loginAlerts !== s.loginAlerts ||
      marketingEmails !== s.marketingEmails ||
      language !== s.language ||
      timezone !== s.timezone ||
      dateFormat !== s.dateFormat ||
      themeMode !== s.themeMode ||
      fontFamily !== s.fontFamily ||
      fontSizeScale !== s.fontSizeScale ||
      fontWeight !== s.fontWeight ||
      primaryColor !== s.primaryColor ||
      density !== s.density ||
      sidebarVariant !== s.sidebarVariant ||
      borderRadiusScale !== s.borderRadiusScale ||
      contrastLevel !== s.contrastLevel
    );
  }, [
    emailNotifications, pushNotifications, loginAlerts, marketingEmails,
    language, timezone, dateFormat, themeMode,
    fontFamily, fontSizeScale, fontWeight, primaryColor,
    density, sidebarVariant, borderRadiusScale, contrastLevel,
  ]);

  // ── Apply a set of theme values to ThemeContext (used by undo/reset) ──
  const applyThemeToContext = useCallback(
    (vals: {
      themeMode: string;
      fontFamily: string;
      fontWeight: string;
      primaryColor: string;
      density: string;
      sidebarVariant: string;
      fontSizeScale: number;
      borderRadiusScale: number;
      contrastLevel: string;
    }) => {
      themeCtx.setMode(vals.themeMode as 'light' | 'dark' | 'system');
      themeCtx.setPrimaryColor(vals.primaryColor as 'gold' | 'blue' | 'purple' | 'green' | 'red' | 'indigo' | 'teal');
      themeCtx.setFontFamily(vals.fontFamily as 'inter' | 'plus-jakarta-sans' | 'roboto' | 'system');
      themeCtx.setFontWeight?.(vals.fontWeight as 'light' | 'normal' | 'medium' | 'semibold' | 'bold');
      themeCtx.setDensity(vals.density as 'compact' | 'comfortable' | 'spacious');
      themeCtx.setSidebarVariant(vals.sidebarVariant as 'default' | 'compact' | 'hidden');
      themeCtx.setFontSizeScale(vals.fontSizeScale);
      themeCtx.setBorderRadiusScale(vals.borderRadiusScale);
      themeCtx.setContrastLevel(vals.contrastLevel as 'normal' | 'high');
    },
    [themeCtx],
  );

  // ── Undo: revert to last-saved snapshot ──
  const handleUndo = useCallback(() => {
    const s = savedRef.current;
    setEmailNotifications(s.emailNotifications as boolean);
    setPushNotifications(s.pushNotifications as boolean);
    setLoginAlerts(s.loginAlerts as boolean);
    setMarketingEmails(s.marketingEmails as boolean);
    setLanguage(s.language as string);
    setTimezone(s.timezone as string);
    setDateFormat(s.dateFormat as string);
    setThemeMode(s.themeMode as 'light' | 'dark' | 'system');
    setFontFamily(s.fontFamily as 'inter' | 'plus-jakarta-sans' | 'roboto' | 'system');
    setFontSizeScale(s.fontSizeScale as number);
    setFontWeight(s.fontWeight as 'light' | 'normal' | 'medium' | 'semibold' | 'bold');
    setPrimaryColor(s.primaryColor as 'gold' | 'blue' | 'purple' | 'green' | 'red' | 'indigo' | 'teal');
    setDensity(s.density as 'compact' | 'comfortable' | 'spacious');
    setSidebarVariant(s.sidebarVariant as 'default' | 'compact' | 'hidden');
    setBorderRadiusScale(s.borderRadiusScale as number);
    setContrastLevel(s.contrastLevel as 'normal' | 'high');

    // Apply saved theme back to context
    applyThemeToContext(s as Parameters<typeof applyThemeToContext>[0]);
  }, [applyThemeToContext]);

  // ── Reset to factory defaults ──
  const handleResetDefaults = useCallback(() => {
    setFontFamily(THEME_DEFAULTS.fontFamily);
    setFontSizeScale(THEME_DEFAULTS.fontSizeScale);
    setFontWeight(THEME_DEFAULTS.fontWeight);
    setPrimaryColor(THEME_DEFAULTS.primaryColor);
    setDensity(THEME_DEFAULTS.density);
    setSidebarVariant(THEME_DEFAULTS.sidebarVariant);
    setBorderRadiusScale(THEME_DEFAULTS.borderRadiusScale);
    setContrastLevel(THEME_DEFAULTS.contrastLevel);

    applyThemeToContext({
      themeMode,
      fontFamily: THEME_DEFAULTS.fontFamily,
      fontWeight: THEME_DEFAULTS.fontWeight,
      primaryColor: THEME_DEFAULTS.primaryColor,
      density: THEME_DEFAULTS.density,
      sidebarVariant: THEME_DEFAULTS.sidebarVariant,
      fontSizeScale: THEME_DEFAULTS.fontSizeScale,
      borderRadiusScale: THEME_DEFAULTS.borderRadiusScale,
      contrastLevel: THEME_DEFAULTS.contrastLevel,
    });
  }, [themeMode, applyThemeToContext]);

  // ── Save to backend ──
  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        emailNotifications,
        pushNotifications,
        loginAlerts,
        marketingEmails,
        language,
        timezone,
        dateFormat,
        themeMode,
        fontFamily,
        fontSizeScale,
        fontWeight,
        primaryColor,
        density,
        sidebarVariant,
        borderRadiusScale,
        contrastLevel,
      });

      // Update saved snapshot
      savedRef.current = {
        emailNotifications,
        pushNotifications,
        loginAlerts,
        marketingEmails,
        language,
        timezone,
        dateFormat,
        themeMode,
        fontFamily,
        fontSizeScale,
        fontWeight,
        primaryColor,
        density,
        sidebarVariant,
        borderRadiusScale,
        contrastLevel,
      };

      showSuccess('Preferences saved');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save preferences');
    }
  };

  // ── Live apply helpers for discrete controls ──
  const onThemeModeChange = (v: 'light' | 'dark' | 'system') => {
    setThemeMode(v);
    themeCtx.setMode(v);
  };

  const onContrastChange = (v: string | null) => {
    if (!v) return;
    const val = v as 'normal' | 'high';
    setContrastLevel(val);
    themeCtx.setContrastLevel(val);
  };

  const onFontFamilyChange = (v: 'inter' | 'plus-jakarta-sans' | 'roboto' | 'system') => {
    setFontFamily(v);
    themeCtx.setFontFamily(v);
  };

  const onFontWeightChange = (v: 'light' | 'normal' | 'medium' | 'semibold' | 'bold') => {
    setFontWeight(v);
    themeCtx.setFontWeight(v);
  };

  const onPrimaryColorChange = (v: 'gold' | 'blue' | 'purple' | 'green' | 'red' | 'indigo' | 'teal') => {
    setPrimaryColor(v);
    themeCtx.setPrimaryColor(v);
  };

  const onDensityChange = (v: 'compact' | 'comfortable' | 'spacious') => {
    setDensity(v);
    themeCtx.setDensity(v);
  };

  const onSidebarVariantChange = (v: 'default' | 'compact' | 'hidden') => {
    setSidebarVariant(v);
    themeCtx.setSidebarVariant(v);
    // Compact is already icon-only mode, so uncollapse if collapsed
    if (v === 'compact' && themeCtx.sidebarCollapsed) {
      themeCtx.setSidebarCollapsed(false);
    }
  };

  return (
    <>
      {/* ── Live Preview Card ── */}
      <ThemePreviewCard />

      {/* ── Notification Preferences ── */}
      <ProfileSectionCard
        title="Notification Preferences"
        description="Choose how Vestara keeps you informed."
      >
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {[
            { label: 'Email Notifications', desc: 'Receive account and activity updates via email', checked: emailNotifications, onChange: setEmailNotifications },
            { label: 'Push Notifications', desc: 'Receive push notifications in your browser', checked: pushNotifications, onChange: setPushNotifications },
            { label: 'Login Alerts', desc: 'Get notified of new sign-ins to your account', checked: loginAlerts, onChange: setLoginAlerts },
            { label: 'Marketing Emails', desc: 'Receive product updates and promotional offers', checked: marketingEmails, onChange: setMarketingEmails },
          ].map((pref, i) => (
            <Box
              key={pref.label}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1.5,
                borderBottom: i < 3 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              <Box>
                <Box component="p" sx={{ fontWeight: 500, color: 'text.primary', fontSize: 14, m: 0 }}>{pref.label}</Box>
                <Box component="p" sx={{ color: 'text.secondary', fontSize: 12, m: 0 }}>{pref.desc}</Box>
              </Box>
              <Switch checked={pref.checked} onChange={(e) => pref.onChange(e.target.checked)} />
            </Box>
          ))}
        </Box>
      </ProfileSectionCard>

      <Grid container spacing={3}>
        {/* ── Language & Localization ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ProfileSectionCard title="Language & Localization">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Box component="p" sx={{ fontWeight: 500, color: 'text.primary', fontSize: 13, m: 0, mb: 1 }}>Language</Box>
                <TextField select value={language} onChange={(e) => setLanguage(e.target.value)} fullWidth size="small" sx={fieldSx}>
                  {LANGUAGES.map((l) => (
                    <MenuItem key={l.code} value={l.code}>{l.label}</MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box>
                <Box component="p" sx={{ fontWeight: 500, color: 'text.primary', fontSize: 13, m: 0, mb: 1 }}>Timezone</Box>
                <TextField
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="e.g. America/Los_Angeles"
                  sx={fieldSx}
                />
              </Box>
              <Box>
                <Box component="p" sx={{ fontWeight: 500, color: 'text.primary', fontSize: 13, m: 0, mb: 1 }}>Date Format</Box>
                <TextField select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} fullWidth size="small" sx={fieldSx}>
                  {DATE_FORMATS.map((f) => (
                    <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
          </ProfileSectionCard>
        </Grid>

        {/* ── Theme Mode ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ProfileSectionCard title="Appearance">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Box component="p" sx={{ fontWeight: 500, color: 'text.primary', fontSize: 13, m: 0, mb: 1 }}>Theme Mode</Box>
                <TextField
                  select
                  value={themeMode}
                  onChange={(e) => onThemeModeChange(e.target.value as 'light' | 'dark' | 'system')}
                  fullWidth
                  size="small"
                  sx={fieldSx}
                >
                  {THEMES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box>
                <Box component="p" sx={{ fontWeight: 500, color: 'text.primary', fontSize: 13, m: 0, mb: 1 }}>Contrast Level</Box>
                <ToggleButtonGroup
                  value={contrastLevel}
                  exclusive
                  onChange={(_, v) => onContrastChange(v)}
                  size="small"
                  fullWidth
                  sx={{
                    '& .MuiToggleButton-root': {
                      color: text.secondary,
                      borderColor: 'divider',
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: 13,
                      '&.Mui-selected': {
                        color: primary.main,
                        bgcolor: alpha(primary.main, 0.1),
                        borderColor: alpha(primary.main, 0.3),
                      },
                    },
                  }}
                >
                  <ToggleButton value="normal">Normal</ToggleButton>
                  <ToggleButton value="high">High</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Box component="p" sx={{ color: 'text.secondary', fontSize: 12, m: 0 }}>
                Every change applies to the dashboard immediately.
              </Box>
            </Box>
          </ProfileSectionCard>
        </Grid>
      </Grid>

      {/* ── Typography ── */}
      <ProfileSectionCard title="Typography">
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box component="p" sx={{ fontWeight: 500, color: 'text.primary', fontSize: 13, m: 0 }}>Font Family</Box>
              <TextField select value={fontFamily} onChange={(e) => onFontFamilyChange(e.target.value as 'inter' | 'plus-jakarta-sans' | 'roboto' | 'system')} fullWidth size="small" sx={fieldSx}>
                {FONT_FAMILIES.map((f) => (
                  <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                ))}
              </TextField>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box component="p" sx={{ fontWeight: 500, color: 'text.primary', fontSize: 13, m: 0 }}>Font Weight</Box>
              <TextField select value={fontWeight} onChange={(e) => onFontWeightChange(e.target.value as 'light' | 'normal' | 'medium' | 'semibold' | 'bold')} fullWidth size="small" sx={fieldSx}>
                {FONT_WEIGHTS.map((f) => (
                  <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                ))}
              </TextField>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box component="p" sx={{ fontWeight: 500, color: 'text.primary', fontSize: 13, m: 0 }}>
                Font Size Scale
                <Box component="span" sx={{ color: 'text.secondary', ml: 0.5, fontSize: 12 }}>
                  {fontSizeScale.toFixed(2)}×
                </Box>
              </Box>
              <Slider
                value={fontSizeScale}
                min={0.75}
                max={1.25}
                step={0.05}
                onChange={(_, v) => setFontSizeScale(v as number)}
                sx={{
                  color: primary.main,
                  mt: 1,
                  '& .MuiSlider-thumb': { width: 16, height: 16 },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box component="span" sx={{ color: text.disabled, fontSize: 11 }}>Smaller</Box>
                <Box component="span" sx={{ color: text.disabled, fontSize: 11 }}>Larger</Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </ProfileSectionCard>

      {/* ── Primary Color ── */}
      <ProfileSectionCard title="Accent Color">
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {PRIMARY_COLORS.map((c) => (
            <Tooltip key={c.value} title={c.label}>
              <Box
                onClick={() => onPrimaryColorChange(c.value)}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: c.hex,
                  cursor: 'pointer',
                  border: primaryColor === c.value
                    ? `3px solid ${text.primary}`
                    : `3px solid transparent`,
                  boxShadow: primaryColor === c.value
                    ? `0 0 0 2px ${c.hex}, 0 4px 12px ${alpha(c.hex, 0.4)}`
                    : 'none',
                  transition: 'all .2s ease',
                  '&:hover': {
                    transform: 'scale(1.15)',
                    boxShadow: `0 0 0 2px ${alpha(c.hex, 0.5)}, 0 4px 12px ${alpha(c.hex, 0.3)}`,
                  },
                }}
              />
            </Tooltip>
          ))}
        </Box>
      </ProfileSectionCard>

      {/* ── Layout ── */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ProfileSectionCard title="Density">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {DENSITIES.map((d) => (
                <Box
                  key={d.value}
                  onClick={() => onDensityChange(d.value)}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: density === d.value
                      ? `1.5px solid ${primary.main}`
                      : `1px solid`,
                    borderColor: density === d.value ? alpha(primary.main, 0.4) : 'divider',
                    bgcolor: density === d.value ? alpha(primary.main, 0.06) : 'transparent',
                    cursor: 'pointer',
                    transition: 'all .2s ease',
                    '&:hover': { bgcolor: alpha(primary.main, 0.04) },
                  }}
                >
                  <Box component="p" sx={{ fontWeight: 600, color: 'text.primary', fontSize: 13, m: 0 }}>
                    {d.label}
                  </Box>
                  <Box component="p" sx={{ color: 'text.secondary', fontSize: 12, m: 0, mt: 0.25 }}>
                    {d.desc}
                  </Box>
                </Box>
              ))}
            </Box>
          </ProfileSectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ProfileSectionCard title="Sidebar">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {SIDEBAR_VARIANTS.map((v) => (
                <Box
                  key={v.value}
                  onClick={() => onSidebarVariantChange(v.value)}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: sidebarVariant === v.value
                      ? `1.5px solid ${primary.main}`
                      : `1px solid`,
                    borderColor: sidebarVariant === v.value ? alpha(primary.main, 0.4) : 'divider',
                    bgcolor: sidebarVariant === v.value ? alpha(primary.main, 0.06) : 'transparent',
                    cursor: 'pointer',
                    transition: 'all .2s ease',
                    '&:hover': { bgcolor: alpha(primary.main, 0.04) },
                  }}
                >
                  <Box component="p" sx={{ fontWeight: 600, color: 'text.primary', fontSize: 13, m: 0 }}>
                    {v.label}
                  </Box>
                  <Box component="p" sx={{ color: 'text.secondary', fontSize: 12, m: 0, mt: 0.25 }}>
                    {v.desc}
                  </Box>
                </Box>
              ))}
            </Box>
          </ProfileSectionCard>
        </Grid>
      </Grid>

      {/* ── Border Radius ── */}
      <ProfileSectionCard title="Corner Roundness">
        <Box sx={{ maxWidth: 400 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Box component="span" sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 500 }}>
              Border Radius Scale
            </Box>
            <Box component="span" sx={{ color: 'text.secondary', fontSize: 13 }}>
              {borderRadiusScale.toFixed(1)}×
            </Box>
          </Box>
          <Slider
            value={borderRadiusScale}
            min={0.5}
            max={2.0}
            step={0.1}
            onChange={(_, v) => setBorderRadiusScale(v as number)}
            sx={{
              color: primary.main,
              '& .MuiSlider-thumb': { width: 16, height: 16 },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box component="span" sx={{ color: text.disabled, fontSize: 11 }}>Sharp</Box>
            <Box component="span" sx={{ color: text.disabled, fontSize: 11 }}>Rounded</Box>
          </Box>
        </Box>
      </ProfileSectionCard>

      {/* ── Action Bar: Undo / Reset / Save ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          pt: 1,
          pb: 2,
        }}
      >
        {/* Left: Undo + Reset */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {hasChanges && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Undo2 size={15} />}
              onClick={handleUndo}
              sx={{ fontSize: 13 }}
            >
              Undo Changes
            </Button>
          )}
          <Button
            variant="text"
            size="small"
            startIcon={<RotateCcw size={15} />}
            onClick={handleResetDefaults}
            sx={{ fontSize: 13, color: text.secondary }}
          >
            Reset to Defaults
          </Button>
        </Box>

        {/* Right: Save */}
        <Button
          variant="contained"
          onClick={handleSave}
          loading={updateMutation.isPending}
          disabled={!hasChanges}
        >
          Save Preferences
        </Button>
      </Box>
    </>
  );
}
