import { Box, Typography, Grid, Paper, styled } from '@mui/material';
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { StatCard } from '../components/data/StatCard';
import { ActivityFeed } from '../components/data/ActivityFeed';
import type { ActivityItem } from '../components/data/ActivityFeed';

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
  padding: theme.spacing(3),
  height: '100%',
}));

const mockActivityItems: ActivityItem[] = [
  {
    id: '1',
    user: { name: 'Sarah Chen', initials: 'SC' },
    action: 'created a new user account',
    target: 'john.doe@example.com',
    timestamp: '2 minutes ago',
    iconColor: 'success',
  },
  {
    id: '2',
    user: { name: 'Mike Johnson', initials: 'MJ' },
    action: 'updated system setting',
    target: 'Email Configuration',
    timestamp: '15 minutes ago',
    iconColor: 'warning',
  },
  {
    id: '3',
    user: { name: 'Emily Rodriguez', initials: 'ER' },
    action: 'exported report',
    target: 'Q4 Sales Report',
    timestamp: '1 hour ago',
    iconColor: 'info',
  },
  {
    id: '4',
    user: { name: 'David Kim', initials: 'DK' },
    action: 'deleted user account',
    target: 'old.admin@example.com',
    timestamp: '2 hours ago',
    iconColor: 'error',
  },
  {
    id: '5',
    user: { name: 'Lisa Wang', initials: 'LW' },
    action: 'uploaded file',
    target: 'brand-guidelines.pdf',
    timestamp: '3 hours ago',
    iconColor: 'primary',
  },
];

export function DashboardPage() {
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
            value="12,345"
            change={12.5}
            changeLabel="vs last month"
            icon={<PeopleIcon />}
            iconColor="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Revenue"
            value="$45,678"
            change={8.2}
            changeLabel="vs last month"
            icon={<AttachMoneyIcon />}
            iconColor="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Orders"
            value="1,892"
            change={-3.1}
            changeLabel="vs last month"
            icon={<ShoppingCartIcon />}
            iconColor="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Growth"
            value="24.8%"
            change={5.4}
            changeLabel="vs last month"
            icon={<TrendingUpIcon />}
            iconColor="info"
          />
        </Grid>
      </StatsGrid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ChartCard>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Revenue Overview
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Chart will be integrated here
              </Typography>
            </Box>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <ChartCard sx={{ p: 0, overflow: 'hidden' }}>
            <ActivityFeed items={mockActivityItems} title="Recent Activity" maxItems={5} />
          </ChartCard>
        </Grid>
      </Grid>
    </DashboardContainer>
  );
}

export default DashboardPage;
