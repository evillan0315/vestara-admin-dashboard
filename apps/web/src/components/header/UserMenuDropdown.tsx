import { type JSX, useMemo } from 'react';

import {
  Box,
  Chip,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import AvatarUpload from '../common/AvatarUpload';

import { Activity, Lock, LogOut, Monitor, Settings, Shield, User as UserIcon } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import { UserRole, type UserDTO } from '@vestara/types';
import { useOrganization } from '../../features/organizations/hooks';

interface UserMenuDropdownProps {
  user: UserDTO | null;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onLogout?: () => Promise<void> | void;
}

const roleColors: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: '#D4A843',
  [UserRole.ADMIN]: '#4A90D9',
  [UserRole.MODERATOR]: '#8B5CF6',
  [UserRole.SUPPORT]: '#2EA043',
};

function getRoleChipColor(role: UserRole): string {
  return roleColors[role] ?? '#7A7F8E';
}

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) {
    return 'N/A';
  }
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  if (diffMs < 0) {
    return 'just now';
  }
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }
  return new Date(dateStr).toLocaleDateString();
}

interface QuickLink {
  label: string;
  icon: JSX.Element;
  path: string;
}

const quickLinks: QuickLink[] = [
  { label: 'My Profile', icon: <UserIcon size={18} />, path: '/profile' },
  { label: 'Security', icon: <Shield size={18} />, path: '/security' },
  { label: 'Activity', icon: <Activity size={18} />, path: '/activity' },
];

const settingsLinks: QuickLink[] = [
  { label: 'Preferences', icon: <Settings size={18} />, path: '/preferences' },
  { label: 'Sessions', icon: <Monitor size={18} />, path: '/sessions' },
  { label: 'Permissions', icon: <Lock size={18} />, path: '/permissions' },
];

export default function UserMenuDropdown({
  user,
  anchorEl,
  open,
  onClose,
  onLogout,
}: UserMenuDropdownProps): JSX.Element {
  const theme = useTheme();
  const { primary, text, divider, error, background } = theme.palette;

  const navigate = useNavigate();

  const organizationQuery = useOrganization(user?.organizationId ?? '');

  const initials = useMemo(() => {
    const name = user ? `${user.firstName} ${user.lastName}`.trim() : '';

    if (!name) {
      return 'U';
    }

    return name
      .split(' ')
      .map((part: string) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const navigateTo = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleLogout = async () => {
    onClose();
    await onLogout?.();
  };

  const role = user?.role;
  const roleColor = role ? getRoleChipColor(role) : '#7A7F8E';

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        transformOrigin={{
          horizontal: 'right',
          vertical: 'top',
        }}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'bottom',
        }}
        slotProps={{
          paper: {
            sx: {
              width: 320,
              maxHeight: 560,
              mt: 1,
              overflow: 'hidden',
              bgcolor: background.paper,
              border: `1px solid ${divider}`,
              borderRadius: '14px',
              color: text.primary,
              boxShadow: '0 16px 40px rgba(0,0,0,.45)',
            },
          },
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <AvatarUpload src={user?.avatarUrl} size={50} initials={initials} />

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: 15,
                color: text.primary,
              }}
              noWrap
            >
              {user ? `${user.firstName} ${user.lastName}` : ''}
            </Typography>

            <Typography
              sx={{
                fontSize: 12.5,
                color: text.secondary,
              }}
              noWrap
            >
              {user?.email}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              {role && (
                <Chip
                  label={role.replace('_', ' ')}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    bgcolor: alpha(roleColor, 0.15),
                    color: roleColor,
                    border: `1px solid ${alpha(roleColor, 0.3)}`,
                    borderRadius: '4px',
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>

        {user?.organizationId && (
          <Box
            sx={{
              px: 2.5,
              pb: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: 11.5,
                color: text.secondary,
                fontWeight: 500,
              }}
            >
              Organization:
            </Typography>
            <Typography
              sx={{
                fontSize: 11.5,
                color: text.primary,
                fontWeight: 600,
              }}
              noWrap
            >
              {organizationQuery.data?.name ?? user.organizationId}
            </Typography>
          </Box>
        )}

        <Divider />

        <Typography
          sx={{
            px: 2.5,
            pt: 1.5,
            pb: 0.75,
            fontSize: 10.5,
            fontWeight: 700,
            color: text.secondary,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Quick Access
        </Typography>

        {quickLinks.map((link) => (
          <MenuItem
            key={link.path}
            onClick={() => navigateTo(link.path)}
            sx={{
              mx: 1,
              borderRadius: '8px',
              '&:hover': {
                bgcolor: alpha(primary.main, 0.08),
                '& .MuiListItemIcon-root svg': { color: primary.main },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: text.secondary }}>{link.icon}</ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500 }}>
              {link.label}
            </ListItemText>
          </MenuItem>
        ))}

        <Divider sx={{ mt: 0.5 }} />

        <Typography
          sx={{
            px: 2.5,
            pt: 1.5,
            pb: 0.75,
            fontSize: 10.5,
            fontWeight: 700,
            color: text.secondary,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Settings
        </Typography>

        {settingsLinks.map((link) => (
          <MenuItem
            key={link.path}
            onClick={() => navigateTo(link.path)}
            sx={{
              mx: 1,
              borderRadius: '8px',
              '&:hover': {
                bgcolor: alpha(primary.main, 0.08),
                '& .MuiListItemIcon-root svg': { color: primary.main },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: text.secondary }}>{link.icon}</ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500 }}>
              {link.label}
            </ListItemText>
          </MenuItem>
        ))}

        <Divider />

        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: user?.isActive ? '#2EA043' : '#4A5060',
              }}
            />
            <Typography
              sx={{
                fontSize: 12,
                color: text.secondary,
                fontWeight: 500,
              }}
            >
              {user?.isActive ? 'Active' : 'Inactive'}
            </Typography>
          </Box>

          <Typography
            sx={{
              fontSize: 11,
              color: text.disabled ?? alpha(text.secondary, 0.6),
            }}
          >
            Last login: {timeAgo(user?.lastLoginAt)}
          </Typography>
        </Box>

        <Divider />

        <MenuItem
          onClick={handleLogout}
          sx={{
            color: error.main,
            mx: 1,
            my: 0.5,
            borderRadius: '8px',
            '&:hover': {
              bgcolor: alpha(error.main, 0.1),
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: error.main }}>
            <LogOut size={18} />
          </ListItemIcon>

          <ListItemText primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500 }}>
            Sign Out
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
