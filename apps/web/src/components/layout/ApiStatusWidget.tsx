/**
 * ApiStatusWidget
 *
 * Self-contained widget that polls the API health endpoint and displays
 * the connection status, latency, version, and maintenance mode.
 *
 * Fully theme-aware via MUI's `useTheme` and `sx` — no hardcoded tokens.
 */

import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { Box, Typography, Chip, Skeleton, useTheme } from '@mui/material';
import { Activity } from 'lucide-react';

interface ApiStatus {
  status: 'healthy' | 'error' | 'loading';
  latency?: number;
  error?: string;
  url?: string;
  version?: string;
}

/** Determine the health-check URL based on the current environment. */
function getHealthUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api/v1/health`;
  }
  // In dev, the Vite proxy forwards /api → localhost:5000
  if (import.meta.env.DEV) {
    return '/api/v1/health';
  }
  // Fallback for production
  return 'https://vestara-admin-api.vercel.app/api/v1/health';
}

export default function ApiStatusWidget(): JSX.Element {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [status, setStatus] = useState<ApiStatus>({
    status: 'loading',
  });

  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const start = Date.now();
        const res = await fetch(getHealthUrl(), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const latency = Date.now() - start;

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        if (!cancelled) {
          setStatus({
            status: 'healthy',
            latency,
            url: new URL(res.url).hostname,
            version: data.version || '1.0.0',
          });
        }
      } catch (err) {
        if (!cancelled) {
          setStatus({
            status: 'error',
            error: err instanceof Error ? err.message : 'Connection failed',
          });
        }
      }
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, 30_000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Header label */}
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          color: theme.palette.text.disabled,
          mb: 1,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        Server API Status
      </Typography>

      {/* Status row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {status.status === 'loading' ? (
          <>
            <Activity size={14} color={theme.palette.info.main} className="animate-pulse" />
            <Typography
              sx={{
                fontSize: 12,
                color: theme.palette.info.main,
                fontWeight: 600,
              }}
            >
              Checking…
            </Typography>
          </>
        ) : status.status === 'error' ? (
          <>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: theme.palette.error.main,
                boxShadow: `0 0 6px ${theme.palette.error.main}80`,
              }}
            />
            <Typography
              sx={{
                fontSize: 12,
                color: theme.palette.error.main,
                fontWeight: 600,
              }}
            >
              Disconnected
            </Typography>
          </>
        ) : (
          <>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: theme.palette.success.main,
                boxShadow: `0 0 8px ${theme.palette.success.main}80`,
              }}
            />
            <Typography
              sx={{
                fontSize: 12,
                color: theme.palette.success.main,
                fontWeight: 600,
              }}
            >
              Connected
            </Typography>
          </>
        )}
      </Box>

      {/* Version + latency */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {status.status === 'loading' ? (
          <Skeleton variant="text" width={120} height={16} />
        ) : status.status === 'error' ? (
          <Typography sx={{ fontSize: 11, color: theme.palette.error.main }}>
            {status.error}
          </Typography>
        ) : (
          <>
            <Chip
              label={`v${status.version || '1.0.0'}`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                bgcolor: `${theme.palette.success.main}20`,
                color: theme.palette.success.main,
                border: `1px solid ${theme.palette.success.main}40`,
              }}
            />
            {status.latency !== undefined && (
              <Typography sx={{ fontSize: '0.65rem', color: theme.palette.text.disabled }}>
                • {status.latency}ms
              </Typography>
            )}
          </>
        )}
      </Box>

      {/* API URL badge */}
      {status.url && (
        <Box
          sx={{
            mt: 1,
            p: 1,
            borderRadius: 1,
            bgcolor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.625rem',
              color: theme.palette.text.disabled,
              fontFamily: "'SF Mono', 'Monaco', monospace",
              textAlign: 'center',
            }}
          >
            {status.url}
          </Typography>
        </Box>
      )}

      {/* Operational / Maintenance banner */}
      <Box
        sx={{
          mt: 1,
          p: 1,
          borderRadius: 1,
          bgcolor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
          border: `1px solid ${
            status.status === 'error' ? theme.palette.error.main : theme.palette.success.main
          }`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor:
                status.status === 'error' ? theme.palette.error.main : theme.palette.success.main,
              boxShadow:
                status.status === 'error'
                  ? `0 0 4px ${theme.palette.error.main}80`
                  : `0 0 4px ${theme.palette.success.main}80`,
            }}
          />
          <Typography
            sx={{
              fontSize: '0.625rem',
              color:
                status.status === 'error' ? theme.palette.error.main : theme.palette.success.main,
              fontWeight: 600,
            }}
          >
            {status.status === 'error' ? 'Maintenance Mode Active' : 'Operational'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
