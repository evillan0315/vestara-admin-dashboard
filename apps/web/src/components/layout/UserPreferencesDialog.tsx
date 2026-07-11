import React, { useState, useEffect, useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Restore,
  Palette,
  Notifications,
  Language,
  DarkMode,
  LightMode,
  BrightnessAuto,
  Settings,
} from '@mui/icons-material';
import { useThemeContext } from '../../providers/ThemeProvider';
import { colors } from '../../theme/tokens';
import type { ThemeDensity, SidebarVariant } from '../../theme/types';

interface UserPreferencesDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface Preferences {
  theme: 'light' | 'dark' | 'system';
  density: ThemeDensity;
  sidebarCollapsed: boolean;
  sidebarVariant: SidebarVariant;
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  density: 'comfortable',
  sidebarCollapsed: false,
  sidebarVariant: 'default',
  emailNotifications: true,
  pushNotifications: true,
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
};

const STORAGE_KEY = 'vestara-user-preferences';

function useUserPreferences() {
  const { setMode, setDensity, setSidebarCollapsed, setSidebarVariant } = useThemeContext();

  const [preferences, setPreferences] = useState<Preferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_PREFERENCES;
  });

  // Sync preferences with theme context
  useEffect(() => {
    setMode(preferences.theme);
  }, [preferences.theme, setMode]);

  useEffect(() => {
    setDensity(preferences.density);
  }, [preferences.density, setDensity]);

  useEffect(() => {
    setSidebarCollapsed(preferences.sidebarCollapsed);
  }, [preferences.sidebarCollapsed, setSidebarCollapsed]);

  useEffect(() => {
    setSidebarVariant(preferences.sidebarVariant);
  }, [preferences.sidebarVariant, setSidebarVariant]);

  const savePreferences = useCallback((newPreferences: Partial<Preferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [preferences]);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { preferences, savePreferences, resetPreferences };
}

const THEME_MODES = [
  { value: 'light' as const, label: 'Light', description: 'Always light mode', icon: <LightMode fontSize="large" /> },
  { value: 'dark' as const, label: 'Dark', description: 'Always dark mode', icon: <DarkMode fontSize="large" /> },
  { value: 'system' as const, label: 'System', description: 'Follow system preference', icon: <BrightnessAuto fontSize="large" /> },
];

const DENSITY_OPTIONS = [
  { value: 'compact' as ThemeDensity, label: 'Compact', description: 'More content, smaller spacing' },
  { value: 'comfortable' as ThemeDensity, label: 'Comfortable', description: 'Balanced spacing (default)' },
  { value: 'spacious' as ThemeDensity, label: 'Spacious', description: 'More breathing room' },
];

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '07/12/2026' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '12/07/2026' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2026-07-12' },
  { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY', example: 'Jul 12, 2026' },
];

const TIME_FORMATS = [
  { value: '12h' as const, label: '12 Hour', example: '2:30 PM' },
  { value: '24h' as const, label: '24 Hour', example: '14:30' },
];

const TABS = [
  { id: 'appearance', label: 'Appearance', icon: <Palette fontSize="small" /> },
  { id: 'notifications', label: 'Notifications', icon: <Notifications fontSize="small" /> },
  { id: 'localization', label: 'Localization', icon: <Language fontSize="small" /> },
];

const DRAWER_WIDTH = 480;

