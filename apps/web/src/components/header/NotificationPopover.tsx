import type { JSX } from 'react';

import { Box, Divider, IconButton, Popover, Typography, useTheme } from '@mui/material';

import { CheckCheck } from 'lucide-react';

import NotificationList from './NotificationList';

import type { Notification } from './types';

export interface NotificationPopoverProps {
  anchorEl: HTMLElement | null;

  open: boolean;

  notifications: Notification[];

  loading?: boolean;

  onClose: () => void;

  onNotificationClick?: (notification: Notification) => void;

  onMarkAllRead?: () => void;

  onViewAll?: () => void;
}

export default function NotificationPopover({
  anchorEl,
  open,
  notifications,
  loading = false,
  onClose,
  onNotificationClick,
  onMarkAllRead,
  onViewAll,
}: NotificationPopoverProps): JSX.Element {
  const theme = useTheme();
  const { text, divider, background } = theme.palette;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      slotProps={{
        paper: {
          sx: {
            mt: 1,
            width: 380,
            bgcolor: background.paper,
            border: `1px solid ${divider}`,
            borderRadius: '14px',
            overflow: 'hidden',
          },
        },
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 15,
            color: text.primary,
          }}
        >
          Notifications
        </Typography>

        <IconButton
          size="small"
          onClick={onMarkAllRead}
          sx={{
            color: text.secondary,
          }}
        >
          <CheckCheck size={18} />
        </IconButton>
      </Box>

      <Divider />

      <NotificationList
        notifications={notifications}
        loading={loading}
        onNotificationClick={(notification) => {
          onNotificationClick?.(notification);
          onClose();
        }}
        onViewAll={() => {
          onViewAll?.();
          onClose();
        }}
      />
    </Popover>
  );
}
