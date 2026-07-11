import type { JSX } from "react";

import { Avatar, Box, Chip, Typography } from "@mui/material";

import {
  Bell,
  Calendar,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { colors } from "../../theme/tokens";
import type { Notification, NotificationType } from "../../types";

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
      return <UserRound size={18} />;

    case "security":
      return <ShieldCheck size={18} />;

    default:
      return <Bell size={18} />;
  }
}

function getAvatarColor(type: NotificationType): string {
  switch (type) {
    case "booking":
      return "#3B82F6";

    case "payment":
      return "#10B981";

    case "membership":
      return colors.gold;

    case "companion":
      return "#8B5CF6";

    case "security":
      return "#EF4444";

    default:
      return "#64748B";
  }
}

export default function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps): JSX.Element {
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
          bgcolor: "rgba(255,255,255,.03)",
        },
      }}
    >
      <Avatar
        sx={{
          width: 38,
          height: 38,
          bgcolor: getAvatarColor(notification.type),
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
              color: colors.text,
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
                bgcolor: colors.gold,
                color: "#0A0F18",
              }}
            />
          )}
        </Box>

        <Typography
          sx={{
            mt: 0.5,
            fontSize: 12,
            color: colors.secondary,
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
            color: colors.muted,
          }}
        >
          {notification.timestamp}
        </Typography>
      </Box>
    </Box>
  );
}
