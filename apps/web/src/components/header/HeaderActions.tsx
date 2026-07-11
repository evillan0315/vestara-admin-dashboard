import { type JSX } from "react";

import { Box } from "@mui/material";

import { Bell, Mail } from "lucide-react";

import HeaderIconButton from "./HeaderIconButton";
import DateRangeButton from "./DateRangeButton";
import RefreshButton from "./RefreshButton";
import UserMenu from "./UserMenu";

import { colors } from "../../theme/tokens";

export interface HeaderActionsProps {
  dateRange: string;

  notificationCount?: number;

  messageCount?: number;

  refreshing?: boolean;

  onRefresh?: () => Promise<void> | void;

  onNotificationsClick?: (event: React.MouseEvent<HTMLElement>) => void;

  onMessagesClick?: (event: React.MouseEvent<HTMLElement>) => void;

  onDateRangeClick?: () => void;

  onLogout?: () => Promise<void> | void;
}

export default function HeaderActions({
  dateRange,
  notificationCount = 0,
  messageCount = 0,
  refreshing = false,
  onRefresh,
  onNotificationsClick,
  onMessagesClick,
  onDateRangeClick,
  onLogout,
}: HeaderActionsProps): JSX.Element {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          display: {
            xs: "none",
            lg: "flex",
          },
          alignItems: "center",
          gap: 1,
        }}
      >
        <DateRangeButton label={dateRange} onClick={onDateRangeClick} />

        <RefreshButton loading={refreshing} onClick={onRefresh} />
      </Box>

      <HeaderIconButton
        tooltip="Notifications"
        badgeContent={notificationCount}
        icon={<Bell size={18} />}
        onClick={onNotificationsClick}
      />

      <HeaderIconButton
        tooltip="Messages"
        badgeContent={messageCount}
        badgeColor={colors.gold}
        badgeTextColor="#0A0F18"
        icon={<Mail size={18} />}
        onClick={onMessagesClick}
      />

      <UserMenu onLogout={onLogout} />
    </Box>
  );
}
