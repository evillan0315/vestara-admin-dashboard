import { useState, useEffect } from 'react';
import { Box, Grid, TextField } from '@mui/material';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/feedback/Toast';
import { useUpdateProfile } from '../hooks';
import type { ProfileResponse } from '../../../api/profile';
import { ProfileSectionCard, useProfileFieldSx } from './ProfileSectionCard';

interface PersonalInfoTabProps {
  profile: ProfileResponse['profile'];
  user: { firstName: string; lastName: string };
}

export function PersonalInfoTab({ profile, user }: PersonalInfoTabProps) {
  const { showSuccess, showError } = useToast();
  const updateMutation = useUpdateProfile();
  const fieldSx = useProfileFieldSx();

  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [contactEmail, setContactEmail] = useState(profile.contactEmail ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(
    profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : '',
  );

  // Re-sync when the underlying profile data changes (e.g. after save/invalidate).
  useEffect(() => {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(profile.phone ?? '');
    setContactEmail(profile.contactEmail ?? '');
    setBio(profile.bio ?? '');
    setDateOfBirth(profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : '');
  }, [profile, user]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        firstName,
        lastName,
        phone,
        contactEmail,
        bio,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : '',
      });
      showSuccess('Personal information updated');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  return (
    <ProfileSectionCard
      title="Personal Information"
      description="Manage how you appear across the organization. Changes are saved to your profile."
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              fullWidth
              size="small"
              sx={fieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              fullWidth
              size="small"
              sx={fieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
              size="small"
              placeholder="+1 (555) 000-0000"
              sx={fieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Date of Birth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={fieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Contact Email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              fullWidth
              size="small"
              placeholder="secondary@example.com"
              helperText="An alternative contact address (does not change your login email)"
              sx={fieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={3}
              inputProps={{ maxLength: 500 }}
              helperText={`${bio.length}/500`}
              sx={fieldSx}
            />
          </Grid>
        </Grid>
        <Button
          variant="contained"
          onClick={handleSave}
          loading={updateMutation.isPending}
          sx={{ alignSelf: 'flex-start', mt: 1 }}
        >
          Save Changes
        </Button>
      </Box>
    </ProfileSectionCard>
  );
}
