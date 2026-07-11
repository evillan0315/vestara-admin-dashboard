import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Tabs,
  Tab,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  User as UserIcon,
  Lock,
  Camera,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useProfile, useUpdateProfile, useChangePassword } from '../features/profile/hooks';
import { colors } from '../theme/tokens';

type TabValue = 'general' | 'security';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const location = useLocation();

  // Derive initial tab from path: /security → security tab
  const initialTab: TabValue = location.pathname === '/security' ? 'security' : 'general';
  const [tab, setTab] = useState<TabValue>(initialTab);

  // ── General form state ─────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // ── Security form state ─────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Load profile data into form
  useEffect(() => {
    if (profileData?.data?.user) {
      const u = profileData.data.user;
      setFirstName(u.firstName);
      setLastName(u.lastName);
      setAvatarUrl(u.avatarUrl ?? '');
    }
  }, [profileData]);

  // Load from auth context user on first render (avoids flash)
  useEffect(() => {
    if (user && !profileData) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setAvatarUrl(user.avatarUrl ?? '');
    }
  }, [user, profileData]);

  // ── Handlers ───────────────────────────────

  const handleUpdateProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        firstName,
        lastName,
        avatarUrl: avatarUrl || '',
      });
      // Refresh user in auth context
      if (profileData?.data?.user) {
        updateUser({
          ...profileData.data.user,
          firstName,
          lastName,
          avatarUrl: avatarUrl || undefined,
        });
      }
    } catch {
      // Error handled by mutation state
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const apiErr = err as { message?: string; code?: string };
      setPasswordError(apiErr?.message || 'Failed to change password');
    }
  };

  const isOAuthAccount = !!(user?.provider);

  // ── Derived state ──────────────────────────

  const initials = [firstName, lastName]
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  // ── Loading ─────────────────────────────────

  if (profileLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Page Header */}
      <Typography variant="h5" sx={{ fontWeight: 700, color: colors.text, mb: 0.5 }}>
        Profile Settings
      </Typography>
      <Typography variant="body2" sx={{ color: colors.secondary, mb: 3 }}>
        Manage your personal information and security settings
      </Typography>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3,
          borderBottom: `1px solid ${colors.border}`,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 14 },
          '& .Mui-selected': { color: `${colors.gold} !important` },
          '& .MuiTabs-indicator': { backgroundColor: colors.gold },
        }}
      >
        <Tab icon={<UserIcon size={18} />} iconPosition="start" label="General" value="general" />
        <Tab icon={<Lock size={18} />} iconPosition="start" label="Security" value="security" />
      </Tabs>

      {/* ── General Tab ───────────────────────── */}
      {tab === 'general' && (
        <Paper
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            bgcolor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 3,
          }}
        >
          {/* Avatar Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4, pb: 3, borderBottom: `1px solid ${colors.border}` }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={avatarUrl || undefined}
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: colors.gold,
                  color: '#0A0F18',
                  fontWeight: 700,
                  fontSize: 28,
                  border: `3px solid ${colors.gold}`,
                }}
              >
                {initials}
              </Avatar>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: colors.gold,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Camera size={14} color="#0A0F18" />
              </Box>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, color: colors.text, fontSize: 18 }}>
                {firstName} {lastName}
              </Typography>
              <Typography sx={{ color: colors.secondary, fontSize: 13, textTransform: 'capitalize' }}>
                {user?.role?.replace('_', ' ')}
              </Typography>
            </Box>
          </Box>

          {/* Form Fields */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                fullWidth
                size="small"
                sx={textFieldStyles}
              />
              <TextField
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                fullWidth
                size="small"
                sx={textFieldStyles}
              />
            </Box>

            <TextField
              label="Email"
              value={user?.email ?? ''}
              fullWidth
              size="small"
              disabled
              sx={textFieldStyles}
            />

            <TextField
              label="Avatar URL"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              fullWidth
              size="small"
              placeholder="https://example.com/avatar.jpg"
              helperText="Enter a URL for your profile picture"
              sx={textFieldStyles}
            />

            {/* Success Message */}
            {updateProfileMutation.isSuccess && (
              <Alert
                icon={<CheckCircle size={18} />}
                severity="success"
                sx={{ borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }}
              >
                Profile updated successfully
              </Alert>
            )}

            {/* Error Message */}
            {updateProfileMutation.isError && (
              <Alert
                icon={<AlertCircle size={18} />}
                severity="error"
                sx={{ borderRadius: 2, bgcolor: 'rgba(244,67,54,0.1)', color: colors.error }}
              >
                {(updateProfileMutation.error as { message?: string })?.message || 'Failed to update profile'}
              </Alert>
            )}

            <Button
              variant="contained"
              onClick={handleUpdateProfile}
              disabled={updateProfileMutation.isPending}
              sx={{
                alignSelf: 'flex-start',
                mt: 1,
                bgcolor: colors.gold,
                color: '#0A0F18',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '10px',
                px: 4,
                py: 1,
                '&:hover': { bgcolor: colors.goldHover },
                '&.Mui-disabled': { bgcolor: colors.gold, opacity: 0.6, color: '#0A0F18' },
              }}
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* ── Security Tab ──────────────────────── */}
      {tab === 'security' && (
        <Paper
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            bgcolor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 3,
          }}
        >
          <Typography sx={{ fontWeight: 700, color: colors.text, fontSize: 16, mb: 0.5 }}>
            Change Password
          </Typography>
          <Typography sx={{ color: colors.secondary, fontSize: 13, mb: 3 }}>
            Update your password to keep your account secure
          </Typography>

          {isOAuthAccount ? (
            <Alert
              severity="info"
              sx={{ borderRadius: 2, bgcolor: 'rgba(33,150,243,0.1)', color: '#2196f3' }}
            >
              Password management is not available for OAuth-linked accounts.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 440 }}>
              <TextField
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                fullWidth
                size="small"
                sx={textFieldStyles}
              />

              <TextField
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                size="small"
                helperText="Min 8 characters, at least one uppercase, lowercase, and number"
                sx={textFieldStyles}
              />

              <TextField
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                size="small"
                error={!!passwordError && passwordError === 'Passwords do not match'}
                sx={textFieldStyles}
              />

              {/* Success */}
              {passwordSuccess && (
                <Alert
                  icon={<CheckCircle size={18} />}
                  severity="success"
                  sx={{ borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }}
                >
                  {passwordSuccess}
                </Alert>
              )}

              {/* Error */}
              {passwordError && (
                <Alert
                  icon={<AlertCircle size={18} />}
                  severity="error"
                  sx={{ borderRadius: 2, bgcolor: 'rgba(244,67,54,0.1)', color: colors.error }}
                >
                  {passwordError}
                </Alert>
              )}

              <Button
                variant="contained"
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
                sx={{
                  alignSelf: 'flex-start',
                  mt: 1,
                  bgcolor: colors.gold,
                  color: '#0A0F18',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: '10px',
                  px: 4,
                  py: 1,
                  '&:hover': { bgcolor: colors.goldHover },
                  '&.Mui-disabled': { bgcolor: colors.gold, opacity: 0.6, color: '#0A0F18' },
                }}
              >
                {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
              </Button>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}

// ── Shared TextField Styles ────────────────────

const textFieldStyles = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    bgcolor: colors.card,
    color: colors.text,
    '& fieldset': { borderColor: colors.border },
    '&:hover fieldset': { borderColor: colors.gold },
    '&.Mui-focused fieldset': { borderColor: colors.gold },
  },
  '& .MuiInputLabel-root': { color: colors.secondary },
  '& .MuiInputLabel-root.Mui-focused': { color: colors.gold },
  '& .MuiFormHelperText-root': { color: colors.muted },
  '& .Mui-disabled': {
    '& .MuiOutlinedInput-notchedOutline': { borderColor: `${colors.border} !important` },
  },
};