export default function UserPreferencesDrawer({ open, onClose }: UserPreferencesDrawerProps) {
  const { preferences, savePreferences, resetPreferences } = useUserPreferences();
  const [activeTab, setActiveTab] = useState(0);

  const handleSavePreferences = () => {
    onClose();
  };

  return (
    <Drawer
      variant="persistent"
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        zIndex: 1400,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          maxWidth: '100vw',
          height: '100vh',
          borderLeft: `1px solid ${colors.border}`,
          bgcolor: colors.card,
          boxShadow: '-24px 0 40px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Settings sx={{ color: colors.gold, fontSize: 24 }} />
          <Typography variant="h6" fontWeight={700} color={colors.text}>
            Preferences
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: colors.secondary }}>
          <Restore fontSize="large" />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(TABS.findIndex((t) => t.id === value))}
        variant="fullWidth"
        sx={{
          borderBottom: `1px solid ${colors.border}`,
          '& .MuiTabs-indicator': {
            backgroundColor: colors.gold,
            height: 3,
          },
          minHeight: 52,
          px: 1,
        }}
      >
        {TABS.map((tab) => (
          <Tab
            key={tab.id}
            value={tab.id}
            icon={tab.icon}
            label={tab.label}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 13,
              minHeight: 52,
              color: colors.secondary,
              '&.Mui-selected': {
                color: colors.gold,
              },
            }}
          />
        ))}
      </Tabs>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {TABS[activeTab].id === 'appearance' && (
          <AppearanceTab preferences={preferences} savePreferences={savePreferences} />
        )}
        {TABS[activeTab].id === 'notifications' && (
          <NotificationsTab preferences={preferences} savePreferences={savePreferences} />
        )}
        {TABS[activeTab].id === 'localization' && (
          <LocalizationTab preferences={preferences} savePreferences={savePreferences} />
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
          px: 3,
        }}
      >
        <Button onClick={resetPreferences} variant="outlined" sx={{ color: colors.error, borderColor: colors.error }}>
          Reset to Defaults
        </Button>
        <Button
          onClick={handleSavePreferences}
          variant="contained"
          sx={{
            bgcolor: colors.gold,
            color: '#0A0F18',
            fontWeight: 700,
            textTransform: 'none',
          }}
        >
          Save Changes
        </Button>
      </Box>
    </Drawer>
  );
}

function AppearanceTab({
  preferences,
  savePreferences,
}: {
  preferences: Preferences;
  savePreferences: (prefs: Partial<Preferences>) => void;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Theme Mode */}
      <Box>
        <Typography variant="subtitle1" fontWeight={600} color={colors.text} sx={{ mb: 2 }}>
          Theme Mode
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {THEME_MODES.map((mode) => (
            <Button
              key={mode.value}
              variant={preferences.theme === mode.value ? 'contained' : 'outlined'}
              onClick={() => savePreferences({ theme: mode.value })}
              sx={{
                flex: 1,
                minWidth: 120,
                py: 2,
                borderRadius: 2,
                bgcolor: preferences.theme === mode.value ? colors.gold : 'transparent',
                color: preferences.theme === mode.value ? '#0A0F18' : colors.text,
                borderColor: preferences.theme === mode.value ? colors.gold : colors.border,
                '&:hover': {
                  bgcolor: preferences.theme === mode.value ? colors.goldHover : 'rgba(255,255,255,0.03)',
                },
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                {mode.icon}
                <Typography variant="body2" fontWeight={600}>{mode.label}</Typography>
                <Typography variant="caption" color="text.secondary">{mode.description}</Typography>
              </Box>
            </Button>
          ))}
        </Box>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Density */}
      <Box>
        <Typography variant="subtitle1" fontWeight={600} color={colors.text} sx={{ mb: 2 }}>
          Layout Density
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {DENSITY_OPTIONS.map((density) => (
            <Button
              key={density.value}
              variant={preferences.density === density.value ? 'contained' : 'outlined'}
              onClick={() => savePreferences({ density: density.value })}
              sx={{
                flex: 1,
                minWidth: 120,
                py: 2,
                borderRadius: 2,
                bgcolor: preferences.density === density.value ? colors.gold : 'transparent',
                color: preferences.density === density.value ? '#0A0F18' : colors.text,
                borderColor: preferences.density === density.value ? colors.gold : colors.border,
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" fontWeight={600}>{density.label}</Typography>
                <Typography variant="caption" color="text.secondary">{density.description}</Typography>
              </Box>
            </Button>
          ))}
        </Box>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Sidebar */}
      <Box>
        <Typography variant="subtitle1" fontWeight={600} color={colors.text} sx={{ mb: 2 }}>
          Sidebar
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.sidebarCollapsed}
                onChange={(e) => savePreferences({ sidebarCollapsed: e.target.checked })}
                color="primary"
              />
            }
            label="Collapse sidebar by default"
            labelPlacement="end"
          />
          <FormControlLabel
            control={
              <Switch
                checked={preferences.sidebarVariant === 'hidden'}
                onChange={(e) => savePreferences({ sidebarVariant: e.target.checked ? 'hidden' : 'default' })}
                color="primary"
              />
            }
            label="Hide sidebar completely"
            labelPlacement="end"
          />
        </Box>
      </Box>
    </Box>
  );
}

