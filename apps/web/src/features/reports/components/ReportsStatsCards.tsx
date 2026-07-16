import { Paper, Grid, Typography, styled } from '@mui/material';

const StatCard = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
}));

const StatValue = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 700,
  color: theme.palette.primary.main,
  lineHeight: 1.2,
}));

const StatLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
  marginTop: theme.spacing(0.5),
}));

interface ReportsStatsCardsProps {
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
}

export function ReportsStatsCards({ total, completed, inProgress, failed }: ReportsStatsCardsProps) {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <StatCard>
          <StatValue>{total}</StatValue>
          <StatLabel>Total Reports</StatLabel>
        </StatCard>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <StatCard>
          <StatValue>{completed}</StatValue>
          <StatLabel>Completed</StatLabel>
        </StatCard>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <StatCard>
          <StatValue>{inProgress}</StatValue>
          <StatLabel>In Progress</StatLabel>
        </StatCard>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <StatCard>
          <StatValue>{failed}</StatValue>
          <StatLabel>Failed</StatLabel>
        </StatCard>
      </Grid>
    </Grid>
  );
}

export default ReportsStatsCards;
