import { useState } from 'react';
import { Box, Avatar, Tooltip, Popover, Typography, Chip } from '@mui/material';
import { useWebSocketEvent } from '../../websocket/hooks';
import { colors } from '../../theme/tokens';
import { UserRole } from '@vestara/types';
import type { WsPresencePayload } from '@vestara/types';

const ROLE_COLOR: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: colors.gold,
  [UserRole.ADMIN]: colors.info,
  [UserRole.MODERATOR]: colors.success,
  [UserRole.SUPPORT]: colors.secondary,
};

function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

export default function PresenceIndicator() {
  const [presence, setPresence] = useState<WsPresencePayload | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  useWebSocketEvent('presence:update', (message) => {
    setPresence(message.payload);
  });

  const users = presence?.users ?? [];
  const onlineCount = presence?.onlineCount ?? users.length;
  const shown = users.slice(0, 3);

  return (
    <>
      <Tooltip title={onlineCount > 0 ? `${onlineCount} user(s) online` : 'No other users online'}>
        <Box
          component="span"
          onClick={(event) => setAnchorEl(event.currentTarget)}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'pointer',
            px: 1,
            py: 0.5,
            borderRadius: '999px',
            border: `1px solid ${colors.border}`,
            bgcolor: 'rgba(255,255,255,0.03)',
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'inline-flex' }}>
            {shown.length === 0 ? (
              <Avatar sx={{ width: 22, height: 22, fontSize: 10, bgcolor: colors.muted }}>·</Avatar>
            ) : (
              shown.map((user, index) => (
                <Avatar
                  key={user.userId}
                  sx={{
                    width: 22,
                    height: 22,
                    fontSize: 10,
                    bgcolor: ROLE_COLOR[user.role] ?? colors.muted,
                    ml: index === 0 ? 0 : '-6px',
                    border: `1.5px solid ${colors.card}`,
                  }}
                >
                  {initials(user.name)}
                </Avatar>
              ))
            )}
          </Box>
          <Box component="span" sx={{ fontSize: 11, fontWeight: 600, color: colors.muted }}>
            {onlineCount}
          </Box>
        </Box>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 280,
              bgcolor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.75 }}>
          <Typography fontWeight={700} fontSize={15} color={colors.text}>
            Online — {onlineCount}
          </Typography>
        </Box>
        <Box sx={{ maxHeight: 280, overflowY: 'auto', px: 1, pb: 1 }}>
          {users.length === 0 ? (
            <Typography sx={{ p: 2, color: colors.secondary, fontSize: 13 }}>
              No other users online.
            </Typography>
          ) : (
            users.map((user) => {
              const roleColor = ROLE_COLOR[user.role] ?? colors.muted;
              return (
                <Box
                  key={user.userId}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1, py: 1 }}
                >
                  <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: roleColor }}>
                    {initials(user.name)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap fontSize={13} fontWeight={600} color={colors.text}>
                      {user.name}
                    </Typography>
                    <Typography noWrap fontSize={11} color={colors.muted}>
                      {user.email}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={user.role.replace('_', ' ')}
                    sx={{
                      ml: 'auto',
                      height: 18,
                      fontSize: 9,
                      fontWeight: 700,
                      bgcolor: `${roleColor}22`,
                      color: roleColor,
                    }}
                  />
                </Box>
              );
            })
          )}
        </Box>
      </Popover>
    </>
  );
}
