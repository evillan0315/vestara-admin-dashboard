import { Box, Typography, Grid, Chip, Paper, LinearProgress, useTheme } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon,
  Wifi as WifiIcon,
} from '@mui/icons-material';
import { ChartCard } from '../components/charts';
import { StatCard } from '../components/data/StatCard';
import { useSystemMetrics, useHealthStatus } from '../features/monitoring/hooks';

function StatusChip({ status }: { status: string }) {
  const color =
    status === 'healthy' ? 'success' : status === 'degraded' ? 'warning' : 'error';
  const icon =
    status === 'healthy' ? (
      <CheckCircleIcon fontSize="small" />
    ) : status === 'degraded' ? (
      <WarningIcon fontSize="small" />
    ) : (
      <ErrorIcon fontSize="small" />
    );
  return <Chip icon={icon} label={status} color={color} size="small" variant="outlined" />;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function MemoryBar({ used, total, label }: { used: string; total: string; label: string }) {
  const theme = useTheme();
  const usedNum = parseFloat(used);
  const totalNum = parseFloat(total);
  const percent = totalNum > 0 ? (usedNum / totalNum) * 100 : 0;
  const color = percent > 90 ? 'error' : percent > 75 ? 'warning' : 'primary';

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" fontWeight={600}>
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {used} / {total}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent}
        color={color}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );
}

export function MonitoringPage() {
  const theme = useTheme();
  const { data: metrics, isLoading: metricsLoading } = useSystemMetrics();
  const { data: health, isLoading: healthLoading } = useHealthStatus();

  const isLoading = metricsLoading || healthLoading;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" fontWeight={700}>
          System Monitoring
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Real-time server health, performance metrics, and system status.
        </Typography>
      </Box>

      {/* Health Status */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Health Status"
            value={health?.status ?? '—'}
            icon={<CheckCircleIcon />}
            iconColor={health?.status === 'healthy' ? 'success' : health?.status === 'degraded' ? 'warning' : 'error'}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Uptime"
            value={health ? formatUptime(health.uptime) : '—'}
            icon={<TimerIcon />}
            iconColor="info"
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Requests/sec"
            value={metrics?.percentiles.requestsPerSecond ?? 0}
            icon={<SpeedIcon />}
            iconColor="primary"
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Error Rate"
            value={`${metrics?.percentiles.errorRate ?? 0}%`}
            icon={<ErrorIcon />}
            iconColor={metrics && metrics.percentiles.errorRate > 5 ? 'error' : 'success'}
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Deep Health Checks */}
      {health && (
        <ChartCard title="Health Checks" subtitle="Service connectivity and status">
          <Grid container spacing={2}>
            {Object.entries(health.checks).map(([name, check]) => (
              <Grid key={name} size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    borderColor:
                      check.status === 'healthy'
                        ? theme.palette.success.main
                        : check.status === 'degraded'
                          ? theme.palette.warning.main
                          : theme.palette.error.main,
                  }}
                >
                  {check.status === 'healthy' ? (
                    <CheckCircleIcon color="success" />
                  ) : check.status === 'degraded' ? (
                    <WarningIcon color="warning" />
                  ) : (
                    <ErrorIcon color="error" />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                      {name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {check.latencyMs !== undefined ? `${check.latencyMs}ms` : check.error ?? 'OK'}
                    </Typography>
                  </Box>
                  <StatusChip status={check.status} />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </ChartCard>
      )}

      {/* Response Time Metrics */}
      {metrics && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ChartCard title="Response Time Percentiles" subtitle="Last 5 minutes">
              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={700} color="primary.main">
                      {metrics.percentiles.p50}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      P50 (ms)
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={700} color="warning.main">
                      {metrics.percentiles.p95}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      P95 (ms)
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={700} color="error.main">
                      {metrics.percentiles.p99}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      P99 (ms)
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Average
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {metrics.percentiles.avgMs}ms
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Requests
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {metrics.percentiles.totalRequests.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Errors
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="error.main">
                    {metrics.percentiles.totalErrors.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </ChartCard>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <ChartCard title="System Resources" subtitle="Server process metrics">
              <MemoryBar
                used={metrics.system.memoryFormatted.heapUsed}
                total={metrics.system.memoryFormatted.heapTotal}
                label="Heap Memory"
              />
              <MemoryBar
                used={metrics.system.memoryFormatted.rss}
                total={metrics.system.memoryFormatted.heapTotal}
                label="RSS Memory"
              />
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Node.js Version
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {metrics.system.nodeVersion}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Process ID
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {metrics.system.pid}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    WebSocket Connections
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {metrics.activeWsConnections}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Server Uptime
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatUptime(metrics.system.uptime)}
                  </Typography>
                </Box>
              </Box>
            </ChartCard>
          </Grid>
        </Grid>
      )}

      {/* Route Performance */}
      {metrics && metrics.routes.length > 0 && (
        <ChartCard
          title="Route Performance"
          subtitle={`Top ${metrics.routes.length} routes by request count (last 5 min)`}
        >
          <Box sx={{ overflowX: 'auto' }}>
            <Box
              component="table"
              sx={{
                width: '100%',
                borderCollapse: 'collapse',
                '& th, & td': {
                  px: 2,
                  py: 1,
                  textAlign: 'left',
                  borderBottom: 1,
                  borderColor: 'divider',
                  fontSize: '0.8125rem',
                },
                '& th': { fontWeight: 600, color: 'text.secondary' },
                '& tr:hover td': { bgcolor: 'action.hover' },
              }}
            >
              <Box component="thead">
                <Box component="tr">
                  <Box component="th">Route</Box>
                  <Box component="th" align="right">Requests</Box>
                  <Box component="th" align="right">Avg (ms)</Box>
                  <Box component="th" align="right">Error %</Box>
                </Box>
              </Box>
              <Box component="tbody">
                {metrics.routes.map((route) => (
                  <Box component="tr" key={route.route}>
                    <Box component="td">
                      <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                        {route.route}
                      </Typography>
                    </Box>
                    <Box component="td" align="right">
                      {route.count.toLocaleString()}
                    </Box>
                    <Box component="td" align="right">
                      <Typography
                        variant="body2"
                        color={route.avgMs > 1000 ? 'error.main' : route.avgMs > 500 ? 'warning.main' : 'text.primary'}
                      >
                        {route.avgMs}
                      </Typography>
                    </Box>
                    <Box component="td" align="right">
                      <Typography
                        variant="body2"
                        color={route.errorRate > 5 ? 'error.main' : route.errorRate > 0 ? 'warning.main' : 'success.main'}
                      >
                        {route.errorRate}%
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </ChartCard>
      )}
    </Box>
  );
}

export default MonitoringPage;
