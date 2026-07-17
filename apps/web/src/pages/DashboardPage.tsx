import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, styled, Chip, Button, useTheme } from '@mui/material';
import { LineChart, PieChart, BarChart } from '@mui/x-charts';
import {
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  PersonAdd as PersonAddIcon,
  UploadFile as UploadFileIcon,
  AssessmentOutlined as ReportIcon,
  SmartToy as ChatIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { ChartCard, ChartSkeleton, EmptyChart } from '../components/charts';
import { StatCard } from '../components/data/StatCard';
import { ActivityFeed } from '../components/data/ActivityFeed';
import { useUsers } from '../features/users/hooks';
import { useSettings } from '../features/settings/hooks';
import { useAuditLogs } from '../features/audit-logs/hooks';
import { useLiveDashboard } from '../features/realtime/useLiveDashboard';
import LiveBadge from '../features/realtime/LiveBadge';
import { ReportsDashboardWidget } from '../features/reports/components/ReportsDashboardWidget';
import { DateRangePicker, useDateRange } from '../features/calendar';
import {
  toActivityItem,
  useDailySeries,
  useDistribution,
  useAuditActivity,
  useAuditCount,
  getPreviousRange,
  actionLabelLookup,
} from '../features/analytics';

const DashboardContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}));

const PresetRow = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  '& .MuiChip-root': {
    fontWeight: 600,
    fontSize: '0.75rem',
  },
}));

const RANGE_PRESETS = [7, 14, 30, 90] as const;

// ── Quick Action Card ──────────────────────────────

const QUICK_ACTIONS = [
  { label: 'Create User', icon: <PersonAddIcon />, path: '/users', color: 'primary' as const },
  { label: 'Upload File', icon: <UploadFileIcon />, path: '/files', color: 'warning' as const },
  { label: 'Generate Report', icon: <ReportIcon />, path: '/reports', color: 'info' as const },
  { label: 'Open AI Chat', icon: <ChatIcon />, path: '/chat', color: 'secondary' as const },
];

function QuickActionsCard() {
  const navigate = useNavigate();
  return (
    <ChartCard title="Quick Actions" subtitle="Common tasks">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
        {QUICK_ACTIONS.map((action) => (
          <Button
            key={action.path}
            variant="outlined"
            color={action.color}
            size="small"
            startIcon={action.icon}
            endIcon={<NavigateNextIcon />}
            onClick={() => navigate(action.path)}
            sx={{ justifyContent: 'flex-start', textTransform: 'none', fontWeight: 600 }}
          >
            {action.label}
          </Button>
        ))}
      </Box>
    </ChartCard>
  );
}

// ── Inline Sparkline ──────────────────────────────

function SparklineBar({ values, color }: { values: number[]; color: string }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '1px', height: 28, mt: 0.5 }}>
      {values.slice(-14).map((v, i) => (
        <Box
          key={i}
          sx={{
            flex: 1,
            height: `${(v / max) * 100}%`,
            minHeight: 2,
            borderRadius: '1px 1px 0 0',
            bgcolor: color,
            opacity: 0.6,
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 1 },
          }}
        />
      ))}
    </Box>
  );
}

// ── Page ──────────────────────────────────────────

