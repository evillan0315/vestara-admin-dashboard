import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Collapse,
  styled,
  useTheme,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  ExpandMore,
  Dashboard,
  Settings,
  Security,
  People,
  Logout,
  Analytics,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useState, type ReactNode, type ReactElement } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

export interface NavItem {
  label: string;
  icon?: ReactNode;
  path?: string;
  children?: NavItem[];
  badge?: string | number;
  disabled?: boolean;
}

export interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  onToggle?: (open: boolean) => void;
  items?: NavItem[];
  logo?: ReactNode;
  footer?: ReactNode;
  width?: number;
  collapsedWidth?: number;
  showToggle?: boolean;
}

const StyledSidebar = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'collapsed' && prop !== 'sidebarWidth' && prop !== 'sidebarCollapsedWidth',
})<{ collapsed: boolean; sidebarWidth: number; sidebarCollapsedWidth: number }>`
  display: flex;
  flexDirection: column;
  height: 100%;
  background-color: ${({ theme }) => theme.palette.background.paper};
  border-right: 1px solid ${({ theme }) => theme.palette.divider};
  transition: width 0.3s ease, min-width 0.3s ease;
  width: ${({ collapsed, sidebarWidth, sidebarCollapsedWidth }) =>
    collapsed ? sidebarCollapsedWidth : sidebarWidth}px;
  min-width: ${({ collapsed, sidebarWidth, sidebarCollapsedWidth }) =>
    collapsed ? sidebarCollapsedWidth : sidebarWidth}px;
  overflow: hidden;
  position: relative;
  z-index: ${({ theme }) => theme.zIndex.drawer};
`;

const LogoContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})<{ collapsed: boolean }>(({ theme, collapsed: _collapsed }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: 64,
  overflow: 'hidden',
}));

const ToggleButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})<{ collapsed: boolean }>(({ theme }) => ({
  color: theme.palette.text.secondary,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const NavContainer = styled(Box)(() => ({
  flex: 1,
  overflow: 'auto',
}));

const FooterContainer = styled(Box)(() => ({
  padding: 0,
}));

const UserInfoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(2),
}));

const UserDetails = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})<{ collapsed: boolean }>(({ collapsed }) => ({
  flex: 1,
  minWidth: 0,
  opacity: collapsed ? 0 : 1,
  transition: 'opacity 0.2s ease',
  width: collapsed ? 0 : 'auto',
  overflow: 'hidden',
}));

