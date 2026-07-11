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
  Login as LoginIcon,
  Logout as LogoutIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import type { ReactNode } from 'react';
import { StatCard } from '../components/data/StatCard';
import { ActivityFeed } from '../components/data/ActivityFeed';
import type { ActivityItem } from '../components/data/ActivityFeed';
import { useUsers } from '../features/users/hooks';
import { useSettings } from '../features/settings/hooks';
import { useAuditLogs, useAuditLogsRange } from '../features/audit-logs/hooks';
import { AuditAction, EntityType, type AuditLogDTO } from '@vestara/types';

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

// ── Audit log → Activity feed mapping ─────────────────

type ActivityColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

function actionVerb(action: AuditAction): string {
  switch (action) {
    case AuditAction.LOGIN:
      return 'logged in';
    case AuditAction.LOGOUT:
      return 'logged out';
    case AuditAction.CREATE:
      return 'created a';
    case AuditAction.UPDATE:
      return 'updated a';
    case AuditAction.DELETE:
      return 'deleted a';
    case AuditAction.APPROVE:
      return 'approved a';
    case AuditAction.REJECT:
      return 'rejected a';
    case AuditAction.SUSPEND:
      return 'suspended a';
    case AuditAction.ACTIVATE:
      return 'activated a';
    case AuditAction.PASSWORD_CHANGE:
      return 'changed their password';
    case AuditAction.SETTINGS_UPDATE:
      return 'updated a setting';
    case AuditAction.SETTINGS_DELETE:
      return 'deleted a setting';
    default:
      return 'performed an action on a';
  }
}

function entityLabel(entity: EntityType): string {
  switch (entity) {
    case EntityType.USER:
      return 'user';
    case EntityType.ROLE:
      return 'role';
    case EntityType.SETTING:
      return 'setting';
    case EntityType.AUDIT_LOG:
      return 'audit log';
    default:
      return 'record';
  }
}

function actionColor(action: AuditAction): ActivityColor {
  switch (action) {
    case AuditAction.LOGIN:
    case AuditAction.LOGOUT:
      return 'info';
    case AuditAction.CREATE:
    case AuditAction.APPROVE:
    case AuditAction.ACTIVATE:
      return 'success';
    case AuditAction.UPDATE:
    case AuditAction.SETTINGS_UPDATE:
    case AuditAction.PASSWORD_CHANGE:
      return 'warning';
    case AuditAction.DELETE:
    case AuditAction.REJECT:
    case AuditAction.SUSPEND:
    case AuditAction.SETTINGS_DELETE:
      return 'error';
    default:
      return 'primary';
  }
}

function actionIcon(action: AuditAction): ReactNode {
  switch (action) {
    case AuditAction.LOGIN:
      return <LoginIcon />;
    case AuditAction.LOGOUT:
      return <LogoutIcon />;
    case AuditAction.CREATE:
      return <PersonAddIcon />;
    case AuditAction.UPDATE:
      return <EditIcon />;
    case AuditAction.DELETE:
    case AuditAction.SETTINGS_DELETE:
      return <DeleteIcon />;
    case AuditAction.APPROVE:
    case AuditAction.ACTIVATE:
      return <CheckCircleIcon />;
    case AuditAction.REJECT:
      return <CancelIcon />;
    case AuditAction.SUSPEND:
      return <BlockIcon />;
    case AuditAction.PASSWORD_CHANGE:
      return <LockIcon />;
    case AuditAction.SETTINGS_UPDATE:
      return <SettingsIcon />;
    default:
      return undefined;
  }
}

function initialsOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.round(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

function toActivityItem(log: AuditLogDTO): ActivityItem {
  const name = log.userName?.trim() || 'System';
  const actionText =
    log.action === AuditAction.PASSWORD_CHANGE
      ? 'changed their password'
      : `${actionVerb(log.action)} ${entityLabel(log.entity)}`;
  return {
    id: log.id,
    user: { name, initials: initialsOf(name) },
    action: actionText,
    timestamp: formatRelativeTime(log.createdAt),
    icon: actionIcon(log.action),
    iconColor: actionColor(log.action),
  };
}

// ── Chart aggregation helpers ────────────────────────

const ACTION_LABELS: Record<AuditAction, string> = {
  [AuditAction.LOGIN]: 'Login',
  [AuditAction.LOGOUT]: 'Logout',
  [AuditAction.CREATE]: 'Create',
  [AuditAction.UPDATE]: 'Update',
  [AuditAction.DELETE]: 'Delete',
  [AuditAction.APPROVE]: 'Approve',
  [AuditAction.REJECT]: 'Reject',
  [AuditAction.SUSPEND]: 'Suspend',
  [AuditAction.ACTIVATE]: 'Activate',
  [AuditAction.PASSWORD_CHANGE]: 'Password',
  [AuditAction.SETTINGS_UPDATE]: 'Setting Update',
  [AuditAction.SETTINGS_DELETE]: 'Setting Delete',
  [AuditAction.ERROR]: 'Error',
};

const ENTITY_LABELS: Record<EntityType, string> = {
  [EntityType.USER]: 'User',
  [EntityType.ROLE]: 'Role',
  [EntityType.SETTING]: 'Setting',
  [EntityType.AUDIT_LOG]: 'Audit Log',
};

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function useDailySeries(logs: AuditLogDTO[], rangeDays: number, endDate: string) {
  return useMemo(() => {
    const labels: string[] = [];
    const buckets: number[] = [];
    const indexByDay = new Map<string, number>();

    for (let i = rangeDays - 1; i >= 0; i -= 1) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      indexByDay.set(dayKey(d), buckets.length);
      labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
      buckets.push(0);
    }

    for (const log of logs) {
      const idx = indexByDay.get(dayKey(new Date(log.createdAt)));
      if (idx !== undefined) buckets[idx] += 1;
    }

    return { labels, values: buckets };
  }, [logs, rangeDays, endDate]);
}

function useDistribution(logs: AuditLogDTO[], pick: (log: AuditLogDTO) => AuditAction | EntityType, label: (key: string) => string, limit?: number) {
  return useMemo(() => {
    const counts = new Map<string, number>();
    for (const log of logs) {
      const key = pick(log);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const entries = [...counts.entries()]
      .map(([key, value]) => ({ label: label(key), value }))
      .sort((a, b) => b.value - a.value);
    return limit ? entries.slice(0, limit) : entries;
  }, [logs, pick, label, limit]);
}

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

const RANGE_OPTIONS = [7, 14, 30] as const;

export function DashboardPage() {
  const theme = useTheme();
  const [range, setRange] = useState<number>(14);

  const usersAll = useUsers({ perPage: 1 });
  const usersActive = useUsers({ perPage: 1, isActive: true });
  const settingsQuery = useSettings();
  const auditQuery = useAuditLogs({ perPage: 6, sort: 'createdAt', order: 'desc' });

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (range - 1));
    start.setHours(0, 0, 0, 0);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [range]);

  const analyticsQuery = useAuditLogsRange(startDate, endDate);
  const logs = analyticsQuery.data ?? [];

  const totalUsers = usersAll.data?.meta?.total ?? 0;
  const activeUsers = usersActive.data?.meta?.total ?? 0;
  const inactiveUsers = Math.max(0, totalUsers - activeUsers);
  const settingsCount = Object.keys(settingsQuery.data?.data?.settings ?? {}).length;
  const totalEvents = auditQuery.data?.meta?.total ?? 0;

  const activityItems = (auditQuery.data?.data ?? []).map(toActivityItem);

  const daily = useDailySeries(logs, range, endDate);
  const byAction = useDistribution(logs, (l) => l.action, (k) => ACTION_LABELS[k as AuditAction] ?? k, 6);
  const byEntity = useDistribution(logs, (l) => l.entity, (k) => ENTITY_LABELS[k as EntityType] ?? k);

  const chartsLoading = analyticsQuery.isLoading;

  const handleRangeChange: ToggleButtonGroupProps['onChange'] = (_event, newRange) => {
    if (newRange !== null) setRange(newRange);
  };

  return (
    <DashboardContainer>
      <WelcomeSection>
        <Typography variant="h4" fontWeight={700}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Welcome back! Here's what's happening with your platform.
        </Typography>
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
            value={totalEvents}
            icon={<AssessmentIcon />}
            iconColor="info"
            loading={auditQuery.isLoading}
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
            <ActivityFeed items={activityItems} title="Recent Activity" maxItems={6} />
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
