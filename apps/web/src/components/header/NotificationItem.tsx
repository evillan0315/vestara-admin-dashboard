import type { JSX } from "react";

import { Avatar, Box, Chip, Typography, useTheme, alpha } from "@mui/material";

import {
  Activity,
  Bell,
  Calendar,
  CheckCircle2,
  CreditCard,
  LogIn,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import type { Notification, NotificationType } from "./types";

export interface NotificationItemProps {
  notification: Notification;
  onClick?: (notification: Notification) => void;
}

function getNotificationIcon(type: NotificationType): JSX.Element {
  switch (type) {
    case "booking":
      return <Calendar size={18} />;

    case "payment":
      return <CreditCard size={18} />;

    case "membership":
      return <CheckCircle2 size={18} />;

    case "companion":
    case "user":
      return <UserRound size={18} />;

    case "security":
      return <ShieldCheck size={18} />;

    case "setting":
      return <Settings size={18} />;

    case "auth":
      return <LogIn size={18} />;

    case "activity":
      return <Activity size={18} />;

    default:
      return <Bell size={18} />;
  }
}

function getAvatarColor(type: NotificationType, gold: string): string {
  switch (type) {
    case "booking":
      return "#3B82F6";

    case "payment":
      return "#10B981";

    case "membership":
      return gold;

    case "companion":
    case "user":
      return "#8B5CF6";

    case "security":
      return "#EF4444";

    case "setting":
      return gold;

    case "auth":
      return "#3B82F6";

    case "activity":
      return "#64748B";

    default:
      return "#64748B";
  }
}

export default function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps): JSX.Element {
  const theme = useTheme();
  const { primary, text } = theme.palette;

  return (
    <Box
      onClick={() => onClick?.(notification)}
      sx={{
        px: 2,
        py: 1.5,
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        cursor: "pointer",
        transition: "all .18s ease",

        "&:hover": {
          bgcolor: alpha(text.primary, 0.03),
        },
      }}
    >
      <Avatar
        sx={{
          width: 38,
          height: 38,
          bgcolor: getAvatarColor(notification.type, primary.main),
          color: "#fff",
        }}
      >
        {getNotificationIcon(notification.type)}
      </Avatar>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography
            noWrap
            sx={{
              flex: 1,
              fontWeight: 700,
              fontSize: 13,
              color: text.primary,
            }}
          >
            {notification.title}
          </Typography>

          {notification.unread && (
            <Chip
              size="small"
              label="NEW"
              sx={{
                height: 18,
                fontSize: 9,
                fontWeight: 700,
                bgcolor: primary.main,
                color: primary.contrastText,
              }}
            />
          )}
        </Box>

        <Typography
          sx={{
            mt: 0.5,
            fontSize: 12,
            color: text.secondary,
            lineHeight: 1.45,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
          }}
        >
          {notification.description}
        </Typography>

        <Typography
          sx={{
            mt: 1,
            fontSize: 11,
            color: text.disabled,
          }}
        >
          {notification.timestamp}
        </Typography>
      </Box>
    </Box>
  );
}
