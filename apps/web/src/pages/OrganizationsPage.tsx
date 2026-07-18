import { Box, Button, Typography, styled } from '@mui/material';
import { Add as AddIcon, Business as BusinessIcon } from '@mui/icons-material';
import { useMemo, type ReactElement } from 'react';
import { DataTable } from '../components/data/DataTable';
import { useOrganizationsPage } from '../features/organizations/hooks/useOrganizationsPage';
import { createOrganizationsColumns } from '../features/organizations/components/OrganizationsTableColumns';
import { OrganizationsDialog } from '../features/organizations/components/OrganizationsDialog';
import type { OrganizationDTO } from '@vestara/types';

const PageContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}));

export function OrganizationsPage(): ReactElement {
  const ctx = useOrganizationsPage();

  const columns = useMemo(
    () => createOrganizationsColumns({ onEdit: ctx.handleEdit }),
    [ctx.handleEdit],
  );

  return (
    <PageContainer>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Organizations
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, display: { xs: 'none', sm: 'block' } }}>
            Manage organizations and their settings.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={ctx.handleCreate}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Add Organization
        </Button>
      </Box>

      <DataTable<OrganizationDTO>
        columns={columns}
        rows={ctx.displayedOrgs}
        keyExtractor={(row) => row.id}
        loading={ctx.isLoading}
        error={
          ctx.isError
            ? ctx.error instanceof Error
              ? ctx.error.message
              : 'Failed to load organizations'
            : null
        }
        onRetry={() => ctx.refetch()}
        sortState={ctx.sort}
        onSortChange={ctx.handleSortChange}
        searchable
        searchValue={ctx.search}
        onSearchChange={ctx.handleSearchChange}
        searchPlaceholder="Search organizations by name or slug..."
        title="All Organizations"
        emptyIcon={<BusinessIcon sx={{ fontSize: 48 }} />}
        emptyTitle="No organizations found"
        emptyDescription="No organizations match your search criteria."
      />

      <OrganizationsDialog
        open={ctx.dialogOpen}
        editingOrg={ctx.editingOrg}
        formData={ctx.formData}
        uploadingLogo={ctx.uploadingLogo}
        loading={ctx.createMutation.isPending || ctx.updateMutation.isPending}
        onClose={ctx.handleDialogClose}
        onFormChange={ctx.handleFormChange}
        onLogoUpload={ctx.handleLogoUpload}
        onSubmit={ctx.handleSubmit}
      />
    </PageContainer>
  );
}

export default OrganizationsPage;
