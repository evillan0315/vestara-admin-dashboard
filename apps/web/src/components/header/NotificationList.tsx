import type { JSX } from "react";

import { Box, Button, Divider, Typography, useTheme, alpha } from "@mui/material";

import { Bell } from "lucide-react";

import NotificationItem from "./NotificationItem";

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
  const theme = useTheme();
  const { primary, text, divider } = theme.palette;

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
            color: text.secondary,
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
        <Bell size={42} color={text.disabled} />

        <Typography
          sx={{
            mt: 2,
            fontWeight: 700,
            color: text.primary,
          }}
        >
          You're all caught up
        </Typography>

        <Typography
          sx={{
            mt: 1,
            color: text.secondary,
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
                  borderColor: divider,
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
            color: primary.main,
            fontWeight: 700,
            borderRadius: "10px",

            "&:hover": {
              bgcolor: alpha(primary.main, 0.08),
            },
          }}
        >
          View all notifications
        </Button>
      </Box>
    </>
  );
}