const UserName = styled(Typography)(() => ({
  fontWeight: 600,
  fontSize: '0.875rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const UserRole = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

// Import IconButton properly
import { IconButton } from '@mui/material';

const NavItemComponent = ({
  item,
  level = 0,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  level: number;
  collapsed: boolean;
  onNavigate: (path: string) => void;
}): ReactElement => {
  const theme = useTheme();
  const location = useLocation();
  const isActive = item.path === location.pathname;
  const hasChildren = item.children && item.children.length > 0;
  const [expanded, setExpanded] = useState(false);

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    } else if (item.path && !item.disabled) {
      onNavigate(item.path);
    }
  };

  if (level > 0) {
    return (
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <ListItem disablePadding sx={{ pl: theme.spacing(3 + level * 2) }}>
          <ListItemButton
            onClick={handleClick}
            selected={isActive}
            disabled={item.disabled}
            sx={{
              borderRadius: 2,
              py: 1,
              px: 2,
              color: isActive ? 'primary.main' : 'text.primary',
              backgroundColor: isActive ? 'action.hover' : 'transparent',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              '&.Mui-selected': {
                backgroundColor: 'action.hover',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              },
            }}
          >
            {item.icon && <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>}
            <ListItemText primary={item.label} primaryTypographyProps={{ variant: 'body2' }} />
          </ListItemButton>
        </ListItem>
      </Collapse>
    );
  }

  return (
    <>
      {hasChildren ? (
        <>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleClick}
              selected={isActive}
              disabled={item.disabled}
              sx={{
                borderRadius: 2,
                py: 1,
                px: collapsed ? 1.5 : 2,
                mx: 0.5,
                color: isActive ? 'primary.main' : 'text.primary',
                backgroundColor: isActive ? 'action.hover' : 'transparent',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                '&.Mui-selected': {
                  backgroundColor: 'action.hover',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                },
                '& .MuiListItemIcon-root': {
                  color: isActive ? 'primary.main' : 'inherit',
                  minWidth: collapsed ? 40 : 48,
                },
              }}
              aria-expanded={expanded}
            >
              {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
              {!collapsed && <ListItemText primary={item.label} />}
              {!collapsed && (
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                  {item.badge && (
                    <Typography variant="caption" color={isActive ? 'primary.main' : 'text.secondary'}>
                      {item.badge}
                    </Typography>
                  )}
                  <ExpandMore
                    sx={{
                      transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </Box>
              )}
            </ListItemButton>
          </ListItem>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <List component="div">
              {item.children?.map((child, index) => (
                <NavItemComponent
                  key={index}
                  item={child}
                  level={level + 1}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </List>
          </Collapse>
        </>
      ) : (
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleClick}
            selected={isActive}
            disabled={item.disabled}
            sx={{
              borderRadius: 2,
              py: 1,
              px: collapsed ? 1.5 : 2,
              mx: 0.5,
              color: isActive ? 'primary.main' : 'text.primary',
              backgroundColor: isActive ? 'action.hover' : 'transparent',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              '&.Mui-selected': {
                backgroundColor: 'action.hover',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              },
              '& .MuiListItemIcon-root': {
                color: isActive ? 'primary.main' : 'inherit',
                minWidth: collapsed ? 40 : 48,
              },
            }}
          >
            {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
            {!collapsed && <ListItemText primary={item.label} />}
            {!collapsed && item.badge && (
              <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" color={isActive ? 'primary.main' : 'text.secondary'}>
                  {item.badge}
                </Typography>
              </Box>
            )}
          </ListItemButton>
        </ListItem>
      )}
    </>
  );
};

const defaultNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: <Dashboard />,
    path: '/',
  },
  {
    label: 'Analytics',
    icon: <Analytics />,
    path: '/analytics',
  },
  {
    label: 'Users',
    icon: <People />,
    path: '/users',
  },
  {
    label: 'Settings',
    icon: <Settings />,
    path: '/settings',
    children: [
      { label: 'General', icon: <Settings />, path: '/settings/general' },
      { label: 'Security', icon: <Security />, path: '/settings/security' },
    ],
  },
  {
    label: 'Admin',
    icon: <AdminPanelSettings />,
    path: '/admin',
    children: [
      { label: 'Users Management', icon: <People />, path: '/admin/users' },
      { label: 'Roles & Permissions', icon: <Security />, path: '/admin/roles' },
    ],
  },
];

export const Sidebar = ({
  open: _open = true,
  onClose: _onClose,
  onToggle,
  items = defaultNavItems,
  logo,
  footer,
  width = 280,
  collapsedWidth = 72,
  showToggle = true,
}: SidebarProps): ReactElement => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleToggle = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onToggle?.(newCollapsed);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <StyledSidebar collapsed={collapsed} sidebarWidth={width} sidebarCollapsedWidth={collapsedWidth}>
      <LogoContainer collapsed={collapsed}>
        {logo || (
          <Box
            component="img"
            src="/logo.svg"
            alt="Vestara"
            sx={{
              height: 32,
              width: collapsed ? 0 : 'auto',
              objectFit: 'contain',
              transition: 'opacity 0.2s ease, width 0.2s ease',
              opacity: collapsed ? 0 : 1,
            }}
          />
        )}
        {showToggle && (
          <ToggleButton onClick={handleToggle} collapsed={collapsed}>
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </ToggleButton>
        )}
      </LogoContainer>

      <NavContainer>
        <List component="nav" aria-label="Main navigation" sx={{ px: 0.5 }}>
          {items.map((item, index) => (
            <NavItemComponent
              key={index}
              item={item}
              level={0}
              collapsed={collapsed}
              onNavigate={handleNavigate}
            />
          ))}
        </List>
      </NavContainer>

      {(footer || user) && (
        <FooterContainer>
          <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
            {footer || (
              <>
                <UserInfoContainer>
                  <Avatar
                    src={user?.avatarUrl || undefined}
                    alt={user?.firstName || 'User'}
                    sx={{ width: 36, height: 36, fontSize: '0.875rem' }}
                  >
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </Avatar>
                  <UserDetails collapsed={collapsed}>
                    <UserName>{user?.firstName} {user?.lastName}</UserName>
                    <UserRole>{user?.role}</UserRole>
                  </UserDetails>
                </UserInfoContainer>
                {!collapsed && (
                  <List>
                    <ListItem disablePadding>
                      <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, py: 1, mx: 0.5 }}>
                        <ListItemIcon>
                          <Logout fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText primary="Logout" primaryTypographyProps={{ variant: 'body2', color: 'error' }} />
                      </ListItemButton>
                    </ListItem>
                  </List>
                )}
              </>
            )}
          </Box>
        </FooterContainer>
      )}
    </StyledSidebar>
  );
};

export default Sidebar;