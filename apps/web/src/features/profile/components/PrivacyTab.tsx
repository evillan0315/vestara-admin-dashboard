import { useState, useEffect } from 'react';
import { Box, MenuItem, TextField } from '@mui/material';
import { Button } from '../../../components/ui/Button';
import { Switch } from '../../../components/ui/Switch';
import { useToast } from '../../../components/feedback/Toast';
import { useUpdateProfile } from '../hooks';
import type { ProfileResponse } from '../../../api/profile';
import { ProfileSectionCard, useProfileFieldSx } from './ProfileSectionCard';

interface PrivacyTabProps {
  profile: ProfileResponse['profile'];
}

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public — visible to everyone in the workspace' },
  { value: 'organization', label: 'Organization — visible to your organization' },
  { value: 'private', label: 'Private — only you and admins' },
];

/**
 * "Privacy" tab — profile visibility and sharing preferences persisted to the
 * server-side profile.
 */
export function PrivacyTab({ profile }: PrivacyTabProps) {
  const { showSuccess, showError } = useToast();
  const updateMutation = useUpdateProfile();
  const fieldSx = useProfileFieldSx();

  const [profileVisibility, setProfileVisibility] = useState(profile.profileVisibility);
  const [showEmail, setShowEmail] = useState(profile.showEmail);
  const [showActivity, setShowActivity] = useState(profile.showActivity);
  const [searchable, setSearchable] = useState(profile.searchable);

  useEffect(() => {
    setProfileVisibility(profile.profileVisibility);
    setShowEmail(profile.showEmail);
    setShowActivity(profile.showActivity);
    setSearchable(profile.searchable);
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        profileVisibility,
        showEmail,
        showActivity,
        searchable,
      });
      showSuccess('Privacy settings updated');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update privacy settings');
    }
  };

  return (
    <>
      <ProfileSectionCard
        title="Privacy Settings"
        description="Control who can see your profile and how your information is shared."
      >
        <Box sx={{ mb: 3 }}>
          <Box component="p" sx={{ fontWeight: 500, color: 'text.primary', fontSize: 13, m: 0, mb: 1 }}>Profile Visibility</Box>
          <TextField
            select
            value={profileVisibility}
            onChange={(e) => setProfileVisibility(e.target.value as ProfileResponse['profile']['profileVisibility'])}
            fullWidth
            size="small"
            sx={fieldSx}
          >
            {VISIBILITY_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {[
            { label: 'Show Email', desc: 'Allow others to see your contact email', checked: showEmail, onChange: setShowEmail },
            { label: 'Show Activity', desc: 'Include your actions in shared activity feeds', checked: showActivity, onChange: setShowActivity },
            { label: 'Discoverable', desc: 'Allow others to find you via search', checked: searchable, onChange: setSearchable },
          ].map((pref, i) => (
            <Box
              key={pref.label}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1.5,
                borderBottom: i < 2 ? '1px solid' : 'none',
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

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={handleSave} loading={updateMutation.isPending}>
          Save Privacy Settings
        </Button>
      </Box>
    </>
  );
}
