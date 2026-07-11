import { Box, Typography, Paper, styled, Grid } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { StatCard } from '../components/data/StatCard';

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

export function AnalyticsPage() {
  return (
    <PageContainer>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Detailed insights and metrics for your platform.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Page Views"
            value="89,432"
            change={18.3}
            changeLabel="vs last week"
            icon={<TrendingUpIcon />}
            iconColor="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Active Users"
            value="3,456"
            change={7.2}
            changeLabel="vs last week"
            icon={<PeopleIcon />}
            iconColor="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Conversions"
            value="1,234"
            change={-2.1}
            changeLabel="vs last week"
            icon={<ShoppingCartIcon />}
            iconColor="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Avg. Order Value"
            value="$67.89"
            change={4.5}
            changeLabel="vs last week"
            icon={<AttachMoneyIcon />}
            iconColor="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Traffic Sources
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Chart will be integrated here
              </Typography>
            </Box>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              User Engagement
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Chart will be integrated here
              </Typography>
            </Box>
          </ChartCard>
        </Grid>
      </Grid>
    </PageContainer>
  );
}

export default AnalyticsPage;
