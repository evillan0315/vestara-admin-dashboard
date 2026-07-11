import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Drawer, useTheme } from "@mui/material";
import { Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/header/Header";
import { ThemeSettings } from "../theme/ThemeSettings";
import { useThemeContext } from "../providers/ThemeProvider";
import { useAuth } from "../features/auth/AuthContext";
import { auditLogsApi } from "../api/audit-logs";
import { densitySpacing } from "../theme/tokens";
import type { AuditLogDTO } from "@vestara/types";
import NotificationPopover from "../components/header/NotificationPopover";
import GlobalSearchDialog from "../components/layout/GlobalSearchDialog";
import { auditLogsToNotifications, getUnreadCount } from "../utils/notifications";

const SIDEBAR_MOBILE_WIDTH = 320;

interface DashboardLayoutProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
}

export default function DashboardLayout({
  title = "Dashboard",
  subtitle,
  children,
}: DashboardLayoutProps) {
  const theme = useTheme();
  const themeCtx = useThemeContext();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogDTO[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLElement | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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

  const isHidden = themeCtx.sidebarVariant === "hidden";

  // Convert audit logs to notifications
  const notifications = auditLogsToNotifications(auditLogs);

  // Fetch notifications (recent audit logs) for the current user's organization
  const fetchNotifications = useCallback(async () => {
    if (!user?.organizationId) return;
    setNotificationsLoading(true);
    try {
      const res = await auditLogsApi.list({
        page: 1,
        perPage: 10,
        sort: 'createdAt',
        order: 'desc',
      });
      const logs = res.data ?? [];
      setAuditLogs(logs);
      setUnreadCount(getUnreadCount(auditLogsToNotifications(logs)));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setAuditLogs([]);
      setUnreadCount(0);
    } finally {
      setNotificationsLoading(false);
    }
  }, [user?.organizationId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Global search keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        // Don't open if already in an input field
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
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

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleMarkAllRead = () => {
    setUnreadCount(0);
    // In a real app, this would call an API to mark all as read
  };

  const handleNotificationSelect = (_notification: ReturnType<typeof auditLogsToNotifications>[number]) => {
    // Navigate to relevant page based on notification
    handleNotificationClose();
    // Could navigate to the entity that was affected
  };

  const handleRefresh = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  const handleGlobalSearchClose = () => {
    setGlobalSearchOpen(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
      }}
    >
      {/* Desktop Sidebar — permanent */}
      {!isHidden && (
        <>
          <Box
            sx={{
              display: { xs: "none", lg: "block" },
              flexShrink: 0,
              width: sidebarWidth,
              transition: "width 0.2s ease",
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
              display: { xs: "block", lg: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: { xs: "100%", sm: SIDEBAR_MOBILE_WIDTH },
                maxWidth: "100vw",
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
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        <Header
          title={title}
          subtitle={subtitle ?? ""}
          onMenuToggle={isHidden ? undefined : handleDrawerToggle}
          showSearch
          showNotifications
          showThemeToggle
          showUserMenu
          showSettings
          notificationCount={unreadCount}
          refreshing={notificationsLoading}
          onRefresh={handleRefresh}
          onNotificationsClick={handleNotificationClick}
        />
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3, md: 3.5 },
            display: "flex",
            flexDirection: "column",
            gap: { xs: 2, sm: 3 },
            overflow: "auto",
          }}
        >
          {children ?? <Outlet />}
        </Box>
      </Box>

      {/* Theme Settings Drawer */}
      <ThemeSettings />

      {/* Notification Popover */}
      {notificationAnchor && (
        <NotificationPopover
          anchorEl={notificationAnchor}
          open={true}
          notifications={notifications}
          loading={notificationsLoading}
          onClose={handleNotificationClose}
          onNotificationClick={handleNotificationSelect}
          onMarkAllRead={handleMarkAllRead}
        />
      )}

      {/* Global Search Dialog */}
      <GlobalSearchDialog
        open={globalSearchOpen}
        onClose={handleGlobalSearchClose}
        inputRef={searchInputRef}
      />
    </Box>
  );
}