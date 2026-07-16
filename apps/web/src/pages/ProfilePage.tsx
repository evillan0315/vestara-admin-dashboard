import { useState, useEffect, useRef } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Grid,
  Switch,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  MenuItem,
} from '@mui/material';
import {
  User as UserIcon,
  Shield,
  ShieldCheck,
  KeyRound,
  Bell,
  Monitor,
  Smartphone,
  Clock,
  Camera,
  CheckCircle,
  AlertCircle,
  Mail,
  Trash2,
  Lock,
  Fingerprint,
  MapPin,
  Building2,
  FileText,
  Activity,
  LogOut,
  RefreshCw,
  Download,
  Upload,
  Settings,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import {
  useProfile,
  useUpdateProfile,
  useChangeEmail,
  useDeleteAccount,
} from '../features/profile/hooks';
import { uploadImage } from '../api/upload';
import { colors } from '../theme/tokens';

type TabValue = 'overview' | 'security' | 'permissions' | 'activity' | 'preferences' | 'sessions';

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

// ── Role card configuration ────────────────────
const roleCards = [
  {
    role: 'admin',
    label: 'Admin',
    description: 'Full system access with user management',
    color: colors.gold,
    bgColor: colors.goldSoft,
    permissions: ['User Management', 'Settings', 'Reports', 'Audit Logs'],
  },
  {
    role: 'moderator',
    label: 'Moderator',
    description: 'Content and user moderation capabilities',
    color: colors.purple,
    bgColor: colors.purpleSoft,
    permissions: ['Content Review', 'User Support', 'Basic Reports'],
  },
  {
    role: 'support',
    label: 'Support',
    description: 'Customer support and ticket management',
    color: colors.teal,
    bgColor: colors.tealSoft,
    permissions: ['Ticket Management', 'User Lookup', 'Basic Reports'],
  },
];

// ── Security items ─────────────────────────────
const securityItems = [
  {
    icon: KeyRound,
    label: 'Password',
    description: 'Last changed 30 days ago',
    status: 'Strong',
    statusColor: colors.success,
    action: 'Change',
  },
  {
    icon: Fingerprint,
    label: 'Two-Factor Authentication',
    description: 'Add an extra layer of security',
    status: 'Disabled',
    statusColor: colors.error,
    action: 'Enable',
  },
  {
    icon: Bell,
    label: 'Login Alerts',
    description: 'Get notified of new sign-ins',
    status: 'Enabled',
    statusColor: colors.success,
    action: 'Manage',
  },
  {
    icon: Monitor,
    label: 'Active Sessions',
    description: '2 devices currently signed in',
    status: '2 Active',
    statusColor: colors.info,
    action: 'Manage',
  },
  {
    icon: ShieldCheck,
    label: 'Trusted Devices',
    description: 'Devices you\'ve saved for future logins',
    status: '3 Devices',
    statusColor: colors.gold,
    action: 'Manage',
  },
];

// ── Permission items ───────────────────────────
const permissionGroups = [
  {
    category: 'User Management',
    items: [
      { name: 'Create Users', enabled: true },
      { name: 'Edit Users', enabled: true },
      { name: 'Delete Users', enabled: false },
      { name: 'Manage Roles', enabled: true },
    ],
  },
  {
    category: 'System Settings',
    items: [
      { name: 'View Settings', enabled: true },
      { name: 'Edit Settings', enabled: false },
      { name: 'Manage Organizations', enabled: true },
    ],
  },
  {
    category: 'Reports & Analytics',
    items: [
      { name: 'View Reports', enabled: true },
      { name: 'Export Data', enabled: true },
      { name: 'Schedule Reports', enabled: false },
    ],
  },
];

// ── Mock activity data ─────────────────────────
const recentActivity = [
  { action: 'Updated profile information', time: '2 hours ago', icon: UserIcon, color: colors.gold },
  { action: 'Changed password', time: '3 days ago', icon: KeyRound, color: colors.info },
  { action: 'Logged in from new device', time: '5 days ago', icon: Monitor, color: colors.success },
  { action: 'Exported user report', time: '1 week ago', icon: Download, color: colors.purple },
  { action: 'Updated organization settings', time: '2 weeks ago', icon: Settings, color: colors.teal },
];

// ── Mock sessions ──────────────────────────────
const activeSessions = [
  {
    device: 'MacBook Pro — Chrome',
    ip: '192.168.1.100',
    location: 'San Francisco, US',
    lastActive: 'Current session',
    icon: Monitor,
    isCurrent: true,
  },
  {
    device: 'iPhone 15 Pro — Safari',
    ip: '192.168.1.101',
    location: 'San Francisco, US',
    lastActive: '2 hours ago',
    icon: Smartphone,
    isCurrent: false,
  },
  {
    device: 'Windows Desktop — Firefox',
    ip: '10.0.0.55',
    location: 'New York, US',
    lastActive: '3 days ago',
    icon: Monitor,
    isCurrent: false,
  },
];

export default function ProfilePage() {
  const { user, updateUser, deleteAccount: clearAuth } = useAuth();
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const changeEmailMutation = useChangeEmail();
  const deleteAccountMutation = useDeleteAccount();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive initial tab from path
  const getInitialTab = (): TabValue => {
    const path = location.pathname;
    if (path === '/security') return 'security';
    if (path === '/permissions') return 'permissions';
    if (path === '/activity') return 'activity';
    if (path === '/preferences') return 'preferences';
    if (path === '/sessions') return 'sessions';
    return 'overview';
  };

  const [tab, setTab] = useState<TabValue>(getInitialTab());

  // ── General form state ─────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('Passionate about building great products and leading teams to success.');

  // ── Email change dialog state ───────────────
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  // ── Delete account state ────────────────────
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // ── Avatar upload state ─────────────────────
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState('');

  // ── Preferences state ──────────────────────
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

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
      window.location.href = '/login';
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ── Loading ─────────────────────────────────

  if (profileLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: colors.gold }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        style={{ display: 'none' }}
        onChange={handleAvatarUpload}
      />

      {/* ── Profile Header Card ─────────────────── */}
      <Paper
        sx={{
          p: { xs: 3, sm: 4 },
          bgcolor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 3,
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 100,
            background: `linear-gradient(135deg, ${colors.goldSoft} 0%, transparent 60%)`,
            pointerEvents: 'none',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, position: 'relative', zIndex: 1 }}>
          {/* Avatar */}
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={avatarUrl || undefined}
              sx={{
                width: 96,
                height: 96,
                bgcolor: colors.gold,
                color: '#0A0F18',
                fontWeight: 700,
                fontSize: 32,
                border: `3px solid ${colors.gold}`,
                boxShadow: `0 0 20px ${colors.goldSoft}`,
              }}
            >
              {initials}
            </Avatar>
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: colors.card,
                border: `2px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: colors.gold, borderColor: colors.gold, '& svg': { color: '#0A0F18' } },
              }}
            >
              {avatarUploading ? (
                <CircularProgress size={14} sx={{ color: colors.gold }} />
              ) : (
                <Camera size={14} color={colors.gold} />
              )}
            </Box>
          </Box>

          {/* User Info */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography sx={{ fontWeight: 700, color: colors.text, fontSize: 22 }}>
                {firstName} {lastName}
              </Typography>
              <Chip
                label={user?.role?.replace('_', ' ').toUpperCase()}
                size="small"
                sx={{
                  bgcolor: colors.goldSoft,
                  color: colors.gold,
                  fontWeight: 600,
                  fontSize: 11,
                  height: 24,
                  border: `1px solid ${colors.goldBorder}`,
                }}
              />
              <Chip
                label={user?.isActive ? 'Active' : 'Inactive'}
                size="small"
                icon={user?.isActive ? <CheckCircle size={12} /> : undefined}
                sx={{
                  bgcolor: user?.isActive ? colors.successSoft : colors.errorSoft,
                  color: user?.isActive ? colors.success : colors.error,
                  fontWeight: 600,
                  fontSize: 11,
                  height: 24,
                  border: `1px solid ${user?.isActive ? 'rgba(46, 160, 67, 0.25)' : 'rgba(218, 55, 67, 0.25)'}`,
                  '& .MuiChip-icon': { color: 'inherit' },
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Mail size={14} color={colors.secondary} />
                <Typography sx={{ color: colors.secondary, fontSize: 13 }}>{user?.email}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Building2 size={14} color={colors.secondary} />
                <Typography sx={{ color: colors.secondary, fontSize: 13 }}>Engineering</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <MapPin size={14} color={colors.secondary} />
                <Typography sx={{ color: colors.secondary, fontSize: 13 }}>San Francisco, CA</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Typography sx={{ color: colors.muted, fontSize: 12 }}>
                Member since {formatDate(user?.createdAt)}
              </Typography>
              {user?.lastLoginAt && (
                <Typography sx={{ color: colors.muted, fontSize: 12 }}>
                  Last login {formatDate(user?.lastLoginAt)}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Avatar upload error */}
          {avatarUploadError && (
            <Alert
              icon={<AlertCircle size={18} />}
              severity="error"
              sx={{ position: 'absolute', top: 0, right: 0, borderRadius: 2, bgcolor: 'rgba(244,67,54,0.1)', color: colors.error }}
            >
              {avatarUploadError}
            </Alert>
          )}
        </Box>
      </Paper>

      {/* ── Tabs ─────────────────────────────────── */}
      <Paper
        sx={{
          bgcolor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 3,
          mb: 3,
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: `1px solid ${colors.border}`,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 13,
              minHeight: 48,
              color: colors.secondary,
              '&.Mui-selected': { color: colors.gold },
            },
            '& .MuiTabs-indicator': { backgroundColor: colors.gold, height: 2 },
          }}
        >
          <Tab icon={<UserIcon size={16} />} iconPosition="start" label="Overview" value="overview" />
          <Tab icon={<Shield size={16} />} iconPosition="start" label="Security" value="security" />
          <Tab icon={<Lock size={16} />} iconPosition="start" label="Permissions" value="permissions" />
          <Tab icon={<Activity size={16} />} iconPosition="start" label="Activity" value="activity" />
          <Tab icon={<Settings size={16} />} iconPosition="start" label="Preferences" value="preferences" />
          <Tab icon={<Monitor size={16} />} iconPosition="start" label="Sessions" value="sessions" />
        </Tabs>

        {/* ── Overview Tab ───────────────────────── */}
        {tab === 'overview' && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Grid container spacing={3}>
              {/* About Card */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 3,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: colors.text, fontSize: 16, mb: 2.5 }}>
                    About
                  </Typography>

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
                        startIcon={<Mail size={14} />}
                        sx={{
                          mt: 0.5,
                          minWidth: 100,
                          height: 40,
                          textTransform: 'none',
                          borderRadius: '10px',
                          borderColor: colors.gold,
                          color: colors.gold,
                          fontWeight: 600,
                          fontSize: 13,
                          '&:hover': {
                            borderColor: colors.goldHover,
                            bgcolor: colors.goldSoft,
                          },
                        }}
                      >
                        Change
                      </Button>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                      <TextField
                        label="Department"
                        value="Engineering"
                        fullWidth
                        size="small"
                        disabled
                        sx={textFieldStyles}
                      />
                      <TextField
                        label="Position"
                        value="Administrator"
                        fullWidth
                        size="small"
                        disabled
                        sx={textFieldStyles}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                      <TextField
                        label="Location"
                        value="San Francisco, CA"
                        fullWidth
                        size="small"
                        disabled
                        sx={textFieldStyles}
                      />
                      <TextField
                        label="Timezone"
                        value="Pacific Time (UTC-8)"
                        fullWidth
                        size="small"
                        disabled
                        sx={textFieldStyles}
                      />
                    </Box>

                    <TextField
                      label="Bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      fullWidth
                      size="small"
                      multiline
                      rows={3}
                      sx={textFieldStyles}
                    />

                    {/* Success/Error Messages */}
                    {updateProfileMutation.isSuccess && (
                      <Alert
                        icon={<CheckCircle size={18} />}
                        severity="success"
                        sx={{ borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }}
                      >
                        Profile updated successfully
                      </Alert>
                    )}

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
              </Grid>

              {/* Role & Permissions Card */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 3,
                    mb: 3,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: colors.text, fontSize: 16, mb: 2 }}>
                    Role & Permissions
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {roleCards.map((rc) => {
                      const isActive = user?.role === rc.role;
                      return (
                        <Box
                          key={rc.role}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: isActive ? rc.bgColor : 'transparent',
                            border: `1px solid ${isActive ? rc.color : colors.border}`,
                            transition: 'all 0.2s',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: rc.color,
                              }}
                            />
                            <Typography sx={{ fontWeight: 600, color: isActive ? rc.color : colors.text, fontSize: 13 }}>
                              {rc.label}
                            </Typography>
                            {isActive && (
                              <Chip
                                label="Current"
                                size="small"
                                sx={{
                                  ml: 'auto',
                                  height: 20,
                                  fontSize: 10,
                                  bgcolor: rc.color,
                                  color: '#0A0F18',
                                  fontWeight: 600,
                                }}
                              />
                            )}
                          </Box>
                          <Typography sx={{ color: colors.secondary, fontSize: 11, mb: 0.5 }}>
                            {rc.description}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {rc.permissions.map((p) => (
                              <Typography
                                key={p}
                                sx={{
                                  fontSize: 10,
                                  color: isActive ? rc.color : colors.muted,
                                  bgcolor: isActive ? `${rc.color}15` : 'transparent',
                                  px: 0.75,
                                  py: 0.25,
                                  borderRadius: 0.5,
                                }}
                              >
                                {p}
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>

                {/* Account Summary Card */}
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 3,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: colors.text, fontSize: 16, mb: 2 }}>
                    Account Summary
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {[
                      { label: 'Total Logins', value: '142', icon: LogOut },
                      { label: 'Files Uploaded', value: '23', icon: Upload },
                      { label: 'Reports Generated', value: '8', icon: FileText },
                      { label: 'Active Sessions', value: '2', icon: Monitor },
                    ].map((item) => (
                      <Box
                        key={item.label}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 1,
                          borderBottom: `1px solid ${colors.border}`,
                          '&:last-child': { borderBottom: 'none' },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <item.icon size={14} color={colors.secondary} />
                          <Typography sx={{ color: colors.secondary, fontSize: 13 }}>
                            {item.label}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: 14 }}>
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* ── Security Tab ──────────────────────── */}
        {tab === 'security' && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Grid container spacing={3}>
              {/* Security Overview */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 3,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: colors.text, fontSize: 16, mb: 0.5 }}>
                    Security Overview
                  </Typography>
                  <Typography sx={{ color: colors.secondary, fontSize: 13, mb: 3 }}>
                    Manage your account security settings and authentication methods
                  </Typography>

                  <List disablePadding>
                    {securityItems.map((item, index) => (
                      <ListItem
                        key={item.label}
                        sx={{
                          px: 0,
                          py: 1.5,
                          borderBottom: index < securityItems.length - 1 ? `1px solid ${colors.border}` : 'none',
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 2,
                              bgcolor: colors.cardAlt,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <item.icon size={18} color={colors.gold} />
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: 14 }}>
                              {item.label}
                            </Typography>
                          }
                          secondary={
                            <Typography sx={{ color: colors.secondary, fontSize: 12 }}>
                              {item.description}
                            </Typography>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography sx={{ color: item.statusColor, fontSize: 12, fontWeight: 600 }}>
                              {item.status}
                            </Typography>
                            <Button
                              variant="outlined"
                              size="small"
                              sx={{
                                textTransform: 'none',
                                borderRadius: '8px',
                                borderColor: colors.gold,
                                color: colors.gold,
                                fontWeight: 600,
                                fontSize: 12,
                                py: 0.5,
                                px: 1.5,
                                minWidth: 70,
                                '&:hover': {
                                  borderColor: colors.goldHover,
                                  bgcolor: colors.goldSoft,
                                },
                              }}
                            >
                              {item.action}
                            </Button>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              {/* Quick Actions */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 3,
                    mb: 3,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: colors.text, fontSize: 16, mb: 2 }}>
                    Quick Actions
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {[
                      { label: 'Change Password', icon: KeyRound, color: colors.gold },
                      { label: 'Enable 2FA', icon: Fingerprint, color: colors.purple },
                      { label: 'Download Data', icon: Download, color: colors.info },
                      { label: 'View Login History', icon: Clock, color: colors.teal },
                    ].map((action) => (
                      <Button
                        key={action.label}
                        variant="outlined"
                        startIcon={<action.icon size={16} />}
                        fullWidth
                        sx={{
                          justifyContent: 'flex-start',
                          textTransform: 'none',
                          borderRadius: '10px',
                          borderColor: colors.border,
                          color: colors.text,
                          fontWeight: 500,
                          fontSize: 13,
                          py: 1.2,
                          '&:hover': {
                            borderColor: action.color,
                            color: action.color,
                            bgcolor: `${action.color}10`,
                          },
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Box>
                </Paper>

                {/* Danger Zone */}
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: colors.card,
                    border: `1px solid ${colors.error}40`,
                    borderRadius: 3,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AlertCircle size={16} color={colors.error} />
                    <Typography sx={{ fontWeight: 700, color: colors.error, fontSize: 14 }}>
                      Danger Zone
                    </Typography>
                  </Box>
                  <Typography sx={{ color: colors.secondary, fontSize: 12, mb: 2 }}>
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={handleOpenDeleteDialog}
                    startIcon={<Trash2 size={14} />}
                    fullWidth
                    sx={{
                      textTransform: 'none',
                      borderRadius: '10px',
                      borderColor: colors.error,
                      color: colors.error,
                      fontWeight: 600,
                      fontSize: 13,
                      '&:hover': {
                        borderColor: colors.error,
                        bgcolor: colors.errorSoft,
                      },
                    }}
                  >
                    Delete Account
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* ── Permissions Tab ───────────────────── */}
        {tab === 'permissions' && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Paper
              sx={{
                p: 3,
                bgcolor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 3,
              }}
            >
              <Typography sx={{ fontWeight: 700, color: colors.text, fontSize: 16, mb: 0.5 }}>
                Permissions
              </Typography>
              <Typography sx={{ color: colors.secondary, fontSize: 13, mb: 3 }}>
                View your current role permissions. Contact an administrator to request changes.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {permissionGroups.map((group) => (
                  <Box key={group.category}>
                    <Typography sx={{ fontWeight: 600, color: colors.gold, fontSize: 14, mb: 1.5 }}>
                      {group.category}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {group.items.map((item) => (
                        <Box
                          key={item.name}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            py: 1,
                            px: 1.5,
                            borderRadius: 1.5,
                            bgcolor: item.enabled ? colors.goldSoft : 'transparent',
                            border: `1px solid ${item.enabled ? colors.goldBorder : colors.border}`,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {item.enabled ? (
                              <CheckCircle size={16} color={colors.gold} />
                            ) : (
                              <Lock size={16} color={colors.muted} />
                            )}
                            <Typography
                              sx={{
                                fontSize: 13,
                                color: item.enabled ? colors.text : colors.muted,
                                fontWeight: item.enabled ? 500 : 400,
                              }}
                            >
                              {item.name}
                            </Typography>
                          </Box>
                          <Chip
                            label={item.enabled ? 'Granted' : 'Denied'}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: 11,
                              fontWeight: 600,
                              bgcolor: item.enabled ? colors.successSoft : colors.errorSoft,
                              color: item.enabled ? colors.success : colors.error,
                              border: `1px solid ${item.enabled ? 'rgba(46, 160, 67, 0.25)' : 'rgba(218, 55, 67, 0.25)'}`,
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        )}

        {/* ── Activity Tab ──────────────────────── */}
        {tab === 'activity' && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Paper
              sx={{
                p: 3,
                bgcolor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, color: colors.text, fontSize: 16, mb: 0.5 }}>
                    Recent Activity
                  </Typography>
                  <Typography sx={{ color: colors.secondary, fontSize: 13 }}>
                    Your recent actions and events
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<RefreshCw size={14} />}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '10px',
                    borderColor: colors.border,
                    color: colors.secondary,
                    fontWeight: 500,
                    fontSize: 12,
                    '&:hover': { borderColor: colors.gold, color: colors.gold },
                  }}
                >
                  Refresh
                </Button>
              </Box>

              <List disablePadding>
                {recentActivity.map((item, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      px: 0,
                      py: 1.5,
                      borderBottom: index < recentActivity.length - 1 ? `1px solid ${colors.border}` : 'none',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 2,
                          bgcolor: `${item.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <item.icon size={18} color={item.color} />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography sx={{ fontWeight: 500, color: colors.text, fontSize: 13 }}>
                          {item.action}
                        </Typography>
                      }
                      secondary={
                        <Typography sx={{ color: colors.muted, fontSize: 11 }}>
                          {item.time}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        )}

        {/* ── Preferences Tab ───────────────────── */}
        {tab === 'preferences' && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 3,
                    mb: 3,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: colors.text, fontSize: 16, mb: 2.5 }}>
                    Notifications
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {[
                      { label: 'Email Notifications', desc: 'Receive updates via email', checked: emailNotifications, onChange: setEmailNotifications },
                      { label: 'Push Notifications', desc: 'Receive push notifications in browser', checked: pushNotifications, onChange: setPushNotifications },
                      { label: 'Login Alerts', desc: 'Get notified of new sign-ins', checked: loginAlerts, onChange: setLoginAlerts },
                      { label: 'Marketing Emails', desc: 'Receive product updates and offers', checked: marketingEmails, onChange: setMarketingEmails },
                    ].map((pref) => (
                      <Box
                        key={pref.label}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 1.5,
                          borderBottom: `1px solid ${colors.border}`,
                          '&:last-child': { borderBottom: 'none' },
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontWeight: 500, color: colors.text, fontSize: 14 }}>
                            {pref.label}
                          </Typography>
                          <Typography sx={{ color: colors.secondary, fontSize: 12 }}>
                            {pref.desc}
                          </Typography>
                        </Box>
                        <Switch
                          checked={pref.checked}
                          onChange={(e) => pref.onChange(e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: colors.gold },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: colors.gold },
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 3,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: colors.text, fontSize: 16, mb: 2.5 }}>
                    Appearance
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 500, color: colors.text, fontSize: 13, mb: 1 }}>
                        Language
                      </Typography>
                      <TextField
                        select
                        value="en"
                        fullWidth
                        size="small"
                        sx={textFieldStyles}
                      >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="es">Spanish</MenuItem>
                        <MenuItem value="fr">French</MenuItem>
                        <MenuItem value="de">German</MenuItem>
                      </TextField>
                    </Box>

                    <Box>
                      <Typography sx={{ fontWeight: 500, color: colors.text, fontSize: 13, mb: 1 }}>
                        Timezone
                      </Typography>
                      <TextField
                        select
                        value="pst"
                        fullWidth
                        size="small"
                        sx={textFieldStyles}
                      >
                        <MenuItem value="pst">Pacific Time (UTC-8)</MenuItem>
                        <MenuItem value="est">Eastern Time (UTC-5)</MenuItem>
                        <MenuItem value="utc">UTC</MenuItem>
                        <MenuItem value="cet">Central European Time (UTC+1)</MenuItem>
                      </TextField>
                    </Box>

                    <Box>
                      <Typography sx={{ fontWeight: 500, color: colors.text, fontSize: 13, mb: 1 }}>
                        Date Format
                      </Typography>
                      <TextField
                        select
                        value="mdy"
                        fullWidth
                        size="small"
                        sx={textFieldStyles}
                      >
                        <MenuItem value="mdy">MM/DD/YYYY</MenuItem>
                        <MenuItem value="dmy">DD/MM/YYYY</MenuItem>
                        <MenuItem value="ymd">YYYY-MM-DD</MenuItem>
                      </TextField>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* ── Sessions Tab ──────────────────────── */}
        {tab === 'sessions' && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Paper
              sx={{
                p: 3,
                bgcolor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, color: colors.text, fontSize: 16, mb: 0.5 }}>
                    Active Sessions
                  </Typography>
                  <Typography sx={{ color: colors.secondary, fontSize: 13 }}>
                    Devices currently signed in to your account
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<LogOut size={14} />}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '10px',
                    borderColor: colors.error,
                    color: colors.error,
                    fontWeight: 600,
                    fontSize: 12,
                    '&:hover': { bgcolor: colors.errorSoft },
                  }}
                >
                  Sign Out All
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {activeSessions.map((session, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: session.isCurrent ? colors.goldSoft : 'transparent',
                      border: `1px solid ${session.isCurrent ? colors.goldBorder : colors.border}`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: session.isCurrent ? `${colors.gold}20` : colors.cardAlt,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <session.icon size={20} color={session.isCurrent ? colors.gold : colors.secondary} />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: 13 }}>
                          {session.device}
                        </Typography>
                        {session.isCurrent && (
                          <Chip
                            label="Current"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: 10,
                              bgcolor: colors.gold,
                              color: '#0A0F18',
                              fontWeight: 600,
                            }}
                          />
                        )}
                      </Box>
                      <Typography sx={{ color: colors.secondary, fontSize: 11 }}>
                        {session.ip} • {session.location} • {session.lastActive}
                      </Typography>
                    </Box>

                    {!session.isCurrent && (
                      <IconButton
                        size="small"
                        sx={{
                          color: colors.error,
                          '&:hover': { bgcolor: colors.errorSoft },
                        }}
                      >
                        <LogOut size={16} />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        )}
      </Paper>

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
