import { Box, Tooltip } from '@mui/material';
import { useConnectionStatus } from '../../websocket/hooks';
import { colors } from '../../theme/tokens';

const LABELS: Record<string, string> = {
  connected: 'Live — real-time connected',
  connecting: 'Connecting to real-time service…',
  reconnecting: 'Reconnecting to real-time service…',
  disconnected: 'Real-time disconnected',
  error: 'Real-time connection error',
};

const DOT_COLORS: Record<string, string> = {
  connected: colors.success,
  connecting: colors.warning,
  reconnecting: colors.warning,
  disconnected: colors.muted,
  error: colors.error,
};

const SHORT_LABEL: Record<string, string> = {
  connected: 'Live',
  connecting: '…',
  reconnecting: '…',
  disconnected: 'Offline',
  error: 'Error',
};

/**
 * Compact real-time connection indicator shown in the header. Surfaces the
 * WebSocket connection lifecycle so users can see when live updates are active.
 */
export default function ConnectionStatus() {
  const status = useConnectionStatus();
  const color = DOT_COLORS[status] ?? colors.muted;

  return (
    <Tooltip title={LABELS[status] ?? LABELS.disconnected}>
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1,
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
            boxShadow: status === 'connected' ? `0 0 8px ${color}` : 'none',
            transition: 'background-color .2s ease',
          }}
        />
        <Box
          component="span"
          sx={{ fontSize: 11, fontWeight: 600, color: colors.muted, lineHeight: 1 }}
        >
          {SHORT_LABEL[status] ?? SHORT_LABEL.disconnected}
        </Box>
      </Box>
    </Tooltip>
  );
}
