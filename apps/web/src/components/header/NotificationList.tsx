import type { JSX } from "react";

import { Box, Button, Divider, Typography } from "@mui/material";

import { Bell } from "lucide-react";

import NotificationItem from "./NotificationItem";

import { colors } from "../../theme/tokens";
import type { Notification } from "./types";

export interface NotificationListProps {
  notifications: Notification[];

  loading?: boolean;

  onNotificationClick?: (notification: Notification) => void;

  onViewAll?: () => void;
}

export default function NotificationList({
  notifications,
  loading = false,
  onNotificationClick,
  onViewAll,
}: NotificationListProps): JSX.Element {
  if (loading) {
    return (
      <Box
        sx={{
          px: 3,
          py: 6,
          textAlign: "center",
        }}
      >
        <Typography
          sx={{
            color: colors.secondary,
            fontSize: 13,
          }}
        >
          Loading notifications...
        </Typography>
      </Box>
    );
  }

  if (notifications.length === 0) {
    return (
      <Box
        sx={{
          py: 6,
          px: 3,
          textAlign: "center",
        }}
      >
        <Bell size={42} color={colors.muted} />

        <Typography
          sx={{
            mt: 2,
            fontWeight: 700,
            color: colors.text,
          }}
        >
          You're all caught up
        </Typography>

        <Typography
          sx={{
            mt: 1,
            color: colors.secondary,
            fontSize: 13,
          }}
        >
          No notifications at the moment.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          maxHeight: 420,
          overflowY: "auto",
        }}
      >
        {notifications.map((notification, index) => (
          <Box key={notification.id}>
            <NotificationItem
              notification={notification}
              onClick={onNotificationClick}
            />

            {index < notifications.length - 1 && (
              <Divider
                sx={{
                  borderColor: colors.border,
                }}
              />
            )}
          </Box>
        ))}
      </Box>

      <Divider />

      <Box
        sx={{
          p: 1,
        }}
      >
        <Button
          fullWidth
          onClick={onViewAll}
          sx={{
            textTransform: "none",
            color: colors.gold,
            fontWeight: 700,
            borderRadius: "10px",

            "&:hover": {
              bgcolor: "rgba(216,164,65,.08)",
            },
          }}
        >
          View all notifications
        </Button>
      </Box>
    </>
  );
}
