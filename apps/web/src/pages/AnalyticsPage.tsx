import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  styled,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  useTheme,
  type ToggleButtonGroupProps,
} from '@mui/material';
import { LineChart, PieChart, BarChart } from '@mui/x-charts';
import {
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { StatCard } from '../components/data/StatCard';
import { ActivityFeed } from '../components/data/ActivityFeed';
import { useUsers } from '../features/users/hooks';
import { useSettings } from '../features/settings/hooks';
import { useAuditLogs } from '../features/audit-logs/hooks';
import { useLiveDashboard } from '../features/realtime/useLiveDashboard';
import LiveBadge from '../features/realtime/LiveBadge';
import {
  RANGE_OPTIONS,
  type RangeOption,
  toActivityItem,
  useDailySeries,
  useDistribution,
  useAuditActivity,
  useAuditCount,
  getPreviousRange,
  actionLabelLookup,
  entityLabelLookup,
} from '../features/analytics';

const PageContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}));

const ChartCard = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  padding: theme.spacing(3),
  height: '100%',
}));

const ChartTitleRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 8,
});

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />;
}

function EmptyChart({ height = 280 }: { height?: number }) {
  return (
    <Box
      sx={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text.secondary',
      }}
    >
      <Typography variant="body2">No activity in this period</Typography>
    </Box>
  );
}

export function AnalyticsPage() {
  const theme = useTheme();
  const [range, setRange] = useState<RangeOption>(30);

  // Keep analytics live as org-scoped audit events arrive.
  useLiveDashboard();

  const usersAll = useUsers({ perPage: 1 });
  const usersActive = useUsers({ perPage: 1, isActive: true });
  const settingsQuery = useSettings();
  const auditQuery = useAuditLogs({ perPage: 8, sort: 'createdAt', order: 'desc' });

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (range - 1));
    start.setHours(0, 0, 0, 0);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [range]);

  const analytics = useAuditActivity(startDate, endDate, range);
  const logs = analytics.logs;

  const totalUsers = usersAll.data?.meta?.total ?? 0;
  const activeUsers = usersActive.data?.meta?.total ?? 0;
  const inactiveUsers = Math.max(0, totalUsers - activeUsers);
  const settingsCount = Object.keys(settingsQuery.data?.data?.settings ?? {}).length;

  const prevRange = useMemo(() => getPreviousRange(range, endDate), [range, endDate]);
  const prevCountQuery = useAuditCount(prevRange.startDate, prevRange.endDate);
  const currentEvents = analytics.total;
  const prevEvents = prevCountQuery.data ?? 0;
  const eventsChange =
    prevEvents > 0 ? Math.round(((currentEvents - prevEvents) / prevEvents) * 1000) / 10 : undefined;

  const activityItems = (auditQuery.data?.data ?? []).map(toActivityItem);

  const daily = useDailySeries(logs, range, endDate);
  const byAction = useDistribution(logs, (l) => l.action, actionLabelLookup, 6);
  const byEntity = useDistribution(logs, (l) => l.entity, entityLabelLookup);

  const chartsLoading = analytics.loading;

  const handleRangeChange: ToggleButtonGroupProps['onChange'] = (_event, newRange) => {
    if (newRange !== null) setRange(newRange as RangeOption);
  };

  return (
    <PageContainer>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h4" fontWeight={700}>
              Analytics
            </Typography>
            <LiveBadge />
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Detailed, live insights for your organization.
          </Typography>
        </Box>
        <ToggleButtonGroup
          size="small"
          value={range}
          exclusive
          onChange={handleRangeChange}
          aria-label="date range"
        >
          {RANGE_OPTIONS.map((option) => (
            <ToggleButton key={option} value={option}>
              {option}d
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

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
            title="Audit Events"
            value={currentEvents}
            change={eventsChange}
            changeLabel={`vs. previous ${range}d`}
            icon={<AssessmentIcon />}
            iconColor="info"
            loading={chartsLoading}
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
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ChartCard>
            <ChartTitleRow>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Audit Activity
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Events per day across the selected period
                </Typography>
              </Box>
            </ChartTitleRow>
            {chartsLoading ? (
              <ChartSkeleton height={320} />
            ) : (
              <LineChart
                height={320}
                series={[{ data: daily.values, area: true, color: theme.palette.primary.main }]}
                xAxis={[{ scaleType: 'band', data: daily.labels }]}
                yAxis={[{ min: 0 }]}
                margin={{ top: 16, right: 16, bottom: 28, left: 36 }}
              />
            )}
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <ChartCard>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              User Status
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Active vs. inactive accounts
            </Typography>
            {usersAll.isLoading || usersActive.isLoading ? (
              <ChartSkeleton height={280} />
            ) : (
              <PieChart
                height={300}
                series={[
                  {
                    data: [
                      { id: 'active', value: activeUsers, label: 'Active', color: theme.palette.success.main },
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
                  legend: { direction: 'horizontal', position: { vertical: 'bottom', horizontal: 'center' } },
                }}
              />
            )}
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Activity by Action
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Most frequent audit actions
            </Typography>
            {chartsLoading ? (
              <ChartSkeleton height={280} />
            ) : byAction.length === 0 ? (
              <EmptyChart height={300} />
            ) : (
              <BarChart
                layout="horizontal"
                height={300}
                series={[{ data: byAction.map((entry) => entry.value), color: theme.palette.primary.main }]}
                yAxis={[{ scaleType: 'band', data: byAction.map((entry) => entry.label) }]}
                xAxis={[{ min: 0 }]}
                margin={{ top: 8, right: 24, bottom: 24, left: 120 }}
              />
            )}
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Activity by Entity
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Events grouped by affected entity
            </Typography>
            {chartsLoading ? (
              <ChartSkeleton height={280} />
            ) : byEntity.length === 0 ? (
              <EmptyChart height={300} />
            ) : (
              <BarChart
                layout="horizontal"
                height={300}
                series={[{ data: byEntity.map((entry) => entry.value), color: theme.palette.secondary.main }]}
                yAxis={[{ scaleType: 'band', data: byEntity.map((entry) => entry.label) }]}
                xAxis={[{ min: 0 }]}
                margin={{ top: 8, right: 24, bottom: 24, left: 120 }}
              />
            )}
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <ChartCard sx={{ p: 0, overflow: 'hidden' }}>
            <ActivityFeed items={activityItems} title="Recent Activity" maxItems={8} />
          </ChartCard>
        </Grid>
      </Grid>
    </PageContainer>
  );
}

export default AnalyticsPage;
