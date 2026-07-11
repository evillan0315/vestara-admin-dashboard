import type { JSX } from "react";
import { Avatar, Box, Divider, Typography } from "@mui/material";
import { Mail } from "lucide-react";
import { colors } from "../../theme/tokens";
import type { Message } from "./types";

interface MessageListProps {
  messages: Message[];
  onMessageClick?: (message: Message) => void;
}

export default function MessageList({
  messages,
  onMessageClick,
}: MessageListProps): JSX.Element {
  if (messages.length === 0) {
    return (
      <Box sx={{ py: 6, px: 3, textAlign: "center" }}>
        <Mail size={42} color={colors.muted} />
        <Typography sx={{ mt: 2, fontWeight: 700, color: colors.text }}>
          No messages
        </Typography>
        <Typography sx={{ mt: 1, color: colors.secondary, fontSize: 13 }}>
          Your inbox is empty.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxHeight: 420, overflowY: "auto" }}>
      {messages.map((message, index) => (
        <Box key={message.id}>
          <Box
            onClick={() => onMessageClick?.(message)}
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              cursor: "pointer",
              transition: "all .18s ease",
              "&:hover": { bgcolor: "rgba(255,255,255,.03)" },
            }}
          >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                fontSize: 13,
                fontWeight: 700,
                bgcolor: message.unread ? colors.gold : colors.muted,
                color: message.unread ? "#0A0F18" : "#fff",
              }}
            >
              {message.sender
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  noWrap
                  sx={{
                    flex: 1,
                    fontWeight: message.unread ? 700 : 600,
                    fontSize: 13,
                    color: colors.text,
                  }}
                >
                  {message.sender}
                </Typography>
                <Typography
                  sx={{ fontSize: 11, color: colors.muted, flexShrink: 0 }}
                >
                  {message.timestamp}
                </Typography>
              </Box>
              <Typography
                noWrap
                sx={{
                  mt: 0.25,
                  fontSize: 12,
                  fontWeight: message.unread ? 600 : 400,
                  color: colors.text,
                }}
              >
                {message.subject}
              </Typography>
              <Typography
                sx={{
                  mt: 0.25,
                  fontSize: 12,
                  color: colors.secondary,
                  lineHeight: 1.45,
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 1,
                  overflow: "hidden",
                }}
              >
                {message.preview}
              </Typography>
            </Box>
          </Box>
          {index < messages.length - 1 && (
            <Divider sx={{ borderColor: colors.border }} />
          )}
        </Box>
      ))}
    </Box>
  );
}
