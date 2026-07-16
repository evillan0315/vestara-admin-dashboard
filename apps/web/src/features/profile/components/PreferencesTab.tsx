import { useState, useEffect } from 'react';
import { Box, Grid, TextField, MenuItem } from '@mui/material';
import { Button } from '../../../components/ui/Button';
import { Switch } from '../../../components/ui/Switch';
import { useToast } from '../../../components/feedback/Toast';
import { useUpdateProfile } from '../hooks';
import { useThemeContext } from '../../../theme/ThemeContext';
import type { ProfileResponse } from '../../../api/profile';
import { ProfileSectionCard, useProfileFieldSx } from './ProfileSectionCard';

interface PreferencesTabProps {
  profile: ProfileResponse['profile'];
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { es: 'es', label: 'Spanish' },
  { fr: 'fr', label: 'French' },
  { de: 'de', label: 'German' },
  { pt: 'pt', label: 'Portuguese' },
  { ja: 'ja', label: 'Japanese' },
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

/**
 * "Preferences" tab — notification, language, theme, and localization
 * preferences persisted to the server-side profile. Theme changes are also
 * applied live via the global ThemeContext.
 */
export function PreferencesTab({ profile }: PreferencesTabProps) {
  const { showSuccess, showError } = useToast();
  const { setMode } = useThemeContext();
  const updateMutation = useUpdateProfile();
  const fieldSx = useProfileFieldSx();

  const [emailNotifications, setEmailNotifications] = useState(profile.emailNotifications);
  const [pushNotifications, setPushNotifications] = useState(profile.pushNotifications);
  const [loginAlerts, setLoginAlerts] = useState(profile.loginAlerts);
  const [marketingEmails, setMarketingEmails] = useState(profile.marketingEmails);
  const [language, setLanguage] = useState(profile.language);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [dateFormat, setDateFormat] = useState(profile.dateFormat);
  const [themeMode, setThemeMode] = useState<ProfileResponse['profile']['themeMode']>(profile.themeMode);

  useEffect(() => {
    setEmailNotifications(profile.emailNotifications);
    setPushNotifications(profile.pushNotifications);
    setLoginAlerts(profile.loginAlerts);
    setMarketingEmails(profile.marketingEmails);
    setLanguage(profile.language);
    setTimezone(profile.timezone);
    setDateFormat(profile.dateFormat);
    setThemeMode(profile.themeMode);
  }, [profile]);

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
      });
      setMode(themeMode);
      showSuccess('Preferences saved');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save preferences');
    }
  };

  return (
    <>
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

        <Grid size={{ xs: 12, md: 6 }}>
          <ProfileSectionCard title="Theme Preferences">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Box component="p" sx={{ fontWeight: 500, color: 'text.primary', fontSize: 13, m: 0, mb: 1 }}>Appearance</Box>
                <TextField select value={themeMode} onChange={(e) => setThemeMode(e.target.value as ProfileResponse['profile']['themeMode'])} fullWidth size="small" sx={fieldSx}>
                  {THEMES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box component="p" sx={{ color: 'text.secondary', fontSize: 12, m: 0 }}>
                Your selection is applied immediately and saved to your profile. The global theme switcher in the header reflects the same preference.
              </Box>
            </Box>
          </ProfileSectionCard>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={handleSave} loading={updateMutation.isPending}>
          Save Preferences
        </Button>
      </Box>
    </>
  );
}
