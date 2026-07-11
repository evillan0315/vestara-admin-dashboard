import { Box, Typography, IconButton, Avatar, Menu, MenuItem, styled, Tooltip, useTheme, Divider } from '@mui/material';
import { Menu as MenuIcon, DarkMode, LightMode, Person, Settings, Logout, Search, Notifications } from '@mui/icons-material';
import { useState, type ReactNode, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { useThemeContext } from '../../providers/ThemeProvider';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  onMenuClick?: () => void;
  showSearch?: boolean;
  showNotifications?: boolean;
  showThemeToggle?: boolean;
  showUserMenu?: boolean;
}

const StyledHeader = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  position: 'sticky',
  top: 0,
  zIndex: theme.zIndex.drawer + 1,
}));

const HeaderContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(1, 2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(1, 3),
  },
  minHeight: 64,
}));

const TitleContainer = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
}));

const TitleText = styled(Typography)(() => ({
  fontWeight: 600,
  fontSize: '1.125rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const SubtitleText = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const ActionContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const SearchInput = styled('input')(({ theme }) => ({
  border: 'none',
  outline: 'none',
  background: theme.palette.action.hover,
  padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
  paddingLeft: theme.spacing(4),
  fontSize: '0.875rem',
  color: theme.palette.text.primary,
  borderRadius: theme.shape.borderRadius,
  width: 200,
  transition: 'width 0.2s ease',
  [theme.breakpoints.up('lg')]: {
    width: 280,
    '&:focus': {
      width: 360,
    },
  },
  '&::placeholder': {
    color: theme.palette.text.disabled,
  },
  '&:focus': {
    background: theme.palette.background.paper,
    boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
  },
}));

const NotificationButton = styled(IconButton)(({ theme }) => ({
  position: 'relative',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const NotificationBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 4,
  right: 4,
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: theme.palette.error.main,
  border: `2px solid ${theme.palette.background.paper}`,
}));

const UserMenuButton = styled(IconButton)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 1),
  borderRadius: 16,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const UserAvatar = styled(Avatar)(() => ({
  width: 36,
  height: 36,
  fontSize: '0.875rem',
  fontWeight: 600,
}));

const UserName = styled(Typography)(() => ({
  fontWeight: 500,
  fontSize: '0.875rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 150,
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  '& svg': {
    position: 'absolute',
    left: theme.spacing(1.5),
    color: theme.palette.text.disabled,
    fontSize: 20,
    pointerEvents: 'none',
  },
}));

export const Header = ({
  title = 'Dashboard',
  subtitle,
  actions,
  onMenuClick,
  showSearch = true,
  showNotifications = true,
  showThemeToggle = true,
  showUserMenu = true,
}: HeaderProps): ReactElement => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeContext();
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLElement | null>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);

  const handleNotificationClose = () => setNotificationAnchor(null);
  const handleUserMenuClose = () => setUserMenuAnchor(null);

  const handleProfileClick = () => {
    handleUserMenuClose();
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    handleUserMenuClose();
    navigate('/settings');
  };

  const handleLogoutClick = async () => {
    handleUserMenuClose();
    await logout();
    navigate('/login');
  };

  return (
    <StyledHeader>
      <HeaderContent>
        {onMenuClick && (
          <Tooltip title="Menu">
            <IconButton
              edge="start"
              color="inherit"
              aria-label="Menu"
              onClick={onMenuClick}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>
        )}

        <TitleContainer>
          <TitleText variant="h6">
            {title}
          </TitleText>
          {subtitle && <SubtitleText variant="body2">{subtitle}</SubtitleText>}
        </TitleContainer>

        <ActionContainer>
          {showSearch && (
            <Tooltip title="Search">
              <SearchContainer
                sx={{
                  display: { xs: 'none', md: 'flex' },
                }}
              >
                <Search />
                <SearchInput
                  type="text"
                  placeholder="Search..."
                  aria-label="Search"
                />
              </SearchContainer>
            </Tooltip>
          )}

          {showNotifications && (
            <Tooltip title="Notifications">
              <NotificationButton
                onClick={(e) => setNotificationAnchor(e.currentTarget)}
                aria-label="Notifications"
                aria-expanded={Boolean(notificationAnchor)}
                aria-haspopup="true"
              >
                <Notifications />
                <NotificationBadge />
              </NotificationButton>
            </Tooltip>
          )}

          {showThemeToggle && (
            <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
              <IconButton
                onClick={toggleTheme}
                aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {mode === 'light' ? <DarkMode /> : <LightMode />}
              </IconButton>
            </Tooltip>
          )}

          {actions}

          {showUserMenu && user && (
            <Tooltip title="User menu">
              <UserMenuButton
                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                aria-label="User menu"
                aria-expanded={Boolean(userMenuAnchor)}
                aria-haspopup="true"
              >
                <UserAvatar src={user.avatarUrl || undefined}>
                  {user.firstName?.[0]?.toUpperCase() || 'U'}
                </UserAvatar>
                <UserName sx={{ display: { xs: 'none', md: 'block' } }}>
                  {user.firstName} {user.lastName}
                </UserName>
              </UserMenuButton>
            </Tooltip>
          )}
        </ActionContainer>
      </HeaderContent>

      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { minWidth: 320, maxWidth: 400 } }}
      >
        <Typography variant="h6" sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          Notifications
        </Typography>
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No new notifications
            </Typography>
          </MenuItem>
        </Box>
      </Menu>

      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { minWidth: 200 } }}
      >
        <MenuItem onClick={handleProfileClick}>
          <Person sx={{ mr: 1, fontSize: 20 }} />
          Profile
        </MenuItem>
        <MenuItem onClick={handleSettingsClick}>
          <Settings sx={{ mr: 1, fontSize: 20 }} />
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogoutClick} sx={{ color: theme.palette.error.main }}>
          <Logout sx={{ mr: 1, fontSize: 20 }} />
          Logout
        </MenuItem>
      </Menu>
    </StyledHeader>
  );
};

export default Header;