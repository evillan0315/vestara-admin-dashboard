import { Box, Paper, Typography, Grid, Chip, styled, alpha } from '@mui/material';
import { Assessment as AssessmentIcon } from '@mui/icons-material';
import { useReportStats, useReports } from '../hooks';

const WidgetCard = styled(Paper)(({ theme }) => ({
  borderRadius: 16,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  padding: theme.spacing(2.5),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  transition: 'border-color 0.2s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
  },
}));

const StatBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 1.5),
  borderRadius: 10,
  backgroundColor: alpha(theme.palette.primary.main, 0.04),
}));

export function ReportsDashboardWidget() {
  const { data: statsData } = useReportStats();
  const { data: reportsData } = useReports({ page: 1, perPage: 5 });

  type ApiResponse<T> = { data?: T };
  const stats = (statsData as ApiResponse<{ total: number; completed: number; generating: number; failed: number }> | undefined)?.data;
  const recentReports = ((reportsData as ApiResponse<unknown[]> | undefined)?.data ?? []).slice(0, 5);

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'generating':
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  return (
    <WidgetCard>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={700}>
            Reports Overview
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={1}>
        <Grid size={6}>
          <StatBox>
            <Typography variant="caption" color="text.secondary">Total</Typography>
            <Typography variant="body2" fontWeight={700}>{stats?.total ?? '—'}</Typography>
          </StatBox>
        </Grid>
        <Grid size={6}>
          <StatBox>
            <Typography variant="caption" color="text.secondary">Completed</Typography>
            <Typography variant="body2" fontWeight={700} color="success.main">{stats?.completed ?? '—'}</Typography>
          </StatBox>
        </Grid>
        <Grid size={6}>
          <StatBox>
            <Typography variant="caption" color="text.secondary">In Progress</Typography>
            <Typography variant="body2" fontWeight={700} color="warning.main">{stats?.generating ?? '—'}</Typography>
          </StatBox>
        </Grid>
        <Grid size={6}>
          <StatBox>
            <Typography variant="caption" color="text.secondary">Failed</Typography>
            <Typography variant="body2" fontWeight={700} color="error.main">{stats?.failed ?? '—'}</Typography>
          </StatBox>
        </Grid>
      </Grid>

      {recentReports.length > 0 && (
        <Box>
          <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Recent Reports
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {recentReports.map((report: unknown) => {
              const r = report as { id: string; name: string; status: string; format: string };
              return (
                <Box
                  key={r.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 0.5,
                    px: 1,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Typography variant="caption" noWrap sx={{ maxWidth: 140 }}>
                    {r.name || 'Unnamed'}
                  </Typography>
                  <Chip
                    label={r.status}
                    color={statusColor(r.status) as 'success' | 'error' | 'warning' | 'default'}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: 10 }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </WidgetCard>
  );
}

export default ReportsDashboardWidget;
