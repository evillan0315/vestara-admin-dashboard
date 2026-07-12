import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  User as UserIcon,
  Lock,
  Camera,
  CheckCircle,
  AlertCircle,
  Mail,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  useChangeEmail,
  useDeleteAccount,
} from '../features/profile/hooks';
import { uploadImage } from '../api/upload';
import { colors } from '../theme/tokens';

type TabValue = 'general' | 'security';

export default function ProfilePage() {
  const { user, updateUser, deleteAccount: clearAuth } = useAuth();
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const changeEmailMutation = useChangeEmail();
  const deleteAccountMutation = useDeleteAccount();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive initial tab from path: /security → security tab
  const initialTab: TabValue = location.pathname === '/security' ? 'security' : 'general';
  const [tab, setTab] = useState<TabValue>(initialTab);

  // ── General form state ─────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // ── Email change dialog state ───────────────
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  // ── Security form state ─────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // ── Delete account state ────────────────────
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // ── Avatar upload state ─────────────────────
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState('');

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setAvatarUploadError('');

    try {
      const result = await uploadImage(file);
      if (result.success && result.data?.url) {
        setAvatarUrl(result.data.url);
        // Auto-save the profile with the new avatar
        await updateProfileMutation.mutateAsync({
          firstName,
          lastName,
          avatarUrl: result.data.url,
        });
        if (profileData?.data?.user) {
          updateUser({
            ...profileData.data.user,
            avatarUrl: result.data.url,
          });
        }
      } else {
        setAvatarUploadError(result.error || 'Failed to upload image');
      }
    } catch {
      setAvatarUploadError('Failed to upload image');
    } finally {
      setAvatarUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ── Email Change ────────────────────────────

  const handleOpenEmailDialog = () => {
    setNewEmail(user?.email ?? '');
    setEmailPassword('');
    setEmailError('');
    setEmailSuccess('');
    setEmailDialogOpen(true);
  };

  const handleChangeEmail = async () => {
    setEmailError('');
    setEmailSuccess('');

    if (!newEmail || newEmail === user?.email) {
      setEmailError('Please enter a different email address');
      return;
    }

    try {
      const result = await changeEmailMutation.mutateAsync({
        newEmail,
        ...(isOAuthAccount ? {} : { currentPassword: emailPassword }),
      });
      if (result.data?.user) {
        updateUser({ ...user!, ...result.data.user });
      }
      setEmailSuccess('Email changed successfully');
      setEmailPassword('');
      setTimeout(() => {
        setEmailDialogOpen(false);
      }, 1500);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setEmailError(apiErr?.message || 'Failed to change email');
    }
  };

  // ── Password Change ─────────────────────────

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

    if (!isOAuthAccount && !currentPassword) {
      setPasswordError('Current password is required');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: currentPassword ?? '',
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

  // ── Account Deletion ────────────────────────

  const handleOpenDeleteDialog = () => {
    setDeleteConfirmation('');
    setDeletePassword('');
    setDeleteError('');
    setDeleteDialogOpen(true);
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');

    try {
      await deleteAccountMutation.mutateAsync({
        confirmation: deleteConfirmation,
        ...(isOAuthAccount ? {} : { currentPassword: deletePassword }),
      });
      setDeleteDialogOpen(false);
      clearAuth();
      navigate('/login');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setDeleteError(apiErr?.message || 'Failed to delete account');
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

  const canChangeEmail = !!(newEmail && newEmail !== user?.email && (!isOAuthAccount ? emailPassword : true));

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
      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        style={{ display: 'none' }}
        onChange={handleAvatarUpload}
      />

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
                onClick={() => fileInputRef.current?.click()}
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
                  transition: 'opacity 0.2s',
                  '&:hover': { opacity: 0.8 },
                }}
              >
                {avatarUploading ? (
                  <CircularProgress size={14} sx={{ color: '#0A0F18' }} />
                ) : (
                  <Camera size={14} color="#0A0F18" />
                )}
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

          {/* Avatar upload error */}
          {avatarUploadError && (
            <Alert
              icon={<AlertCircle size={18} />}
              severity="error"
              sx={{ borderRadius: 2, bgcolor: 'rgba(244,67,54,0.1)', color: colors.error, mb: 2 }}
            >
              {avatarUploadError}
            </Alert>
          )}

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

            {/* Email field with change button */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                label="Email"
                value={user?.email ?? ''}
                fullWidth
                size="small"
                disabled
                sx={{ ...textFieldStyles, flex: 1 }}
              />
              <Button
                variant="outlined"
                onClick={handleOpenEmailDialog}
                startIcon={<Mail size={16} />}
                sx={{
                  mt: 0.5,
                  minWidth: 120,
                  height: 40,
                  textTransform: 'none',
                  borderRadius: '10px',
                  borderColor: colors.gold,
                  color: colors.gold,
                  '&:hover': {
                    borderColor: colors.goldHover,
                    bgcolor: colors.goldSoft,
                  },
                }}
              >
                Change
              </Button>
            </Box>

            <TextField
              label="Avatar URL"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              fullWidth
              size="small"
              placeholder="https://example.com/avatar.jpg"
              helperText="Enter a URL for your profile picture, or click the camera icon to upload"
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
        <>
          {/* Change Password Section */}
          <Paper
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              bgcolor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: 3,
              mb: 3,
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
                icon={<AlertCircle size={18} />}
                severity="info"
                sx={{ borderRadius: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', color: colors.info, mb: 2 }}
              >
                You signed in with {user?.provider}. You can set a password here for email/password login.
              </Alert>
            ) : null}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 440 }}>
              <TextField
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                fullWidth
                size="small"
                required={!isOAuthAccount}
                helperText={isOAuthAccount ? 'Optional for OAuth accounts setting initial password' : 'Required'}
                sx={textFieldStyles}
              />

              <TextField
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                size="small"
                required
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
                required
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
                disabled={changePasswordMutation.isPending || !newPassword || !confirmPassword || (!isOAuthAccount && !currentPassword)}
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
          </Paper>

          {/* ── Delete Account Danger Zone ────── */}
          <Paper
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              bgcolor: colors.card,
              border: `1px solid ${colors.error}40`,
              borderRadius: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Trash2 size={18} color={colors.error} />
              <Typography sx={{ fontWeight: 700, color: colors.error, fontSize: 16 }}>
                Delete Account
              </Typography>
            </Box>
            <Typography sx={{ color: colors.secondary, fontSize: 13, mb: 3 }}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </Typography>

            <Button
              variant="outlined"
              onClick={handleOpenDeleteDialog}
              startIcon={<Trash2 size={16} />}
              sx={{
                textTransform: 'none',
                borderRadius: '10px',
                borderColor: colors.error,
                color: colors.error,
                '&:hover': {
                  borderColor: colors.error,
                  bgcolor: colors.errorSoft,
                },
              }}
            >
              Delete My Account
            </Button>
          </Paper>
        </>
      )}

      {/* ── Email Change Dialog ───────────────── */}
      <Dialog
        open={emailDialogOpen}
        onClose={() => !changeEmailMutation.isPending && setEmailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: colors.text, fontWeight: 700 }}>
          Change Email Address
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Current Email"
              value={user?.email ?? ''}
              fullWidth
              size="small"
              disabled
              sx={textFieldStyles}
            />
            <TextField
              label="New Email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              fullWidth
              size="small"
              autoFocus
              sx={textFieldStyles}
            />
            {!isOAuthAccount && (
              <TextField
                label="Current Password"
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                fullWidth
                size="small"
                required
                helperText="Enter your current password to confirm the email change"
                sx={textFieldStyles}
              />
            )}

            {emailSuccess && (
              <Alert
                icon={<CheckCircle size={18} />}
                severity="success"
                sx={{ borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }}
              >
                {emailSuccess}
              </Alert>
            )}

            {emailError && (
              <Alert
                icon={<AlertCircle size={18} />}
                severity="error"
                sx={{ borderRadius: 2, bgcolor: 'rgba(244,67,54,0.1)', color: colors.error }}
              >
                {emailError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setEmailDialogOpen(false)}
            disabled={changeEmailMutation.isPending}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              color: colors.secondary,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleChangeEmail}
            disabled={changeEmailMutation.isPending || !canChangeEmail || !!emailSuccess}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              bgcolor: colors.gold,
              color: '#0A0F18',
              fontWeight: 700,
              '&:hover': { bgcolor: colors.goldHover },
              '&.Mui-disabled': { bgcolor: colors.gold, opacity: 0.6, color: '#0A0F18' },
            }}
          >
            {changeEmailMutation.isPending ? 'Changing...' : 'Change Email'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Account Confirmation Dialog ── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteAccountMutation.isPending && setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: colors.surface,
            border: `1px solid ${colors.error}40`,
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: colors.error, fontWeight: 700 }}>
          Delete Your Account
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Alert
              severity="warning"
              icon={<AlertCircle size={18} />}
              sx={{ borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', color: colors.warning }}
            >
              This will permanently delete your account and all associated data. This action cannot be undone.
            </Alert>

            <Typography sx={{ color: colors.text, fontSize: 14 }}>
              Type <strong>DELETE</strong> to confirm:
            </Typography>

            <TextField
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              fullWidth
              size="small"
              placeholder="DELETE"
              sx={textFieldStyles}
            />

            {!isOAuthAccount && (
              <TextField
                label="Current Password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                fullWidth
                size="small"
                required
                helperText="Enter your password to confirm deletion"
                sx={textFieldStyles}
              />
            )}

            {deleteError && (
              <Alert
                icon={<AlertCircle size={18} />}
                severity="error"
                sx={{ borderRadius: 2, bgcolor: 'rgba(244,67,54,0.1)', color: colors.error }}
              >
                {deleteError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteAccountMutation.isPending}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              color: colors.secondary,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteAccount}
            disabled={deleteAccountMutation.isPending || deleteConfirmation !== 'DELETE'}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              bgcolor: colors.error,
              color: '#fff',
              fontWeight: 700,
              '&:hover': { bgcolor: '#DC2626' },
              '&.Mui-disabled': { bgcolor: colors.error, opacity: 0.5, color: '#fff' },
            }}
          >
            {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete My Account'}
          </Button>
        </DialogActions>
      </Dialog>
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
