import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Chip,
  Button,
  useTheme,
} from '@mui/material';
import {
  LineChart,
  PieChart,
  BarChart,
} from '@mui/x-charts';
import {
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Storage as StorageIcon,
  Chat as ChatIcon,
  FilterAlt as FilterAltIcon,
  AssessmentOutlined as ReportIcon,
} from '@mui/icons-material';
import { ChartCard, ChartSkeleton, EmptyChart } from '../components/charts';
import { StatCard } from '../components/data/StatCard';
import { ActivityFeed } from '../components/data/ActivityFeed';
import { useLiveDashboard } from '../features/realtime/useLiveDashboard';
import LiveBadge from '../features/realtime/LiveBadge';
import { DateRangePicker, useDateRange } from '../features/calendar';
import { useFileStats } from '../features/files/hooks';
import { useChatStats } from '../features/chat/hooks';
import { useUserStats } from '../features/users/hooks';
import {
  useDistribution,
  useAuditActivity,
  useDualAuditActivity,
  actionLabelLookup,
  entityLabelLookup,
} from '../features/analytics';
import { toActivityItem } from '../features/analytics';
import type { AuditAction, EntityType } from '@vestara/types';

// ── Helpers ────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ── Page ───────────────────────────────────────────

export function AnalyticsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { range: dateRange, rangeDays, setRange } = useDateRange();

  // ── Drill-down filter state ─────────────────
  const [filteredAction, setFilteredAction] = useState<AuditAction | null>(null);
  const [filteredEntity, setFilteredEntity] = useState<EntityType | null>(null);

  const clearFilters = () => {
    setFilteredAction(null);
    setFilteredEntity(null);
  };

  const hasActiveFilter = filteredAction !== null || filteredEntity !== null;

  // Keep analytics live as org-scoped audit events arrive.
  useLiveDashboard();

  // ── Independent queries ────────────────────────
  const userStatsQuery = useUserStats();
  const fileStatsQuery = useFileStats();
  const chatStatsQuery = useChatStats();

  const { startDate, endDate } = useMemo(
    () => ({ startDate: dateRange.startDate, endDate: dateRange.endDate }),
    [dateRange.startDate, dateRange.endDate],
  );

  // ── Audit analytics ────────────────────────────
  const analytics = useAuditActivity(startDate, endDate, rangeDays);
  const dualSeries = useDualAuditActivity(startDate, endDate, rangeDays);
  const logs = analytics.logs;

  const totalUsers = userStatsQuery.data?.total ?? 0;
  const storageStats = fileStatsQuery.data;
  const chatStats = chatStatsQuery.data;

  // ── Derived chart data ─────────────────────────
  const byAction = useDistribution(logs, (l) => l.action, actionLabelLookup, 6);
  const byEntity = useDistribution(logs, (l) => l.entity, entityLabelLookup);
  const byUser = analytics.byUser;

  const chartsLoading = analytics.loading;
  const userStatsLoading = userStatsQuery.isLoading;
  const storageLoading = fileStatsQuery.isLoading;
  const chatLoading = chatStatsQuery.isLoading;

  // ── Filtered activity feed ─────────────────────
  const filteredLogs = useMemo(() => {
    let result = logs;
    if (filteredAction) {
      result = result.filter((l) => l.action === filteredAction);
    }
    if (filteredEntity) {
      result = result.filter((l) => l.entity === filteredEntity);
    }
    return result.slice(0, 10);
  }, [logs, filteredAction, filteredEntity]);

  const activityItems = useMemo(
    () => filteredLogs.map(toActivityItem),
    [filteredLogs],
  );

  // ── Chart click handlers ──────────────────────
  const handleActionBarClick = (_event: unknown, item: { dataIndex?: number }) => {
    if (item.dataIndex !== undefined && byAction[item.dataIndex]) {
      const label = byAction[item.dataIndex].label;
      // Find the matching AuditAction from the label map
      const actionKey = Object.keys(actionLabelLookup)
        .find((k) => actionLabelLookup(k) === label) as AuditAction | undefined;
      if (actionKey) {
        setFilteredAction((prev) => (prev === actionKey ? null : actionKey));
        setFilteredEntity(null);
      }
    }
  };

  const handleEntityBarClick = (_event: unknown, item: { dataIndex?: number }) => {
    if (item.dataIndex !== undefined && byEntity[item.dataIndex]) {
      const label = byEntity[item.dataIndex].label;
      const entityKey = Object.keys(entityLabelLookup)
        .find((k) => entityLabelLookup(k) === label) as EntityType | undefined;
      if (entityKey) {
        setFilteredEntity((prev) => (prev === entityKey ? null : entityKey));
        setFilteredAction(null);
      }
    }
  };

  // ── Build the active filter chip label ────────
  const filterLabel = useMemo(() => {
    const parts: string[] = [];
    if (filteredAction) parts.push(`Action: ${actionLabelLookup(filteredAction)}`);
    if (filteredEntity) parts.push(`Entity: ${entityLabelLookup(filteredEntity)}`);
    return parts.join(' | ');
  }, [filteredAction, filteredEntity]);

  // ── Render ─────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ── Header ──────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h4" fontWeight={700}>
              Analytics
            </Typography>
            <LiveBadge />
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Period-over-period comparisons, usage breakdowns, and deeper insights.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ReportIcon />}
            onClick={() => navigate('/reports')}
            sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            Export as Report
          </Button>
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setRange} />
        </Box>
      </Box>

      {/* ── Active filter indicator ─────────── */}
      {hasActiveFilter && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterAltIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Chip
            label={filterLabel}
            color="primary"
            size="small"
            onDelete={clearFilters}
          />
          <Typography variant="caption" color="text.secondary">
            {filteredLogs.length} matching events shown in feed below
          </Typography>
        </Box>
      )}

      {/* ── Summary Stats Row ────────────────── */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Total Users"
            value={totalUsers}
            icon={<PeopleIcon />}
            iconColor="primary"
            loading={userStatsLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Audit Events"
            value={analytics.total}
            icon={<AssessmentIcon />}
            iconColor="info"
            loading={chartsLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Storage Used"
            value={storageStats ? formatBytes(storageStats.totalSize) : '—'}
            icon={<StorageIcon />}
            iconColor="warning"
            loading={storageLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="AI Conversations"
            value={chatStats?.totalConversations ?? 0}
            icon={<ChatIcon />}
            iconColor="secondary"
            loading={chatLoading}
          />
        </Grid>
      </Grid>

      {/* ── Audit Activity (dual period overlay) + User Status ── */}
      <Grid container spacing={3}>
        {/* Dual time-series line chart — current vs previous period */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <ChartCard
            title="Audit Activity: Period Comparison"
            subtitle="Click a day to filter the activity feed — Current vs. Previous period"
            action={
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Last {rangeDays} {rangeDays === 1 ? 'day' : 'days'}
              </Typography>
            }
          >
            {dualSeries.loading ? (
              <ChartSkeleton height={320} />
            ) : (
              <LineChart
                height={320}
                series={[
                  {
                    data: dualSeries.current.values,
                    label: 'Current period',
                    area: true,
                    color: theme.palette.primary.main,
                  },
                  {
                    data: dualSeries.previous.values,
                    label: 'Previous period',
                    showMark: false,
                    color: theme.palette.grey[400],
                  },
                ]}
                xAxis={[{ scaleType: 'band', data: dualSeries.current.labels }]}
                yAxis={[{ min: 0 }]}
                margin={{ top: 32, right: 16, bottom: 28, left: 36 }}
                slotProps={{ legend: { position: { vertical: 'top', horizontal: 'start' } } }}
              />
            )}
          </ChartCard>
        </Grid>

        {/* User Status pie chart */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <ChartCard title="User Status" subtitle="Active vs. inactive accounts">
            {userStatsLoading ? (
              <ChartSkeleton height={280} />
            ) : (
              <PieChart
                height={300}
                series={[
                  {
                    data: [
                      { id: 'active', value: userStatsQuery.data?.active ?? 0, label: 'Active', color: theme.palette.success.main },
                      { id: 'inactive', value: userStatsQuery.data?.inactive ?? 0, label: 'Inactive', color: theme.palette.grey[400] },
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

      {/* ── Top Users + Activity by Action ──────── */}
      <Grid container spacing={3}>
        {/* Top users by activity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Top Users by Activity" subtitle="Most active users in this period">
            {chartsLoading ? (
              <ChartSkeleton height={280} />
            ) : byUser.length === 0 ? (
              <EmptyChart height={300} />
            ) : (
              <BarChart
                layout="horizontal"
                height={300}
                series={[{ data: byUser.map((e) => e.value), color: theme.palette.info.main }]}
                yAxis={[{ scaleType: 'band', data: byUser.map((e) => e.label) }]}
                xAxis={[{ min: 0 }]}
                margin={{ top: 8, right: 24, bottom: 24, left: 100 }}
              />
            )}
          </ChartCard>
        </Grid>

        {/* Activity by action — click to filter feed */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard
            title="Activity by Action"
            subtitle={filteredAction ? `Filtered: ${actionLabelLookup(filteredAction)} — click another bar or clear` : 'Click a bar to filter the activity feed'}
          >
            {chartsLoading ? (
              <ChartSkeleton height={280} />
            ) : byAction.length === 0 ? (
              <EmptyChart height={300} />
            ) : (
              <BarChart
                layout="horizontal"
                height={300}
                series={[
                  {
                    data: byAction.map((e) => e.value),
                    color: theme.palette.primary.main,
                    highlightScope: { highlight: 'item', fade: 'global' },
                  },
                ]}
                yAxis={[{ scaleType: 'band', data: byAction.map((e) => e.label) }]}
                xAxis={[{ min: 0 }]}
                margin={{ top: 8, right: 24, bottom: 24, left: 120 }}
                onItemClick={handleActionBarClick}
              />
            )}
          </ChartCard>
        </Grid>
      </Grid>

      {/* ── Entity / Storage / AI Usage ─────────── */}
      <Grid container spacing={3}>
        {/* Activity by entity — click to filter feed */}
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard
            title="Activity by Entity"
            subtitle={filteredEntity ? `Filtered: ${entityLabelLookup(filteredEntity)}` : 'Click a bar to filter'}
          >
            {chartsLoading ? (
              <ChartSkeleton height={240} />
            ) : byEntity.length === 0 ? (
              <EmptyChart height={260} />
            ) : (
              <BarChart
                layout="horizontal"
                height={260}
                series={[
                  {
                    data: byEntity.map((e) => e.value),
                    color: theme.palette.secondary.main,
                    highlightScope: { highlight: 'item', fade: 'global' },
                  },
                ]}
                yAxis={[{ scaleType: 'band', data: byEntity.map((e) => e.label) }]}
                xAxis={[{ min: 0 }]}
                margin={{ top: 8, right: 24, bottom: 24, left: 100 }}
                onItemClick={handleEntityBarClick}
              />
            )}
          </ChartCard>
        </Grid>

        {/* File storage stats */}
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard title="File Storage" subtitle="Breakdown by file type">
            {storageLoading ? (
              <ChartSkeleton height={260} />
            ) : storageStats ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, py: 1 }}>
                <StatCard
                  title="Total Files"
                  value={storageStats.totalFiles}
                  icon={<StorageIcon />}
                  iconColor="warning"
                  loading={false}
                  sx={{ '& .MuiCardContent-root': { p: 2 } }}
                />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {Object.entries(storageStats.byMimeType ?? {}).slice(0, 5).map(([mime, count]) => (
                    <Box
                      key={mime}
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: 'action.hover',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'text.secondary',
                      }}
                    >
                      {mime.split('/').pop()}: {count}
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <EmptyChart height={260} message="No file data available" />
            )}
          </ChartCard>
        </Grid>

        {/* AI Usage stats */}
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard title="AI Assistant Usage" subtitle="Chat and conversation metrics">
            {chatLoading ? (
              <ChartSkeleton height={260} />
            ) : chatStats ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Conversations
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {chatStats.totalConversations ?? 0}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Messages
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {chatStats.totalMessages ?? 0}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Active
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {chatStats.activeConversations ?? 0}
                    </Typography>
                  </Box>
                </Box>
                {/* Mini bar showing ratio of active vs total */}
                {(chatStats.totalConversations ?? 0) > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Active / Total Conversations
                    </Typography>
                    <Box
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'action.hover',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${((chatStats.activeConversations ?? 0) / Math.max(chatStats.totalConversations ?? 1, 1)) * 100}%`,
                          borderRadius: 4,
                          bgcolor: theme.palette.secondary.main,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            ) : (
              <EmptyChart height={260} message="No AI usage data available" />
            )}
          </ChartCard>
        </Grid>
      </Grid>

      {/* ── Recent Activity Feed ────────────────── */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <ChartCard sx={{ p: 0, overflow: 'hidden' }}>
            <ActivityFeed
              items={activityItems}
              title={hasActiveFilter ? `Filtered Activity (${activityItems.length})` : 'Recent Activity'}
              maxItems={10}
            />
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AnalyticsPage;
