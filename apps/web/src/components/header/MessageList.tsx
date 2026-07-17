import type { JSX } from 'react';
import { Avatar, Box, Divider, Typography, useTheme, alpha } from '@mui/material';
import { Mail } from 'lucide-react';
import type { Message } from './types';

interface MessageListProps {
  messages: Message[];
  onMessageClick?: (message: Message) => void;
}

export default function MessageList({ messages, onMessageClick }: MessageListProps): JSX.Element {
  const theme = useTheme();
  const { primary, text, divider } = theme.palette;

  if (messages.length === 0) {
    return (
      <Box sx={{ py: 6, px: 3, textAlign: 'center' }}>
        <Mail size={42} color={text.disabled} />
        <Typography sx={{ mt: 2, fontWeight: 700, color: text.primary }}>No messages</Typography>
        <Typography sx={{ mt: 1, color: text.secondary, fontSize: 13 }}>
          Your inbox is empty.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
      {messages.map((message, index) => (
        <Box key={message.id}>
          <Box
            onClick={() => onMessageClick?.(message)}
            sx={{
              px: 2,
              py: 1.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              cursor: 'pointer',
              transition: 'all .18s ease',
              '&:hover': { bgcolor: alpha(text.primary, 0.03) },
            }}
          >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                fontSize: 13,
                fontWeight: 700,
                bgcolor: message.unread ? primary.main : text.disabled,
                color: message.unread ? primary.contrastText : '#fff',
              }}
            >
              {message.sender
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  noWrap
                  sx={{
                    flex: 1,
                    fontWeight: message.unread ? 700 : 600,
                    fontSize: 13,
                    color: text.primary,
                  }}
                >
                  {message.sender}
                </Typography>
                <Typography sx={{ fontSize: 11, color: text.disabled, flexShrink: 0 }}>
                  {message.timestamp}
                </Typography>
              </Box>
              <Typography
                noWrap
                sx={{
                  mt: 0.25,
                  fontSize: 12,
                  fontWeight: message.unread ? 600 : 400,
                  color: text.primary,
                }}
              >
                {message.subject}
              </Typography>
              <Typography
                sx={{
                  mt: 0.25,
                  fontSize: 12,
                  color: text.secondary,
                  lineHeight: 1.45,
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 1,
                  overflow: 'hidden',
                }}
              >
                {message.preview}
              </Typography>
            </Box>
          </Box>
          {index < messages.length - 1 && <Divider sx={{ borderColor: divider }} />}
        </Box>
      ))}
    </Box>
  );
}
