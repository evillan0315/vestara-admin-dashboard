import { Box, Typography, Paper, styled } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
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

export function SettingsPage() {
  return (
    <PageContainer>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Configure your platform preferences and system settings.
        </Typography>
      </Box>

      <ContentCard>
        <EmptyState
          icon={<SettingsIcon sx={{ fontSize: 48 }} />}
          title="Application Settings"
          description="Settings management coming soon. You'll be able to configure theme, notifications, and system preferences here."
        />
      </ContentCard>
    </PageContainer>
  );
}

export default SettingsPage;
