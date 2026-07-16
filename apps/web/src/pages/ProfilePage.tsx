import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Chip, IconButton, Grid, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Switch, TextField, useTheme, alpha, type SxProps } from '@mui/material';
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
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tabs, TabPanel } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { StatCard } from '../components/data/StatCard';
import { ActivityFeed, type ActivityItem } from '../components/data/ActivityFeed';
import { Loading } from '../components/feedback/Loading';
import { useToast } from '../components/feedback/Toast';

type TabValue = 'overview' | 'security' | 'permissions' | 'activity' | 'preferences' | 'sessions';

// ── Role card configuration ────────────────────
const roleCards = [
  {
    role: 'admin',
    label: 'Admin',
    description: 'Full system access with user management',
    color: 'warning' as const,
    permissions: ['User Management', 'Settings', 'Reports', 'Audit Logs'],
  },
  {
    role: 'moderator',
    label: 'Moderator',
    description: 'Content and user moderation capabilities',
    color: 'secondary' as const,
    permissions: ['Content Review', 'User Support', 'Basic Reports'],
  },
  {
    role: 'support',
    label: 'Support',
    description: 'Customer support and ticket management',
    color: 'success' as const,
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
    statusColor: 'success' as const,
    action: 'Change',
  },
  {
    icon: Fingerprint,
    label: 'Two-Factor Authentication',
    description: 'Add an extra layer of security',
    status: 'Disabled',
    statusColor: 'error' as const,
    action: 'Enable',
  },
  {
    icon: Bell,
    label: 'Login Alerts',
    description: 'Get notified of new sign-ins',
    status: 'Enabled',
    statusColor: 'success' as const,
    action: 'Manage',
  },
  {
    icon: Monitor,
    label: 'Active Sessions',
    description: '2 devices currently signed in',
    status: '2 Active',
    statusColor: 'info' as const,
    action: 'Manage',
  },
  {
    icon: ShieldCheck,
    label: 'Trusted Devices',
    description: 'Devices you\'ve saved for future logins',
    status: '3 Devices',
    statusColor: 'warning' as const,
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
const recentActivity: ActivityItem[] = [
  { id: '1', user: { name: 'Updated profile information', initials: 'U' }, action: '', timestamp: '2 hours ago', icon: <UserIcon size={14} />, iconColor: 'primary' },
  { id: '2', user: { name: 'Changed password', initials: 'P' }, action: '', timestamp: '3 days ago', icon: <KeyRound size={14} />, iconColor: 'info' },
  { id: '3', user: { name: 'Logged in from new device', initials: 'L' }, action: '', timestamp: '5 days ago', icon: <Monitor size={14} />, iconColor: 'success' },
  { id: '4', user: { name: 'Exported user report', initials: 'E' }, action: '', timestamp: '1 week ago', icon: <Download size={14} />, iconColor: 'secondary' },
  { id: '5', user: { name: 'Updated organization settings', initials: 'S' }, action: '', timestamp: '2 weeks ago', icon: <Settings size={14} />, iconColor: 'success' },
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
  const theme = useTheme();
  const { primary, text, divider, success, error, background } = theme.palette;
  const { user, updateUser, deleteAccount: clearAuth } = useAuth();
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const changeEmailMutation = useChangeEmail();
  const deleteAccountMutation = useDeleteAccount();
  const { showSuccess, showError } = useToast();
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
      showSuccess('Profile updated successfully');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update profile');
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
        showSuccess('Profile photo updated');
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

  // ── Shared field styles ─────────────────────
  const fieldSx: SxProps = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      bgcolor: background.paper,
      color: text.primary,
      '& fieldset': { borderColor: divider },
      '&:hover fieldset': { borderColor: primary.main },
      '&.Mui-focused fieldset': { borderColor: primary.main, borderWidth: 1.5 },
    },
    '& .MuiInputLabel-root': { color: text.secondary },
    '& .MuiInputLabel-root.Mui-focused': { color: primary.main },
    '& .MuiFormHelperText-root': { color: text.disabled },
    '& .Mui-disabled': {
      '& .MuiOutlinedInput-notchedOutline': { borderColor: `${divider} !important` },
      '& .MuiOutlinedInput-input': { color: text.disabled },
    },
  };

  // ── Loading ─────────────────────────────────

  if (profileLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Loading size="large" message="Loading your profile..." />
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
      <Card
        sx={{
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
            background: `linear-gradient(135deg, ${alpha(primary.main, 0.1)} 0%, transparent 60%)`,
            pointerEvents: 'none',
          },
        }}
      >
        <Box sx={{ p: { xs: 3, sm: 4 }, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
            {/* Avatar */}
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={avatarUrl || undefined}
                sx={{
                  width: 96,
                  height: 96,
                  fontSize: 32,
                  border: `3px solid ${primary.main}`,
                  boxShadow: `0 0 20px ${alpha(primary.main, 0.25)}`,
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
                  bgcolor: background.paper,
                  border: `2px solid ${divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: primary.main, borderColor: primary.main, '& svg': { color: primary.contrastText } },
                }}
              >
                {avatarUploading ? (
                  <Loading variant="spinner" size="small" />
                ) : (
                  <Camera size={14} color={primary.main} />
                )}
              </Box>
            </Box>

            {/* User Info */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                <Box component="h1" sx={{ fontWeight: 700, color: text.primary, fontSize: 22, m: 0 }}>
                  {firstName} {lastName}
                </Box>
                <Chip
                  label={user?.role?.replace('_', ' ').toUpperCase()}
                  size="small"
                  sx={{
                    bgcolor: alpha(primary.main, 0.12),
                    color: primary.main,
                    fontWeight: 600,
                    fontSize: 11,
                    height: 24,
                    border: `1px solid ${alpha(primary.main, 0.25)}`,
                  }}
                />
                <Chip
                  label={user?.isActive ? 'Active' : 'Inactive'}
                  size="small"
                  icon={user?.isActive ? <CheckCircle size={12} /> : undefined}
                  sx={{
                    bgcolor: user?.isActive ? alpha(success.main, 0.12) : alpha(error.main, 0.12),
                    color: user?.isActive ? success.main : error.main,
                    fontWeight: 600,
                    fontSize: 11,
                    height: 24,
                    border: `1px solid ${user?.isActive ? alpha(success.main, 0.25) : alpha(error.main, 0.25)}`,
                    '& .MuiChip-icon': { color: 'inherit' },
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Mail size={14} color={text.secondary} />
                  <Box component="span" sx={{ color: text.secondary, fontSize: 13 }}>{user?.email}</Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Building2 size={14} color={text.secondary} />
                  <Box component="span" sx={{ color: text.secondary, fontSize: 13 }}>Engineering</Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MapPin size={14} color={text.secondary} />
                  <Box component="span" sx={{ color: text.secondary, fontSize: 13 }}>San Francisco, CA</Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Box component="span" sx={{ color: text.disabled, fontSize: 12 }}>
                  Member since {formatDate(user?.createdAt)}
                </Box>
                {user?.lastLoginAt && (
                  <Box component="span" sx={{ color: text.disabled, fontSize: 12 }}>
                    Last login {formatDate(user?.lastLoginAt)}
                  </Box>
                )}
              </Box>
            </Box>

            {/* Avatar upload error */}
            {avatarUploadError && (
              <Chip
                icon={<AlertCircle size={14} />}
                label={avatarUploadError}
                color="error"
                size="small"
                variant="outlined"
                sx={{ position: 'absolute', top: 0, right: 0 }}
              />
            )}
          </Box>
        </Box>
      </Card>

      {/* ── Tabs ─────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(v) => setTab(v as TabValue)}
          variant="scrollable"
          items={[
            { label: 'Overview', value: 'overview', icon: <UserIcon size={16} /> },
            { label: 'Security', value: 'security', icon: <Shield size={16} /> },
            { label: 'Permissions', value: 'permissions', icon: <Lock size={16} /> },
            { label: 'Activity', value: 'activity', icon: <Activity size={16} /> },
            { label: 'Preferences', value: 'preferences', icon: <Settings size={16} /> },
            { label: 'Sessions', value: 'sessions', icon: <Monitor size={16} /> },
          ]}
          sx={{
            px: 2,
            borderBottom: `1px solid ${divider}`,
            '& .MuiTabs-indicator': { backgroundColor: primary.main },
            '& .MuiTab-root.Mui-selected': { color: primary.main },
          }}
        />

        {/* ── Overview Tab ───────────────────────── */}
        <TabPanel value="overview" currentValue={tab}>
          <Grid container spacing={3}>
            {/* About Card */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Card>
                <Box sx={{ p: 3 }}>
                  <Box component="h2" sx={{ fontWeight: 700, color: text.primary, fontSize: 16, m: 0, mb: 2.5 }}>
                    About
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                      <TextField
                        label="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        fullWidth
                        size="small"
                        sx={fieldSx}
                      />
                      <TextField
                        label="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        fullWidth
                        size="small"
                        sx={fieldSx}
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
                        sx={{ ...fieldSx, flex: 1 }}
                      />
                      <Button
                        variant="outlined"
                        onClick={handleOpenEmailDialog}
                        startIcon={<Mail size={14} />}
                        sx={{ mt: 0.5, minWidth: 100, height: 40 }}
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
                        sx={fieldSx}
                      />
                      <TextField
                        label="Position"
                        value="Administrator"
                        fullWidth
                        size="small"
                        disabled
                        sx={fieldSx}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                      <TextField
                        label="Location"
                        value="San Francisco, CA"
                        fullWidth
                        size="small"
                        disabled
                        sx={fieldSx}
                      />
                      <TextField
                        label="Timezone"
                        value="Pacific Time (UTC-8)"
                        fullWidth
                        size="small"
                        disabled
                        sx={fieldSx}
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
                      sx={fieldSx}
                    />

                    <Button
                      variant="contained"
                      onClick={handleUpdateProfile}
                      loading={updateProfileMutation.isPending}
                      sx={{ alignSelf: 'flex-start', mt: 1 }}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Role & Permissions Card */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ mb: 3 }}>
                <Box sx={{ p: 3 }}>
                  <Box component="h2" sx={{ fontWeight: 700, color: text.primary, fontSize: 16, m: 0, mb: 2 }}>
                    Role & Permissions
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {roleCards.map((rc) => {
                      const isActive = user?.role === rc.role;
                      const rcColor = theme.palette[rc.color].main;
                      const rcSoft = alpha(theme.palette[rc.color].main, 0.12);
                      return (
                        <Box
                          key={rc.role}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: isActive ? rcSoft : 'transparent',
                            border: `1px solid ${isActive ? rcColor : divider}`,
                            transition: 'all 0.2s',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: rcColor }} />
                            <Box component="span" sx={{ fontWeight: 600, color: isActive ? rcColor : text.primary, fontSize: 13 }}>
                              {rc.label}
                            </Box>
                            {isActive && (
                              <Chip
                                label="Current"
                                size="small"
                                sx={{ ml: 'auto', height: 20, fontSize: 10, bgcolor: rcColor, color: theme.palette[rc.color].contrastText, fontWeight: 600 }}
                              />
                            )}
                          </Box>
                          <Box component="p" sx={{ color: text.secondary, fontSize: 11, m: 0, mb: 0.5 }}>
                            {rc.description}
                          </Box>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {rc.permissions.map((p) => (
                              <Box
                                key={p}
                                component="span"
                                sx={{
                                  fontSize: 10,
                                  color: isActive ? rcColor : text.disabled,
                                  bgcolor: isActive ? alpha(rcColor, 0.15) : 'transparent',
                                  px: 0.75,
                                  py: 0.25,
                                  borderRadius: 0.5,
                                }}
                              >
                                {p}
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Card>

              {/* Account Summary Card */}
              <Card>
                <Box sx={{ p: 3 }}>
                  <Box component="h2" sx={{ fontWeight: 700, color: text.primary, fontSize: 16, m: 0, mb: 2 }}>
                    Account Summary
                  </Box>
                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <StatCard title="Total Logins" value="142" icon={<LogOut size={20} />} iconColor="primary" />
                    </Grid>
                    <Grid size={6}>
                      <StatCard title="Files" value="23" icon={<Upload size={20} />} iconColor="info" />
                    </Grid>
                    <Grid size={6}>
                      <StatCard title="Reports" value="8" icon={<FileText size={20} />} iconColor="secondary" />
                    </Grid>
                    <Grid size={6}>
                      <StatCard title="Sessions" value="2" icon={<Monitor size={20} />} iconColor="success" />
                    </Grid>
                  </Grid>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* ── Security Tab ──────────────────────── */}
        <TabPanel value="security" currentValue={tab}>
          <Grid container spacing={3}>
            {/* Security Overview */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Card>
                <Box sx={{ p: 3 }}>
                  <Box component="h2" sx={{ fontWeight: 700, color: text.primary, fontSize: 16, m: 0, mb: 0.5 }}>
                    Security Overview
                  </Box>
                  <Box component="p" sx={{ color: text.secondary, fontSize: 13, m: 0, mb: 3 }}>
                    Manage your account security settings and authentication methods
                  </Box>

                  <List disablePadding>
                    {securityItems.map((item, index) => {
                      const scColor = theme.palette[item.statusColor].main;
                      return (
                        <ListItem
                          key={item.label}
                          sx={{
                            px: 0,
                            py: 1.5,
                            borderBottom: index < securityItems.length - 1 ? `1px solid ${divider}` : 'none',
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                bgcolor: alpha(primary.main, 0.12),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <item.icon size={18} color={primary.main} />
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={<Box component="span" sx={{ fontWeight: 600, color: text.primary, fontSize: 14 }}>{item.label}</Box>}
                            secondary={<Box component="span" sx={{ color: text.secondary, fontSize: 12 }}>{item.description}</Box>}
                          />
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box component="span" sx={{ color: scColor, fontSize: 12, fontWeight: 600 }}>{item.status}</Box>
                              <Button
                                variant="outlined"
                                size="small"
                                sx={{ minWidth: 70, py: 0.5, px: 1.5 }}
                              >
                                {item.action}
                              </Button>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ mb: 3 }}>
                <Box sx={{ p: 3 }}>
                  <Box component="h2" sx={{ fontWeight: 700, color: text.primary, fontSize: 16, m: 0, mb: 2 }}>
                    Quick Actions
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {[
                      { label: 'Change Password', icon: KeyRound, color: 'warning' as const },
                      { label: 'Enable 2FA', icon: Fingerprint, color: 'secondary' as const },
                      { label: 'Download Data', icon: Download, color: 'info' as const },
                      { label: 'View Login History', icon: Clock, color: 'success' as const },
                    ].map((action) => (
                      <Button
                        key={action.label}
                        variant="outlined"
                        startIcon={<action.icon size={16} />}
                        fullWidth
                        sx={{ justifyContent: 'flex-start', py: 1.2 }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Box>
                </Box>
              </Card>

              {/* Danger Zone */}
              <Card sx={{ borderColor: alpha(error.main, 0.4) }}>
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AlertCircle size={16} color={error.main} />
                    <Box component="h2" sx={{ fontWeight: 700, color: error.main, fontSize: 14, m: 0 }}>
                      Danger Zone
                    </Box>
                  </Box>
                  <Box component="p" sx={{ color: text.secondary, fontSize: 12, m: 0, mb: 2 }}>
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={handleOpenDeleteDialog}
                    startIcon={<Trash2 size={14} />}
                    fullWidth
                    sx={{ color: error.main, borderColor: error.main, '&:hover': { bgcolor: alpha(error.main, 0.12) } }}
                  >
                    Delete Account
                  </Button>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* ── Permissions Tab ───────────────────── */}
        <TabPanel value="permissions" currentValue={tab}>
          <Card>
            <Box sx={{ p: 3 }}>
              <Box component="h2" sx={{ fontWeight: 700, color: text.primary, fontSize: 16, m: 0, mb: 0.5 }}>
                Permissions
              </Box>
              <Box component="p" sx={{ color: text.secondary, fontSize: 13, m: 0, mb: 3 }}>
                View your current role permissions. Contact an administrator to request changes.
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {permissionGroups.map((group) => (
                  <Box key={group.category}>
                    <Box component="h3" sx={{ fontWeight: 600, color: primary.main, fontSize: 14, m: 0, mb: 1.5 }}>
                      {group.category}
                    </Box>
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
                            bgcolor: item.enabled ? alpha(primary.main, 0.08) : 'transparent',
                            border: `1px solid ${item.enabled ? alpha(primary.main, 0.25) : divider}`,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {item.enabled ? (
                              <CheckCircle size={16} color={primary.main} />
                            ) : (
                              <Lock size={16} color={text.disabled} />
                            )}
                            <Box component="span" sx={{ fontSize: 13, color: item.enabled ? text.primary : text.disabled, fontWeight: item.enabled ? 500 : 400 }}>
                              {item.name}
                            </Box>
                          </Box>
                          <Chip
                            label={item.enabled ? 'Granted' : 'Denied'}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: 11,
                              fontWeight: 600,
                              bgcolor: item.enabled ? alpha(success.main, 0.12) : alpha(error.main, 0.12),
                              color: item.enabled ? success.main : error.main,
                              border: `1px solid ${item.enabled ? alpha(success.main, 0.25) : alpha(error.main, 0.25)}`,
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Card>
        </TabPanel>

        {/* ── Activity Tab ──────────────────────── */}
        <TabPanel value="activity" currentValue={tab}>
          <Card>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3, pb: 2 }}>
              <Box>
                <Box component="h2" sx={{ fontWeight: 700, color: text.primary, fontSize: 16, m: 0, mb: 0.5 }}>
                  Recent Activity
                </Box>
                <Box component="p" sx={{ color: text.secondary, fontSize: 13, m: 0 }}>
                  Your recent actions and events
                </Box>
              </Box>
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={14} />}
                size="small"
              >
                Refresh
              </Button>
            </Box>
            <ActivityFeed items={recentActivity} title="" />
          </Card>
        </TabPanel>

        {/* ── Preferences Tab ───────────────────── */}
        <TabPanel value="preferences" currentValue={tab}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ mb: 3 }}>
                <Box sx={{ p: 3 }}>
                  <Box component="h2" sx={{ fontWeight: 700, color: text.primary, fontSize: 16, m: 0, mb: 2.5 }}>
                    Notifications
                  </Box>
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
                          borderBottom: `1px solid ${divider}`,
                          '&:last-child': { borderBottom: 'none' },
                        }}
                      >
                        <Box>
                          <Box component="p" sx={{ fontWeight: 500, color: text.primary, fontSize: 14, m: 0 }}>{pref.label}</Box>
                          <Box component="p" sx={{ color: text.secondary, fontSize: 12, m: 0 }}>{pref.desc}</Box>
                        </Box>
                        <Switch
                          checked={pref.checked}
                          onChange={(e) => pref.onChange(e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: primary.main },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: primary.main },
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <Box sx={{ p: 3 }}>
                  <Box component="h2" sx={{ fontWeight: 700, color: text.primary, fontSize: 16, m: 0, mb: 2.5 }}>
                    Appearance
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box>
                      <Box component="p" sx={{ fontWeight: 500, color: text.primary, fontSize: 13, m: 0, mb: 1 }}>Language</Box>
                      <TextField select value="en" fullWidth size="small" sx={fieldSx}>
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </TextField>
                    </Box>
                    <Box>
                      <Box component="p" sx={{ fontWeight: 500, color: text.primary, fontSize: 13, m: 0, mb: 1 }}>Timezone</Box>
                      <TextField select value="pst" fullWidth size="small" sx={fieldSx}>
                        <option value="pst">Pacific Time (UTC-8)</option>
                        <option value="est">Eastern Time (UTC-5)</option>
                        <option value="utc">UTC</option>
                        <option value="cet">Central European Time (UTC+1)</option>
                      </TextField>
                    </Box>
                    <Box>
                      <Box component="p" sx={{ fontWeight: 500, color: text.primary, fontSize: 13, m: 0, mb: 1 }}>Date Format</Box>
                      <TextField select value="mdy" fullWidth size="small" sx={fieldSx}>
                        <option value="mdy">MM/DD/YYYY</option>
                        <option value="dmy">DD/MM/YYYY</option>
                        <option value="ymd">YYYY-MM-DD</option>
                      </TextField>
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* ── Sessions Tab ──────────────────────── */}
        <TabPanel value="sessions" currentValue={tab}>
          <Card>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Box component="h2" sx={{ fontWeight: 700, color: text.primary, fontSize: 16, m: 0, mb: 0.5 }}>
                    Active Sessions
                  </Box>
                  <Box component="p" sx={{ color: text.secondary, fontSize: 13, m: 0 }}>
                    Devices currently signed in to your account
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<LogOut size={14} />}
                  sx={{ color: error.main, borderColor: error.main, '&:hover': { bgcolor: alpha(error.main, 0.12) } }}
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
                      bgcolor: session.isCurrent ? alpha(primary.main, 0.08) : 'transparent',
                      border: `1px solid ${session.isCurrent ? alpha(primary.main, 0.25) : divider}`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: session.isCurrent ? alpha(primary.main, 0.2) : background.paper,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <session.icon size={20} color={session.isCurrent ? primary.main : text.secondary} />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box component="span" sx={{ fontWeight: 600, color: text.primary, fontSize: 13 }}>{session.device}</Box>
                        {session.isCurrent && (
                          <Chip label="Current" size="small" sx={{ height: 20, fontSize: 10, bgcolor: primary.main, color: primary.contrastText, fontWeight: 600 }} />
                        )}
                      </Box>
                      <Box component="span" sx={{ color: text.secondary, fontSize: 11 }}>
                        {session.ip} • {session.location} • {session.lastActive}
                      </Box>
                    </Box>

                    {!session.isCurrent && (
                      <IconButton
                        size="small"
                        sx={{ color: error.main, '&:hover': { bgcolor: alpha(error.main, 0.12) } }}
                      >
                        <LogOut size={16} />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          </Card>
        </TabPanel>
      </Card>

      {/* ── Email Change Dialog ───────────────── */}
      <Modal
        open={emailDialogOpen}
        onClose={() => !changeEmailMutation.isPending && setEmailDialogOpen(false)}
        title="Change Email Address"
        maxWidth="sm"
        showCloseButton
        disableBackdropClick={changeEmailMutation.isPending}
        actions={
          <>
            <Button variant="text" onClick={() => setEmailDialogOpen(false)} disabled={changeEmailMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleChangeEmail}
              loading={changeEmailMutation.isPending}
              disabled={!canChangeEmail || !!emailSuccess}
            >
              Change Email
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Current Email"
            value={user?.email ?? ''}
            fullWidth
            size="small"
            disabled
            sx={fieldSx}
          />
          <TextField
            label="New Email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            fullWidth
            size="small"
            autoFocus
            sx={fieldSx}
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
              sx={fieldSx}
            />
          )}

          {emailSuccess && (
            <Chip icon={<CheckCircle size={14} />} label={emailSuccess} color="success" variant="outlined" />
          )}

          {emailError && (
            <Chip icon={<AlertCircle size={14} />} label={emailError} color="error" variant="outlined" />
          )}
        </Box>
      </Modal>

      {/* ── Delete Account Confirmation Dialog ── */}
      <Modal
        open={deleteDialogOpen}
        onClose={() => !deleteAccountMutation.isPending && setDeleteDialogOpen(false)}
        title="Delete Your Account"
        maxWidth="sm"
        showCloseButton
        disableBackdropClick={deleteAccountMutation.isPending}
        actions={
          <>
            <Button variant="text" onClick={() => setDeleteDialogOpen(false)} disabled={deleteAccountMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleDeleteAccount}
              loading={deleteAccountMutation.isPending}
              disabled={deleteConfirmation !== 'DELETE'}
              sx={{ bgcolor: error.main, color: '#fff', '&:hover': { bgcolor: '#DC2626' }, '&.Mui-disabled': { bgcolor: error.main, opacity: 0.5, color: '#fff' } }}
            >
              Delete My Account
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Box component="p" sx={{ color: text.secondary, fontSize: 14, m: 0 }}>
            This will permanently delete your account and all associated data. This action cannot be undone. Type <Box component="strong" sx={{ color: text.primary }}>DELETE</Box> to confirm.
          </Box>
          <TextField
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            fullWidth
            size="small"
            placeholder="DELETE"
            sx={fieldSx}
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
              sx={fieldSx}
            />
          )}

          {deleteError && (
            <Chip icon={<AlertCircle size={14} />} label={deleteError} color="error" variant="outlined" />
          )}
        </Box>
      </Modal>
    </Box>
  );
}
