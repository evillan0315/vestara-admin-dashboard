import { type JSX } from "react";

import { Box, useTheme } from "@mui/material";

import { Bell, Mail } from "lucide-react";

import HeaderIconButton from "./HeaderIconButton";
import UserMenu from "./UserMenu";
import ConnectionStatus from "./ConnectionStatus";

export interface HeaderActionsProps {
  notificationCount?: number;

  messageCount?: number;

  onNotificationsClick?: (event: React.MouseEvent<HTMLElement>) => void;

  onMessagesClick?: (event: React.MouseEvent<HTMLElement>) => void;

  onLogout?: () => Promise<void> | void;
}

export default function HeaderActions({
  notificationCount = 0,
  messageCount = 0,
  onNotificationsClick,
  onMessagesClick,
  onLogout,
}: HeaderActionsProps): JSX.Element {
  const theme = useTheme();
  const { primary } = theme.palette;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flexShrink: 0,
      }}
    >
      <ConnectionStatus />

      <HeaderIconButton
        tooltip="Notifications"
        badgeContent={notificationCount}
        icon={<Bell size={18} />}
        onClick={onNotificationsClick}
      />

      <HeaderIconButton
        tooltip="Messages"
        badgeContent={messageCount}
        badgeColor={primary.main}
        badgeTextColor={primary.contrastText}
        icon={<Mail size={18} />}
        onClick={onMessagesClick}
      />

      <UserMenu onLogout={onLogout} />
    </Box>
  );
}
