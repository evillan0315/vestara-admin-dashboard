import { Box, Typography, Button, Select, MenuItem, FormControl, TextField, InputAdornment, IconButton, styled, useTheme } from '@mui/material';
import { Add as AddIcon, Download as DownloadIcon, Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useMemo, type ReactElement } from 'react';
import { DataTable } from '../components/data/DataTable';
import { useUsersPage } from '../features/users/hooks/useUsersPage';
import { createUsersColumns } from '../features/users/components/UsersTableColumns';
import { UsersBulkBar } from '../features/users/components/UsersBulkBar';
import { UsersDialogs } from '../features/users/components/UsersDialogs';
import type { UserRole } from '@vestara/types';
import { UserRole as UserRoleEnum } from '@vestara/types';

const PageContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}));

const ROLE_OPTIONS: { value: UserRole | ''; label: string }[] = [
  { value: '', label: 'All Roles' },
  { value: UserRoleEnum.SUPER_ADMIN, label: 'Super Admin' },
  { value: UserRoleEnum.ADMIN, label: 'Admin' },
  { value: UserRoleEnum.MODERATOR, label: 'Moderator' },
  { value: UserRoleEnum.SUPPORT, label: 'Support' },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export function UsersPage(): ReactElement {
  const theme = useTheme();
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

  const filterControls = (
    <>
      <TextField
        placeholder="Search by name or email"
        value={ctx.searchTerm}
        onChange={ctx.handleSearchChange}
        size="small"
        sx={{ minWidth: 200 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="inherit" sx={{ fontSize: 20, color: 'text.secondary' }} />
            </InputAdornment>
          ),
          endAdornment: ctx.searchTerm ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={ctx.handleSearchClear}>
                <ClearIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />
      <FormControl size="small" sx={{ minWidth: 130 }}>
        <Select
          value={ctx.roleFilter === '' ? '' : ctx.roleFilter}
          onChange={(e) => ctx.handleRoleFilterChange(e.target.value)}
          displayEmpty
          renderValue={(v) => {
            const option = ROLE_OPTIONS.find((o) => o.value === v);
            return option?.label || 'All Roles';
          }}
          sx={{ borderRadius: '8px', fontSize: '0.8125rem' }}
        >
          {ROLE_OPTIONS.map((option) => (
            <MenuItem key={String(option.value)} value={option.value} sx={{ fontSize: '0.8125rem' }}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 130 }}>
        <Select
          value={ctx.statusFilter === '' ? '' : String(ctx.statusFilter)}
          onChange={(e) => ctx.handleStatusFilterChange(e.target.value)}
          displayEmpty
          renderValue={(v) => {
            if (v === 'true') return 'Active';
            if (v === 'false') return 'Inactive';
            return 'All Statuses';
          }}
          sx={{ borderRadius: '8px', fontSize: '0.8125rem' }}
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.8125rem' }}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {ctx.hasActiveFilters && (
        <Button
          size="small"
          startIcon={<ClearIcon />}
          onClick={ctx.handleClearFilters}
          sx={{
            color: theme.palette.text.secondary,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.75rem',
            minWidth: 'auto',
          }}
        >
          Clear
        </Button>
      )}
    </>
  );

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

      <UsersBulkBar
        selectedCount={ctx.selectedIds.length}
        onActivate={() => ctx.handleBulkClick('activate')}
        onDeactivate={() => ctx.handleBulkClick('deactivate')}
        onDelete={() => ctx.handleBulkClick('delete')}
      />

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
        filters={filterControls}
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

export default UsersPage;
