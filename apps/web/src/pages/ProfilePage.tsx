import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, useTheme, alpha } from '@mui/material';
import { Camera } from 'lucide-react';
import { useProfile, useUpdateProfile } from '../features/profile/hooks';
import {
  profileTabs,
  getProfileTabFromPath,
} from '../features/profile/tabs';
import { uploadImage } from '../api/upload';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Avatar } from '../components/ui/Avatar';
import { Loading } from '../components/feedback/Loading';
import { useToast } from '../components/feedback/Toast';

// Import tab components
import { PersonalInfoTab } from '../features/profile/components/PersonalInfoTab';
import { AddressTab } from '../features/profile/components/AddressTab';
import { PreferencesTab } from '../features/profile/components/PreferencesTab';
import { PrivacyTab } from '../features/profile/components/PrivacyTab';
import { IdentityTab } from '../features/profile/components/IdentityTab';
import { VerificationStatusBadge } from '../features/profile/components/VerificationStatusBadge';

/**
 * ProfilePage — data-driven profile management with tabbed interface.
 * Composes specialized tab components for each profile section.
 */
export default function ProfilePage() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { data: profileData, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTab = getProfileTabFromPath(location.pathname);

  // Sync tab when route changes
  useEffect(() => {
    // Tab is derived from route, no state needed
  }, [location.pathname]);

  const handleTabChange = (value: string | number) => {
    const tab = profileTabs.find((t) => t.value === value);
    if (tab) {
      navigate(tab.path);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadImage(file);
      if (result.success && result.data?.url) {
        await updateProfile.mutateAsync({ avatarUrl: result.data.url });
        showSuccess('Avatar updated');
      } else {
        showError(result.error || 'Upload failed');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isLoading || !profileData?.data) {
    return <Loading fullScreen />;
  }

  const { user: profileUser, profile } = profileData.data;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return <PersonalInfoTab profile={profile} user={{ firstName: profileUser.firstName, lastName: profileUser.lastName }} />;
      case 'address':
        return <AddressTab profile={profile} />;
      case 'preferences':
        return <PreferencesTab profile={profile} />;
      case 'privacy':
        return <PrivacyTab profile={profile} />;
      case 'identity':
        return <IdentityTab profile={profile} />;
      case 'overview':
      case 'security':
      case 'permissions':
      case 'activity':
      case 'sessions':
      default:
        return (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Box component="p" sx={{ color: 'text.secondary', fontSize: 14 }}>
              This section is under development. Check back soon.
            </Box>
          </Card>
        );
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 } }}>
      {/* Profile Header Card */}
      <Card
        sx={{
          p: 3,
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
          {/* Avatar with upload */}
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={profileUser.avatarUrl}
              alt={`${profileUser.firstName} ${profileUser.lastName}`}
              size="large"
              sx={{ width: 96, height: 96, border: `3px solid ${theme.palette.primary.main}` }}
            >
              {profileUser.firstName[0]}{profileUser.lastName[0]}
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarUpload}
            />
            <Button
              variant="contained"
              size="small"
              onClick={() => fileInputRef.current?.click()}
              loading={updateProfile.isPending}
              sx={{
                position: 'absolute',
                bottom: -8,
                right: -8,
                minWidth: 36,
                width: 36,
                height: 36,
                borderRadius: '50%',
                p: 0,
              }}
            >
              <Camera size={16} />
            </Button>
          </Box>

          {/* Profile Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
              <Box component="h1" sx={{ fontSize: 24, fontWeight: 700, color: 'text.primary', m: 0 }}>
                {profileUser.firstName} {profileUser.lastName}
              </Box>
              <VerificationStatusBadge status={profile.kycStatus} size="medium" />
            </Box>
            <Box component="p" sx={{ color: 'text.secondary', fontSize: 14, m: 0, mb: 1 }}>
              {profileUser.email}
            </Box>
            {profile.bio && (
              <Box component="p" sx={{ color: 'text.secondary', fontSize: 13, m: 0, lineHeight: 1.5 }}>
                {profile.bio}
              </Box>
            )}
          </Box>
        </Box>
      </Card>

      {/* Tabs Navigation */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        items={profileTabs.map((tab) => ({
          value: tab.value,
          label: tab.label,
          icon: tab.icon,
        }))}
        sx={{ mb: 3 }}
      />

      {/* Tab Content */}
      <Box sx={{ pb: 4 }}>{renderTabContent()}</Box>
    </Box>
  );
}
