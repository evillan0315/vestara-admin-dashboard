import { useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  styled,
  Skeleton,
  useTheme,
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
import { useAuth } from '../features/auth/AuthContext';
import { useLiveDashboard } from '../features/realtime/useLiveDashboard';
import LiveBadge from '../features/realtime/LiveBadge';
import { useOrganization } from '../features/organizations/hooks';
import { useDateRange } from '../features/calendar';
import {
  toActivityItem,
  useDailySeries,
  useDistribution,
  useAuditActivity,
  useAuditCount,
  getPreviousRange,
  actionLabelLookup,
  entityLabelLookup,
} from '../features/analytics';

const DashboardContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}));

const WelcomeSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const StatsGrid = styled(Grid)(() => ({
  '& .MuiGrid-item': {
    display: 'flex',
  },
}));

const ChartCard = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
  },
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

// ── Page ──────────────────────────────────────────────

export function DashboardPage() {
  const theme = useTheme();
  const { user } = useAuth();
  const { range: dateRange, rangeDays } = useDateRange();

  // Refresh dashboard data in real time as org-scoped audit events arrive.
  useLiveDashboard();

  // Fetch the current organization to display its name (not the raw id).
  const organizationQuery = useOrganization(user?.organizationId ?? '');
  const organizationName = organizationQuery.data?.name;

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
    prevEvents > 0 ? Math.round(((currentEvents - prevEvents) / prevEvents) * 1000) / 10 : undefined;

  const activityItems = (auditQuery.data?.data ?? []).map(toActivityItem);

  const daily = useDailySeries(logs, rangeDays, endDate);
  const byAction = useDistribution(logs, (l) => l.action, actionLabelLookup, 6);
  const byEntity = useDistribution(logs, (l) => l.entity, entityLabelLookup);

  const chartsLoading = analytics.loading;

  return (
    <DashboardContainer>
      <WelcomeSection>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              Welcome back! Here's what's happening with your platform.
            </Typography>
          </Box>
          {user?.organizationId && (
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LiveBadge />
              {organizationName && (
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Organization: {organizationName}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </WelcomeSection>

      <StatsGrid container spacing={3}>
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
      </StatsGrid>

      <Grid container spacing={3}>
        {/* Analytics time-series */}
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
              <Box
                sx={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'text.secondary',
                  px: 1,
                }}
              >
                Last {rangeDays} {rangeDays === 1 ? 'day' : 'days'}
              </Box>
            </ChartTitleRow>
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
            <ActivityFeed
              items={activityItems}
              title="Recent Activity"
              maxItems={6}
            />
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* User status distribution */}
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              User Status
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Active vs. inactive accounts
            </Typography>
            {usersAll.isLoading || usersActive.isLoading ? (
              <ChartSkeleton height={240} />
            ) : (
              <PieChart
                height={260}
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

        {/* Activity by action type */}
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Activity by Action
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Most frequent audit actions
            </Typography>
            {chartsLoading ? (
              <ChartSkeleton height={240} />
            ) : byAction.length === 0 ? (
              <EmptyChart height={260} />
            ) : (
              <BarChart
                layout="horizontal"
                height={260}
                series={[{ data: byAction.map((entry) => entry.value), color: theme.palette.primary.main }]}
                yAxis={[{ scaleType: 'band', data: byAction.map((entry) => entry.label) }]}
                xAxis={[{ min: 0 }]}
                margin={{ top: 8, right: 24, bottom: 24, left: 100 }}
              />
            )}
          </ChartCard>
        </Grid>

        {/* Activity by entity */}
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Activity by Entity
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Events grouped by affected entity
            </Typography>
            {chartsLoading ? (
              <ChartSkeleton height={240} />
            ) : byEntity.length === 0 ? (
              <EmptyChart height={260} />
            ) : (
              <BarChart
                layout="horizontal"
                height={260}
                series={[{ data: byEntity.map((entry) => entry.value), color: theme.palette.secondary.main }]}
                yAxis={[{ scaleType: 'band', data: byEntity.map((entry) => entry.label) }]}
                xAxis={[{ min: 0 }]}
                margin={{ top: 8, right: 24, bottom: 24, left: 100 }}
              />
            )}
          </ChartCard>
        </Grid>
      </Grid>
    </DashboardContainer>
  );
}

export default DashboardPage;
