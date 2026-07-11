import type { JSX } from "react";
import { Box, Divider, Popover, Typography } from "@mui/material";
import MessageList from "./MessageList";
import { colors } from "../../theme/tokens";
import type { Message } from "../../types";

interface MessagePopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  messages: Message[];
  onClose: () => void;
  onMessageClick?: (message: Message) => void;
}

export default function MessagePopover({
  anchorEl,
  open,
  messages,
  onClose,
  onMessageClick,
}: MessagePopoverProps): JSX.Element {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          sx: {
            mt: 1,
            width: 380,
            bgcolor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: "14px",
            overflow: "hidden",
          },
        },
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.75,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: 15, color: colors.text }}>
          Messages
        </Typography>
      </Box>
      <Divider />
      <MessageList
        messages={messages}
        onMessageClick={(message) => {
          onMessageClick?.(message);
          onClose();
        }}
      />
    </Popover>
  );
}
