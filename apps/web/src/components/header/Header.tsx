import { type JSX, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, InputBase, Button, IconButton } from "@mui/material";
import { Search, Menu } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { useLiveNotifications } from "../../features/realtime/LiveNotificationsProvider";
import { colors } from "../../theme/tokens";
import HeaderActions from "./HeaderActions";
import NotificationPopover from "./NotificationPopover";
import MessagePopover from "./MessagePopover";
import type { Message } from "./types";

interface HeaderProps {
  title: string;
  subtitle: string;
  onMenuToggle?: () => void;
  showSearch?: boolean;
  showNotifications?: boolean;
  showThemeToggle?: boolean;
  showUserMenu?: boolean;
  showSettings?: boolean;
  _showSearch?: boolean;
  _showNotifications?: boolean;
  _showThemeToggle?: boolean;
  _showUserMenu?: boolean;
  _showSettings?: boolean;
  refreshing?: boolean;
  onRefresh?: () => Promise<void> | void;
  onNotificationsClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

export default function Header({
  title,
  subtitle,
  onMenuToggle,
  _showSearch = true,
  _showNotifications = true,
  _showThemeToggle = true,
  _showUserMenu = true,
  _showSettings = true,
  refreshing = false,
  onRefresh,
  onNotificationsClick,
}: HeaderProps): JSX.Element {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, markRead } = useLiveNotifications();

  const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null);
  const [msgAnchor, setMsgAnchor] = useState<HTMLElement | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [dateRange, setDateRange] = useState("May 18 – Jun 18, 2026");

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

  const handleRefresh = async () => {
    onRefresh?.();
  };

  const handleDateRangeClick = () => {
    setDateRange((prev) =>
      prev === "May 18 – Jun 18, 2026"
        ? "Jun 18 – Jul 18, 2026"
        : "May 18 – Jun 18, 2026",
    );
  };

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
        bgcolor: "rgba(6, 11, 18, 0.85)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${colors.border}`,
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
          sx={{ mr: 0.5, display: { lg: "none" }, color: colors.text }}
        >
          <Menu size={22} />
        </IconButton>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: { xs: 18, sm: 22 },
              color: colors.text,
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
              color: colors.gold,
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

      <Box
        sx={{
          flex: 1,
          maxWidth: 480,
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          gap: 1,
          bgcolor: colors.cardAlt,
          border: `1px solid ${colors.border}`,
          borderRadius: "10px",
          px: 1.75,
          py: 1,
        }}
      >
        <Search size={16} color={colors.muted} />
        <InputBase
          placeholder="Search bookings, clients..."
          sx={{
            flex: 1,
            fontSize: 13,
            color: colors.text,
            "& input::placeholder": { color: colors.muted, opacity: 1 },
          }}
        />
        <Box
          sx={{
            fontSize: 11,
            color: colors.muted,
            border: `1px solid ${colors.border}`,
            borderRadius: "6px",
            px: 0.75,
            py: 0.1,
          }}
        >
          ⌘ K
        </Box>
      </Box>

      <Box sx={{ flexShrink: 0 }}>
        {isAuthenticated ? (
          <>
            <HeaderActions
              dateRange={dateRange}
              notificationCount={unreadCount}
              messageCount={messages.filter((m) => m.unread).length}
              refreshing={refreshing}
              onLogout={handleLogout}
              onRefresh={handleRefresh}
              onNotificationsClick={handleNotifClick}
              onMessagesClick={handleMsgClick}
              onDateRangeClick={handleDateRangeClick}
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
                color: colors.text,
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
                bgcolor: colors.gold,
                color: "#0A0F18",
                textTransform: "none",
                fontWeight: 700,
                fontSize: 13,
                borderRadius: "8px",
                px: { xs: 1.5, sm: 2.5 },
                "&:hover": { bgcolor: colors.goldHover },
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