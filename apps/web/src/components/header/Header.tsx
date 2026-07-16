/// <reference types="react/jsx-runtime" />
import { useState } from "react";
import { Box, Typography, Button, IconButton, useTheme, alpha } from "@mui/material";
import { Menu, PanelLeftClose, PanelLeft } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { useLiveNotifications } from "../../features/realtime/LiveNotificationsProvider";
import { useThemeContext } from "../../providers/ThemeProvider";
import { useNavigate } from "react-router-dom";
import HeaderActions from "./HeaderActions";
import NotificationPopover from "./NotificationPopover";
import MessagePopover from "./MessagePopover";
import type { Message } from "./types";

interface HeaderProps {
  title: string;
  subtitle: string;
  onMenuToggle?: () => void;
  onNotificationsClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

export default function Header({
  title,
  subtitle,
  onMenuToggle,
  onNotificationsClick,
}: HeaderProps) {
  const theme = useTheme();
  const { primary, text, divider, background } = theme.palette;
  const { sidebarCollapsed, toggleSidebar } = useThemeContext();

  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, markRead } = useLiveNotifications();

  const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null);
  const [msgAnchor, setMsgAnchor] = useState<HTMLElement | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleNotifClick = (e: React.MouseEvent<HTMLElement>) => {
    setNotifAnchor(e.currentTarget);
    onNotificationsClick?.(e);
  };

  const handleNotifClose = () => setNotifAnchor(null);

  const handleMsgClick = (e: React.MouseEvent<HTMLElement>) => {
    setMsgAnchor(e.currentTarget);
  };

  const handleMsgClose = () => setMsgAnchor(null);

  const handleMessageClick = (message: Message) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, unread: false } : m)),
    );
  };

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        bgcolor: alpha(background.default, 0.85),
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${divider}`,
        px: { xs: 2, sm: 3.5 },
        py: 2.25,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}
      >
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuToggle}
          sx={{ mr: 0.5, display: { lg: "none" }, color: text.primary }}
        >
          <Menu size={22} />
        </IconButton>

        <IconButton
          color="inherit"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={toggleSidebar}
          sx={{
            mr: 0.5,
            display: { xs: "none", lg: "inline-flex" },
            color: text.primary,
            transition: "transform .2s ease",
            "&:hover": { transform: "scale(1.05)" },
          }}
        >
          {sidebarCollapsed ? <PanelLeft size={22} /> : <PanelLeftClose size={22} />}
        </IconButton>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: { xs: 18, sm: 22 },
              color: text.primary,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: 12.5,
              color: primary.main,
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {subtitle}
          </Typography>
        </Box>
      </Box>

      {/* Removed search box and date range picker from here */}

      <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 1.5 }}>
        {isAuthenticated ? (
          <>
            <HeaderActions
              notificationCount={unreadCount}
              messageCount={messages.filter((m) => m.unread).length}
              onLogout={handleLogout}
              onNotificationsClick={handleNotifClick}
              onMessagesClick={handleMsgClick}
            />

            <NotificationPopover
              anchorEl={notifAnchor}
              open={Boolean(notifAnchor)}
              notifications={notifications}
              onClose={handleNotifClose}
              onMarkAllRead={markAllRead}
              onNotificationClick={(notification) => markRead(notification.id)}
            />

            <MessagePopover
              anchorEl={msgAnchor}
              open={Boolean(msgAnchor)}
              messages={messages}
              onClose={handleMsgClose}
              onMessageClick={handleMessageClick}
            />
          </>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Button
              variant="text"
              onClick={() => navigate("/login")}
              sx={{
                color: text.primary,
                textTransform: "none",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Sign In
            </Button>

            <Button
              variant="contained"
              onClick={() => navigate("/register")}
              sx={{
                bgcolor: primary.main,
                color: primary.contrastText,
                textTransform: "none",
                fontWeight: 700,
                fontSize: 13,
                borderRadius: "8px",
                px: { xs: 1.5, sm: 2.5 },
                "&:hover": { bgcolor: alpha(primary.main, 0.85) },
              }}
            >
              Register
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}