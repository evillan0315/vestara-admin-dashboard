import { useState, useEffect, useRef } from 'react';
import { Box, Drawer, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/header/Header';
import { getRouteTitle } from './routeTitles';
import { ThemeSettings } from '../theme/ThemeSettings';
import { useThemeContext } from '../providers/ThemeProvider';
import { useLiveNotifications } from '../features/realtime/LiveNotificationsProvider';
import { densitySpacing } from '../theme/tokens';
import GlobalSearchDialog from '../components/layout/GlobalSearchDialog';
import { FloatingChatWidget } from '../features/chat/FloatingChatWidget';

const SIDEBAR_MOBILE_WIDTH = 320;

interface DashboardLayoutProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
}

export default function DashboardLayout({
  title = 'Dashboard',
  subtitle,
  children,
}: DashboardLayoutProps) {
  const theme = useTheme();
  const themeCtx = useThemeContext();
  const location = useLocation();
  const { title: routeTitle, subtitle: routeSubtitle } = getRouteTitle(location.pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Real-time notifications are delivered via the WebSocket connection.
  useLiveNotifications();

  const density = densitySpacing[themeCtx.density];
  const sidebarWidth = themeCtx.sidebarCollapsed
    ? density.sidebarCollapsedWidth
    : density.sidebarWidth;

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  const isHidden = themeCtx.sidebarVariant === 'hidden';

  // Global search keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        // Don't open if already in an input field
        const activeElement = document.activeElement;
        if (
          activeElement &&
          (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
        ) {
          return;
        }
        event.preventDefault();
        setGlobalSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus search input when dialog opens
  useEffect(() => {
    if (globalSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [globalSearchOpen]);

  const handleGlobalSearchClose = () => {
    setGlobalSearchOpen(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        bgcolor: theme.palette.background.default,
      }}
    >
      {/* Desktop Sidebar — permanent */}
      {!isHidden && (
        <>
          <Box
            sx={{
              display: { xs: 'none', lg: 'block' },
              flexShrink: 0,
              width: sidebarWidth,
              transition: 'width 0.2s ease',
            }}
          >
            <Sidebar />
          </Box>

          {/* Mobile Drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', lg: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: { xs: '100%', sm: SIDEBAR_MOBILE_WIDTH },
                maxWidth: '100vw',
                bgcolor: theme.palette.background.paper,
                borderRight: `1px solid ${theme.palette.divider}`,
              },
            }}
          >
            <Sidebar onClose={handleDrawerClose} />
          </Drawer>
        </>
      )}

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        }}
      >
        <Header
          title={title ?? routeTitle}
          subtitle={subtitle ?? routeSubtitle}
          onMenuToggle={isHidden ? undefined : handleDrawerToggle}
        />
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3, md: 3.5 },
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 2, sm: 3 },
            overflow: 'auto',
          }}
        >
          {children ?? <Outlet />}
        </Box>
      </Box>

      {/* Theme Settings Drawer */}
      <ThemeSettings />

      {/* Global Search Dialog */}
      <GlobalSearchDialog
        open={globalSearchOpen}
        onClose={handleGlobalSearchClose}
        inputRef={searchInputRef}
      />

      {/* Floating AI Assistant Chat Widget */}
      <FloatingChatWidget />
    </Box>
  );
}
