import { Box, Typography, Paper, Grid, Chip, alpha, useTheme, styled } from '@mui/material';
import {
  CheckCircleOutline,
  ErrorOutline,
  Storage,
  Business,
  People,
  FolderOpen,
  Settings,
  Security,
  BarChart,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useHealth, useWsStatus, useAdminOverview } from '../features/admin/hooks';
import { Loading } from '../components/feedback/Loading';

const PageContainer = Box;

const Card = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  padding: theme.spacing(3),
}));

const StatBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2.5),
  borderRadius: 10,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: alpha(theme.palette.background.paper, 0.5),
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    transform: 'translateY(-1px)',
  },
}));

const QuickActionBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5, 2),
  borderRadius: 8,
  border: `1px solid ${theme.palette.divider}`,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
  },
}));

function SectionTitle({ children }: { children: string }) {
  return (
    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
      {children}
    </Typography>
  );
}

export function AdminPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { data: health, isLoading: healthLoading } = useHealth();
  const { data: wsStatus } = useWsStatus();
  const { organizations, files, users, loading: overviewLoading } = useAdminOverview();

  return (
    <PageContainer sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Admin
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, display: { xs: 'none', sm: 'block' } }}>
          System administration and configuration.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <SectionTitle>System Health</SectionTitle>
            {healthLoading ? (
              <Loading variant="inline" message="Checking system health..." />
            ) : health ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircleOutline sx={{ color: theme.palette.success.main, fontSize: 32 }} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      API Status: {health.status}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {health.environment} environment
                    </Typography>
                  </Box>
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 1.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Uptime
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {Math.floor(health.uptime / 86400)}d
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 1.5,
                        bgcolor: alpha(theme.palette.info.main, 0.04),
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Environment
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{ textTransform: 'capitalize' }}
                      >
                        {health.environment}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 1.5,
                        bgcolor: alpha(theme.palette.success.main, 0.04),
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        WebSocket
                      </Typography>
                      <Chip
                        size="small"
                        label={
                          wsStatus?.connectionCount !== undefined
                            ? `${wsStatus.connectionCount} connected`
                            : 'N/A'
                        }
                        color={wsStatus?.connectionCount ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 1.5,
                        bgcolor: alpha(theme.palette.warning.main, 0.04),
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Message Throughput
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {wsStatus?.messageThroughput ?? 0}/s
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: theme.palette.error.main,
                }}
              >
                <ErrorOutline />
                <Typography>Unable to reach API</Typography>
              </Box>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <SectionTitle>Quick Actions</SectionTitle>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <QuickActionBox onClick={() => navigate('/settings')}>
                <Settings fontSize="small" color="action" />
                <Typography variant="body2" fontWeight={500}>
                  System Settings
                </Typography>
              </QuickActionBox>
              <QuickActionBox onClick={() => navigate('/users')}>
                <People fontSize="small" color="action" />
                <Typography variant="body2" fontWeight={500}>
                  User Management
                </Typography>
              </QuickActionBox>
              <QuickActionBox onClick={() => navigate('/organizations')}>
                <Business fontSize="small" color="action" />
                <Typography variant="body2" fontWeight={500}>
                  Organizations
                </Typography>
              </QuickActionBox>
              <QuickActionBox onClick={() => navigate('/system-logs')}>
                <Security fontSize="small" color="action" />
                <Typography variant="body2" fontWeight={500}>
                  Audit Logs
                </Typography>
              </QuickActionBox>
              <QuickActionBox onClick={() => navigate('/files')}>
                <FolderOpen fontSize="small" color="action" />
                <Typography variant="body2" fontWeight={500}>
                  File Manager
                </Typography>
              </QuickActionBox>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <SectionTitle>System Overview</SectionTitle>
            {overviewLoading ? (
              <Loading variant="inline" message="Loading overview..." />
            ) : (
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <StatBox onClick={() => navigate('/organizations')}>
                    <Business sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        {organizations}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Organizations
                      </Typography>
                    </Box>
                  </StatBox>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <StatBox onClick={() => navigate('/users')}>
                    <People sx={{ fontSize: 32, color: theme.palette.info.main }} />
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        {users}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Users
                      </Typography>
                    </Box>
                  </StatBox>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <StatBox onClick={() => navigate('/settings')}>
                    <Storage sx={{ fontSize: 32, color: theme.palette.warning.main }} />
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        {files}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Files
                      </Typography>
                    </Box>
                  </StatBox>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <StatBox onClick={() => navigate('/system-logs')}>
                    <BarChart sx={{ fontSize: 32, color: theme.palette.success.main }} />
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        {wsStatus?.connectionCount ?? 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        WS Connections
                      </Typography>
                    </Box>
                  </StatBox>
                </Grid>
              </Grid>
            )}
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
}

export default AdminPage;