export function DashboardPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { range: dateRange, rangeDays, setRange } = useDateRange();

  // Refresh dashboard data in real time as org-scoped audit events arrive.
  useLiveDashboard();

  const usersAll = useUsers({ perPage: 1 });
  const usersActive = useUsers({ perPage: 1, isActive: true });
  const settingsQuery = useSettings();
  const auditQuery = useAuditLogs({ perPage: 6, sort: 'createdAt', order: 'desc' });

  const { startDate, endDate } = useMemo(
    () => ({ startDate: dateRange.startDate, endDate: dateRange.endDate }),
    [dateRange.startDate, dateRange.endDate],
  );

  const analytics = useAuditActivity(startDate, endDate, rangeDays);
  const logs = analytics.logs;

  const totalUsers = usersAll.data?.meta?.total ?? 0;
  const activeUsers = usersActive.data?.meta?.total ?? 0;
  const inactiveUsers = Math.max(0, totalUsers - activeUsers);
  const settingsCount = Object.keys(settingsQuery.data?.data?.settings ?? {}).length;

  // Trend: current window audit events vs. the previous equal-length window.
  const prevRange = useMemo(() => getPreviousRange(rangeDays, endDate), [rangeDays, endDate]);
  const prevCountQuery = useAuditCount(prevRange.startDate, prevRange.endDate);
  const currentEvents = analytics.total;
  const prevEvents = prevCountQuery.data ?? 0;
  const eventsChange =
    prevEvents > 0
      ? Math.round(((currentEvents - prevEvents) / prevEvents) * 1000) / 10
      : undefined;

  const activityItems = (auditQuery.data?.data ?? []).map(toActivityItem);

  const daily = useDailySeries(logs, rangeDays, endDate);
  const byAction = useDistribution(logs, (l) => l.action, actionLabelLookup, 6);

  const chartsLoading = analytics.loading;

  // ── Chart click handlers ──────────────────────
  const handlePieClick = useCallback(
    (_event: unknown, _item: { dataIndex?: number }) => {
      navigate('/users');
    },
    [navigate],
  );

  const handleActionBarClick = useCallback(
    (_event: unknown, _item: { dataIndex?: number }) => {
      // Navigate to system logs page for deeper inspection
      navigate('/system-logs');
    },
    [navigate],
  );

  return (
    <DashboardContainer>
      {/* ── Header ────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h4" fontWeight={700}>
              Dashboard
            </Typography>
            <LiveBadge />
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Welcome back! Here's what's happening with your platform.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <PresetRow>
            {RANGE_PRESETS.map((days) => (
              <Chip
                key={days}
                label={`${days}d`}
                size="small"
                variant={rangeDays === days ? 'filled' : 'outlined'}
                color={rangeDays === days ? 'primary' : 'default'}
                onClick={() => {
                  const end = new Date();
                  end.setHours(23, 59, 59, 999);
                  const start = new Date();
                  start.setDate(start.getDate() - (days - 1));
                  start.setHours(0, 0, 0, 0);
                  setRange({ startDate: start.toISOString(), endDate: end.toISOString() });
                }}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </PresetRow>
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setRange} />
        </Box>
      </Box>

      {/* ── KPI Stats ──────────────────────── */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Total Users"
            value={totalUsers}
            icon={<PeopleIcon />}
            iconColor="primary"
            loading={usersAll.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Active Users"
            value={activeUsers}
            icon={<CheckCircleIcon />}
            iconColor="success"
            loading={usersActive.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="System Settings"
            value={settingsCount}
            icon={<SettingsIcon />}
            iconColor="warning"
            loading={settingsQuery.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Audit Events"
            value={currentEvents}
            change={eventsChange}
            changeLabel={`vs. previous ${rangeDays}d`}
            icon={<AssessmentIcon />}
            iconColor="info"
            loading={chartsLoading}
          />
        </Grid>
      </Grid>

      {/* ── Trend sparklines row ────────────── */}
      {!chartsLoading && daily.values.length > 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartCard sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  Activity Trend ({rangeDays}d)
                </Typography>
              </Box>
              <SparklineBar values={daily.values} color={theme.palette.primary.main} />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block' }}
              >
                {daily.values.reduce((a, b) => a + b, 0)} total events
              </Typography>
            </ChartCard>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <ChartCard sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  User Composition
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={700}>
                {activeUsers}
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 0.5 }}
                >
                  / {totalUsers} active
                </Typography>
              </Typography>
              <Box
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'action.hover',
                  overflow: 'hidden',
                  mt: 1,
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: `${totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0}%`,
                    borderRadius: 4,
                    bgcolor: theme.palette.success.main,
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block' }}
              >
                {totalUsers > 0
                  ? `${Math.round((activeUsers / totalUsers) * 100)}% active`
                  : 'No users'}
              </Typography>
            </ChartCard>
          </Grid>
        </Grid>
      )}

      {/* ── Audit Activity + Recent Activity ── */}
      <Grid container spacing={3}>
        {/* Analytics time-series */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <ChartCard
            title="Audit Activity"
            subtitle="Events per day across the selected period"
            action={
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Last {rangeDays} {rangeDays === 1 ? 'day' : 'days'}
              </Typography>
            }
          >
            {chartsLoading ? (
              <ChartSkeleton height={300} />
            ) : (
              <LineChart
                height={300}
                series={[{ data: daily.values, area: true, color: theme.palette.primary.main }]}
                xAxis={[{ scaleType: 'band', data: daily.labels }]}
                yAxis={[{ min: 0 }]}
                margin={{ top: 16, right: 16, bottom: 28, left: 36 }}
              />
            )}
          </ChartCard>
        </Grid>

        {/* Recent activity feed */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <ChartCard sx={{ p: 0, overflow: 'hidden' }}>
            <ActivityFeed items={activityItems} title="Recent Activity" maxItems={6} />
          </ChartCard>
        </Grid>
      </Grid>

      {/* ── Charts Row ──────────────────────── */}
      <Grid container spacing={3}>
        {/* User status distribution — click to navigate */}
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard title="User Status" subtitle="Click to manage users">
            {usersAll.isLoading || usersActive.isLoading ? (
              <ChartSkeleton height={240} />
            ) : (
              <PieChart
                height={260}
                series={[
                  {
                    data: [
                      {
                        id: 'active',
                        value: activeUsers,
                        label: 'Active',
                        color: theme.palette.success.main,
                      },
                      {
                        id: 'inactive',
                        value: inactiveUsers,
                        label: 'Inactive',
                        color: theme.palette.grey[400],
                      },
                    ],
                    innerRadius: 50,
                    paddingAngle: 3,
                    cornerRadius: 4,
                  },
                ]}
                slotProps={{
                  legend: {
                    direction: 'horizontal',
                    position: { vertical: 'bottom', horizontal: 'center' },
                  },
                }}
                onItemClick={handlePieClick}
              />
            )}
          </ChartCard>
        </Grid>

        {/* Activity by action type — click to inspect */}
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard title="Activity by Action" subtitle="Click to inspect in System Logs">
            {chartsLoading ? (
              <ChartSkeleton height={240} />
            ) : byAction.length === 0 ? (
              <EmptyChart height={260} />
            ) : (
              <BarChart
                layout="horizontal"
                height={260}
                series={[
                  {
                    data: byAction.map((entry) => entry.value),
                    color: theme.palette.primary.main,
                    highlightScope: { highlight: 'item', fade: 'global' },
                  },
                ]}
                yAxis={[{ scaleType: 'band', data: byAction.map((entry) => entry.label) }]}
                xAxis={[{ min: 0 }]}
                margin={{ top: 8, right: 24, bottom: 24, left: 100 }}
                onItemClick={handleActionBarClick}
              />
            )}
          </ChartCard>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <QuickActionsCard />
        </Grid>

        {/* Reports Overview Widget */}
        <Grid size={{ xs: 12, md: 4 }}>
          <ReportsDashboardWidget />
        </Grid>
      </Grid>
    </DashboardContainer>
  );
}

export default DashboardPage;
