import { Box, Tooltip } from '@mui/material';
import { useConnectionStatus } from '../../websocket/hooks';
import { colors } from '../../theme/tokens';

/**
 * Compact "LIVE / OFFLINE" indicator shown on admin surfaces. It reflects the
 * current WebSocket connection status so operators know when real-time
 * updates are flowing.
 */
export default function LiveBadge() {
  const status = useConnectionStatus();
  const live = status === 'connected';
  const color = live ? colors.success : colors.muted;

  return (
    <Tooltip title={live ? 'Live updates active' : 'Live updates disconnected'}>
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0.5,
          borderRadius: '999px',
          border: `1px solid ${colors.border}`,
          bgcolor: 'rgba(255,255,255,0.03)',
          flexShrink: 0,
        }}
      >
        <Box
          component="span"
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: color,
            boxShadow: live ? `0 0 8px ${color}` : 'none',
            animation: live ? 'livePulse 1.6s infinite' : 'none',
            '@keyframes livePulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.4 },
            },
          }}
        />
        <Box component="span" sx={{ fontSize: 11, fontWeight: 700, color: colors.muted }}>
          {live ? 'LIVE' : 'OFFLINE'}
        </Box>
      </Box>
    </Tooltip>
  );
}
