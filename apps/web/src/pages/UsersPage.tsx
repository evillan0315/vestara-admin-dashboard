import { Box, Typography, Button, styled } from '@mui/material';
import { Add as AddIcon, Download as DownloadIcon } from '@mui/icons-material';
import { useMemo, type ReactElement } from 'react';
import { DataTable } from '../components/data/DataTable';
import { useUsersPage } from '../features/users/hooks/useUsersPage';
import { createUsersColumns } from '../features/users/components/UsersTableColumns';
import { DateRangePicker } from '../features/users/components/DateRangePicker';
import { UsersFilterBar } from '../features/users/components/UsersFilterBar';
import { UsersBulkBar } from '../features/users/components/UsersBulkBar';
import { UsersDialogs } from '../features/users/components/UsersDialogs';

const PageContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}));

export function UsersPage(): ReactElement {
  const ctx = useUsersPage();

  const columns = useMemo(
    () =>
      createUsersColumns({
        orgMap: ctx.orgMap,
        onEdit: ctx.handleEdit,
        onToggleStatus: ctx.handleToggleStatus,
        onDeleteRequest: ctx.setDeleteTarget,
      }),
    [ctx.orgMap, ctx.handleEdit, ctx.handleToggleStatus, ctx.setDeleteTarget],
  );

  return (
    <PageContainer>
      {/* Row 1 — Header with title + date range */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Users
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage user accounts and permissions.
          </Typography>
        </Box>
        <DateRangePicker dateRange={ctx.dateRange} onDateRangeChange={ctx.handleDateRangeChange} />
      </Box>

      {/* Row 2 — Summary stat line */}
      {ctx.userStats && (
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Typography component="span" variant="body2" fontWeight={600} color="text.primary">
            {ctx.userStats.total}
          </Typography>
          total
          <Typography component="span" sx={{ mx: 0.75, color: 'text.disabled' }}>·</Typography>
          <Typography component="span" variant="body2" fontWeight={600} color="success.main">
            {ctx.userStats.active}
          </Typography>
          active
          <Typography component="span" sx={{ mx: 0.75, color: 'text.disabled' }}>·</Typography>
          <Typography component="span" variant="body2" fontWeight={600} color="text.secondary">
            {ctx.userStats.inactive}
          </Typography>
          inactive
        </Typography>
      )}

      {/* Row 3 — Filter bar */}
      <UsersFilterBar
        searchTerm={ctx.searchTerm}
        onSearchChange={ctx.handleSearchChange}
        onSearchClear={ctx.handleSearchClear}
        roleFilter={ctx.roleFilter}
        onRoleFilterChange={ctx.handleRoleFilterChange}
        statusFilter={ctx.statusFilter}
        onStatusFilterChange={ctx.handleStatusFilterChange}
        onClearFilters={ctx.handleClearFilters}
        hasActiveFilters={ctx.hasActiveFilters}
      />

      {/* Row 4 — Bulk action bar */}
      <UsersBulkBar
        selectedCount={ctx.selectedIds.length}
        onActivate={() => ctx.handleBulkClick('activate')}
        onDeactivate={() => ctx.handleBulkClick('deactivate')}
        onDelete={() => ctx.handleBulkClick('delete')}
      />

      {/* Row 5 — DataTable */}
      <DataTable
        columns={columns}
        rows={ctx.users}
        keyExtractor={(row) => row.id}
        loading={ctx.isLoading}
        error={ctx.isError ? (ctx.error instanceof Error ? ctx.error.message : 'Failed to load users') : null}
        onRetry={() => ctx.refetch()}
        sortState={ctx.sort}
        onSortChange={ctx.handleSortChange}
        selectable
        selectedIds={ctx.selectedIds}
        onSelectionChange={ctx.setSelectedIds}
        pagination={ctx.paginationState}
        onPageChange={ctx.handlePageChange}
        onPerPageChange={ctx.setPerPage}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={ctx.handleExport}
              disabled={ctx.exporting || ctx.isLoading}
            >
              Export
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={ctx.handleCreate}
            >
              Add User
            </Button>
          </Box>
        }
      />

      {/* Dialogs */}
      <UsersDialogs
        dialogOpen={ctx.dialogOpen}
        editUser={ctx.editUser}
        onDialogClose={ctx.handleDialogClose}
        onSubmit={ctx.handleDialogSubmit}
        dialogLoading={ctx.createMutation.isPending || ctx.updateMutation.isPending}
        organizations={ctx.organizations}
        currentUserRole={ctx.user?.role}
        deleteTarget={ctx.deleteTarget}
        onDeleteConfirm={ctx.handleDelete}
        onDeleteClose={() => ctx.setDeleteTarget(null)}
        deleteLoading={ctx.deleteMutation.isPending}
        bulkConfirmOpen={ctx.bulkConfirmOpen}
        bulkAction={ctx.bulkAction}
        selectedIds={ctx.selectedIds}
        onBulkConfirm={ctx.handleBulkConfirm}
        onBulkClose={ctx.handleBulkClose}
        bulkLoading={ctx.bulkDeleteMutation.isPending || ctx.bulkStatusMutation.isPending}
      />
    </PageContainer>
  );
}
