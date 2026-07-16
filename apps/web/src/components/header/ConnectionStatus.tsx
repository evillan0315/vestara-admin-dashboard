import { Box, Tooltip, useTheme, alpha } from '@mui/material';
import { useConnectionStatus } from '../../websocket/hooks';

const LABELS: Record<string, string> = {
  connected: 'Live — real-time connected',
  connecting: 'Connecting to real-time service…',
  reconnecting: 'Reconnecting to real-time service…',
  disconnected: 'Real-time disconnected',
  error: 'Real-time connection error',
  unavailable: 'Real-time unavailable on this deployment (serverless)',
};

const SHORT_LABEL: Record<string, string> = {
  connected: 'Live',
  connecting: '…',
  reconnecting: '…',
  disconnected: 'Offline',
  error: 'Error',
  unavailable: 'Off',
};

/**
 * Compact real-time connection indicator shown in the header. Surfaces the
 * WebSocket connection lifecycle so users can see when live updates are active.
 */
export default function ConnectionStatus() {
  const theme = useTheme();
  const { success, warning, error, text, divider } = theme.palette;

  const DOT_COLORS: Record<string, string> = {
    connected: success.main,
    connecting: warning.main,
    reconnecting: warning.main,
    disconnected: text.disabled,
    error: error.main,
    unavailable: text.disabled,
  };

  const status = useConnectionStatus();
  const color = DOT_COLORS[status] ?? text.disabled;

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
          border: `1px solid ${divider}`,
          bgcolor: alpha(theme.palette.text.primary, 0.03),
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
          sx={{ fontSize: 11, fontWeight: 600, color: text.disabled, lineHeight: 1 }}
        >
          {SHORT_LABEL[status] ?? SHORT_LABEL.disconnected}
        </Box>
      </Box>
    </Tooltip>
  );
}
