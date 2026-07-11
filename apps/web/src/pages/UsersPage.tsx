import { Box, Typography, Paper, styled } from '@mui/material';
import { People as PeopleIcon } from '@mui/icons-material';
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

export function UsersPage() {
  return (
    <PageContainer>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Users
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage user accounts and permissions.
        </Typography>
      </Box>

      <ContentCard>
        <EmptyState
          icon={<PeopleIcon sx={{ fontSize: 48 }} />}
          title="User Management"
          description="Full user management features coming soon. You'll be able to create, edit, and manage user accounts here."
        />
      </ContentCard>
    </PageContainer>
  );
}

export default UsersPage;
