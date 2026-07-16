import { useState, useEffect } from 'react';
import { Box, Grid, TextField } from '@mui/material';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/feedback/Toast';
import { useUpdateProfile } from '../hooks';
import type { ProfileResponse } from '../../../api/profile';
import { ProfileSectionCard, useProfileFieldSx } from './ProfileSectionCard';

interface AddressTabProps {
  profile: ProfileResponse['profile'];
}

/**
 * "Address" tab — address management fields persisted to the user profile.
 */
export function AddressTab({ profile }: AddressTabProps) {
  const { showSuccess, showError } = useToast();
  const updateMutation = useUpdateProfile();
  const fieldSx = useProfileFieldSx();

  const [addressLine1, setAddressLine1] = useState(profile.addressLine1 ?? '');
  const [addressLine2, setAddressLine2] = useState(profile.addressLine2 ?? '');
  const [city, setCity] = useState(profile.city ?? '');
  const [state, setState] = useState(profile.state ?? '');
  const [postalCode, setPostalCode] = useState(profile.postalCode ?? '');
  const [country, setCountry] = useState(profile.country ?? '');

  useEffect(() => {
    setAddressLine1(profile.addressLine1 ?? '');
    setAddressLine2(profile.addressLine2 ?? '');
    setCity(profile.city ?? '');
    setState(profile.state ?? '');
    setPostalCode(profile.postalCode ?? '');
    setCountry(profile.country ?? '');
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
      });
      showSuccess('Address updated');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update address');
    }
  };

  return (
    <ProfileSectionCard
      title="Address Management"
      description="Your mailing address is used for compliance and verification correspondence."
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField
          label="Street Address"
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
          fullWidth
          size="small"
          sx={fieldSx}
        />
        <TextField
          label="Apartment, suite, etc. (optional)"
          value={addressLine2}
          onChange={(e) => setAddressLine2(e.target.value)}
          fullWidth
          size="small"
          sx={fieldSx}
        />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              fullWidth
              size="small"
              sx={fieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="State / Province"
              value={state}
              onChange={(e) => setState(e.target.value)}
              fullWidth
              size="small"
              sx={fieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Postal Code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              fullWidth
              size="small"
              sx={fieldSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              fullWidth
              size="small"
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
          Save Address
        </Button>
      </Box>
    </ProfileSectionCard>
  );
}