function NotificationsTab({
  preferences,
  savePreferences,
}: {
  preferences: Preferences;
  savePreferences: (prefs: Partial<Preferences>) => void;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} color={colors.text} sx={{ mb: 1 }}>
        Email Notifications
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={preferences.emailNotifications}
            onChange={(e) => savePreferences({ emailNotifications: e.target.checked })}
            color="primary"
          />
        }
        label="Receive email notifications for important updates"
        labelPlacement="end"
      />

      <Typography variant="subtitle1" fontWeight={600} color={colors.text} sx={{ mt: 2, mb: 1 }}>
        Push Notifications
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={preferences.pushNotifications}
            onChange={(e) => savePreferences({ pushNotifications: e.target.checked })}
            color="primary"
          />
        }
        label="Show browser push notifications"
        labelPlacement="end"
      />
    </Box>
  );
}

function LocalizationTab({
  preferences,
  savePreferences,
}: {
  preferences: Preferences;
  savePreferences: (prefs: Partial<Preferences>) => void;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Language */}
      <Box>
        <Typography variant="subtitle1" fontWeight={600} color={colors.text} sx={{ mb: 2 }}>
          Language
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {LANGUAGES.map((lang) => (
            <Button
              key={lang.code}
              variant={preferences.language === lang.code ? 'contained' : 'outlined'}
              onClick={() => savePreferences({ language: lang.code })}
              sx={{
                minWidth: 100,
                py: 1.5,
                bgcolor: preferences.language === lang.code ? colors.gold : 'transparent',
                color: preferences.language === lang.code ? '#0A0F18' : colors.text,
                borderColor: preferences.language === lang.code ? colors.gold : colors.border,
              }}
            >
              {lang.flag} {lang.name}
            </Button>
          ))}
        </Box>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Date Format */}
      <Box>
        <Typography variant="subtitle1" fontWeight={600} color={colors.text} sx={{ mb: 2 }}>
          Date Format
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {DATE_FORMATS.map((format) => (
            <Button
              key={format.value}
              variant={preferences.dateFormat === format.value ? 'contained' : 'outlined'}
              onClick={() => savePreferences({ dateFormat: format.value })}
              sx={{
                minWidth: 140,
                py: 1.5,
                bgcolor: preferences.dateFormat === format.value ? colors.gold : 'transparent',
                color: preferences.dateFormat === format.value ? '#0A0F18' : colors.text,
                borderColor: preferences.dateFormat === format.value ? colors.gold : colors.border,
              }}
            >
              <Typography variant="body2" fontWeight={600}>{format.label}</Typography>
              <Typography variant="caption" color="text.secondary">{format.example}</Typography>
            </Button>
          ))}
        </Box>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Time Format */}
      <Box>
        <Typography variant="subtitle1" fontWeight={600} color={colors.text} sx={{ mb: 2 }}>
          Time Format
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {TIME_FORMATS.map((format) => (
            <Button
              key={format.value}
              variant={preferences.timeFormat === format.value ? 'contained' : 'outlined'}
              onClick={() => savePreferences({ timeFormat: format.value })}
              sx={{
                flex: 1,
                py: 1.5,
                bgcolor: preferences.timeFormat === format.value ? colors.gold : 'transparent',
                color: preferences.timeFormat === format.value ? '#0A0F18' : colors.text,
                borderColor: preferences.timeFormat === format.value ? colors.gold : colors.border,
              }}
            >
              <Typography variant="body2" fontWeight={600}>{format.label}</Typography>
              <Typography variant="caption" color="text.secondary">{format.example}</Typography>
            </Button>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

interface UserPreferencesDrawerProps {
  open: boolean;
  onClose: () => void;
}