import { Box, Typography, Paper, styled } from '@mui/material';
import { AdminPanelSettings as AdminIcon } from '@mui/icons-material';
import { EmptyState } from '../components/feedback/EmptyState';

const PageContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}));

const ContentCard = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  padding: theme.spacing(3),
}));

export function AdminPage() {
  return (
    <PageContainer>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Admin
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          System administration and configuration.
        </Typography>
      </Box>

      <ContentCard>
        <EmptyState
          icon={<AdminIcon sx={{ fontSize: 48 }} />}
          title="Administration"
          description="Admin features coming soon. You'll be able to manage system settings, roles, and permissions here."
        />
      </ContentCard>
    </PageContainer>
  );
}

export default AdminPage;
