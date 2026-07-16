import { Box, Typography, Button, Chip, IconButton, styled, Avatar, Tooltip, TextField, alpha, InputAdornment } from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  Business as BusinessIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { Calendar as CalendarIcon, ChevronDown as ChevronDownIcon } from 'lucide-react';
import { useState, useCallback, type ReactElement } from 'react';
import { DataTable, type Column, type SortState, type PaginationState } from '../components/data/DataTable';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useToggleUserStatus,
  useBulkDeleteUsers,
  useBulkUpdateUserStatus,
} from '../features/users/hooks';
import { useOrganizations } from '../features/organizations/hooks';
import { exportUsersCsv } from '../features/users/exportUsers';
import { UserFormDialog } from '../features/users/UserFormDialog';
import { useToast } from '../components/feedback/Toast';
import { ConfirmDialog } from '../components/ui/Modal';
import { useAuth } from '../features/auth/AuthContext';
import type { UserDTO, UserRole } from '@vestara/types';
import { UsersFilterChips } from '../features/users/UsersFilterChips';
import CalendarDatePicker from '../features/calendar/CalendarDatePicker';
import { Popover } from '@mui/material';

// Helper to compute default date range (last 14 days)
function getDefaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 13); // 14 days inclusive
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

// ── Styled ——

const PageContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}));

const RoleChip = styled(Chip)<{ role: string }>(({ theme, role }) => {
  const colors: Record<string, string> = {
    super_admin: theme.palette.error.main,
    admin: theme.palette.warning.main,
    moderator: theme.palette.info.main,
    support: theme.palette.success.main,
  };
  return {
    backgroundColor: colors[role] || theme.palette.grey[500],
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  };
});

// ── Component ——

export function UsersPage(): ReactElement {
  const { showSuccess, showError } = useToast();

  // Sort & pagination state
  const [sort, setSort] = useState<SortState>({ field: 'createdAt', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Filter state
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<boolean | ''>('');

  // Date range state (always a valid range, defaults to last 14 days)
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>(getDefaultDateRange());
  const [dateRangeAnchorEl, setDateRangeAnchorEl] = useState<HTMLElement | null>(null);
  const dateRangeOpen = Boolean(dateRangeAnchorEl);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserDTO | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<UserDTO | null>(null);

  // Bulk action state
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'delete' | 'activate' | 'deactivate' | null>(null);
  const [exporting, setExporting] = useState(false);

  // Queries & mutations
  const { data, isLoading, isError, error, refetch } = useUsers({
    page,
    perPage,
    search: searchTerm || undefined,
    sort: sort.field,
    order: sort.direction,
    role: roleFilter || undefined,
    isActive: statusFilter !== '' ? statusFilter : undefined,
    createdAtStart: dateRange.startDate,
    createdAtEnd: dateRange.endDate,
  });

  const { data: organizations = [] } = useOrganizations();
  const { user } = useAuth();

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const toggleStatusMutation = useToggleUserStatus();
  const bulkDeleteMutation = useBulkDeleteUsers();
  const bulkStatusMutation = useBulkUpdateUserStatus();

  const users = data?.data ?? [];
  const paginationMeta = data?.meta;
  const paginationState: PaginationState | undefined = paginationMeta
    ? {
        page: paginationMeta.page,
        perPage: paginationMeta.perPage,
        total: paginationMeta.total,
      }
    : undefined;

  // Handlers
  const handleSortChange = useCallback((newSort: SortState) => {
    setSort(newSort);
    setPage(1);
    setSelectedIds([]);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
    setSelectedIds([]);
  }, []);

  const handleRoleFilterChange = useCallback((role: UserRole | '') => {
    setRoleFilter(role);
    setPage(1);
    setSelectedIds([]);
  }, []);

  const handleStatusFilterChange = useCallback((status: boolean | '') => {
    setStatusFilter(status);
    setPage(1);
    setSelectedIds([]);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
    setDateRange(getDefaultDateRange()); // Reset to default range
    setPage(1);
    setSelectedIds([]);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    setSelectedIds([]);
  }, []);

  const handleDateRangeOpen = (e: React.MouseEvent<HTMLElement>) => {
    setDateRangeAnchorEl(e.currentTarget);
  };

  const handleDateRangeClose = () => {
    setDateRangeAnchorEl(null);
  };

  const handleDateRangeChange = (newRange: { startDate: string; endDate: string }) => {
    setDateRange(newRange);
    setPage(1);
    setSelectedIds([]);
  };

  const handleCreate = useCallback(() => {
    setEditUser(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((user: UserDTO) => {
    setEditUser(user);
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setEditUser(null);
  }, []);

  const handleDialogSubmit = useCallback(
    async (data: { firstName: string; lastName: string; email: string; password?: string; role: UserRole; organizationId?: string }) => {
      try {
        if (editUser) {
          await updateMutation.mutateAsync({
            id: editUser.id,
            data: {
              firstName: data.firstName,
              lastName: data.lastName,
              role: data.role,
              organizationId: data.organizationId,
            },
          });
          showSuccess('User updated successfully');
        } else {
          await createMutation.mutateAsync(data as Parameters<typeof createMutation.mutateAsync>[0]);
          showSuccess('User created successfully');
        }
        handleDialogClose();
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Operation failed');
      }
    },
    [editUser, createMutation, updateMutation, showSuccess, showError, handleDialogClose],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showSuccess('User deleted successfully');
      setDeleteTarget(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Delete failed');
    }
  }, [deleteTarget, deleteMutation, showSuccess, showError]);

  const handleToggleStatus = useCallback(
    async (user: UserDTO) => {
      try {
        await toggleStatusMutation.mutateAsync(user.id);
        showSuccess(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Status change failed');
      }
    },
    [toggleStatusMutation, showSuccess, showError],
  );

  // Bulk actions
  const handleBulkConfirm = useCallback(async () => {
    if (!bulkAction || selectedIds.length === 0) return;
    try {
      if (bulkAction === 'delete') {
        await bulkDeleteMutation.mutateAsync(selectedIds);
        showSuccess(`Deleted ${selectedIds.length} user${selectedIds.length === 1 ? '' : 's'}`);
      } else {
        await bulkStatusMutation.mutateAsync({
          ids: selectedIds,
          status: bulkAction === 'activate' ? 'active' : 'inactive',
        });
        showSuccess(
          `${bulkAction === 'activate' ? 'Activated' : 'Deactivated'} ${
            selectedIds.length
          } user${selectedIds.length === 1 ? '' : 's'}`,
        );
      }
      setSelectedIds([]);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Bulk action failed');
    } finally {
      setBulkConfirmOpen(false);
      setBulkAction(null);
    }
  }, [bulkAction, selectedIds, bulkDeleteMutation, bulkStatusMutation, showSuccess, showError]);

  // CSV export
  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      await exportUsersCsv({ sort: sort.field, order: sort.direction });
      showSuccess('User export downloaded');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [sort, showSuccess, showError]);

  // Date range picker component (inline)
  const DateRangePicker = () => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return `${date.toLocaleDateString('en-US', { month: 'short' })} ${date.getDate()}, ${date.getFullYear()}`;
    };

    const label = `${formatDate(dateRange.startDate)} – ${formatDate(dateRange.endDate)}`;

    return (
      <>
        <Button
          disableElevation
          onClick={handleDateRangeOpen}
          startIcon={<CalendarIcon size={16} />}
          endIcon={<ChevronDownIcon size={16} />}
          sx={{
            height: 40,
            px: 1.75,
            borderRadius: '10px',
            textTransform: 'none',
            fontSize: 12.5,
            fontWeight: 600,
            color: 'text.primary',
            bgcolor: 'background.paper',
            border: '1px solid divider',
            whiteSpace: 'nowrap',
            transition: 'all .2s ease',
            '&:hover': {
              bgcolor: alpha('primary.main', 0.08),
              borderColor: 'primary.main',
            },
            '&:active': {
              transform: 'scale(.98)',
            },
          }}
          aria-haspopup="dialog"
          aria-expanded={dateRangeOpen}
        >
          {label}
        </Button>

        <Popover
          open={dateRangeOpen}
          anchorEl={dateRangeAnchorEl}
          onClose={handleDateRangeClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: 1 }}
        >
          <Box sx={{ p: 0.5, minWidth: 280 }}>
            <CalendarDatePicker
              value={dateRange}
              onChange={handleDateRangeChange}
            />
          </Box>
        </Popover>
      </>
    );
  };

  // Columns
  const columns: Column<UserDTO>[] = [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      render: (_value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={row.avatarUrl}
            sx={{ width: 32, height: 32, fontSize: '0.8125rem', fontWeight: 600 }}
          >
            {`${row.firstName.charAt(0)}${row.lastName.charAt(0)}`}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {row.firstName} {row.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'role',
      label: 'Role',
      width: 140,
      sortable: true,
      render: (_value, row) => (
        <RoleChip
          role={row.role}
          label={row.role.replace('_', ' ')}
          size="small"
        />
      ),
    },
    {
      id: 'isActive',
      label: 'Status',
      width: 100,
      sortable: true,
      render: (_value, row) => (
        <Chip
          icon={row.isActive ? <CheckCircleIcon /> : <BlockIcon />}
          label={row.isActive ? 'Active' : 'Inactive'}
          color={row.isActive ? 'success' : 'default'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      id: 'organization',
      label: 'Organization',
      width: 180,
      sortable: true,
      render: (_value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {row.organizationId ? row.organizationId.slice(0, 8) + '...' : '—'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'lastLoginAt',
      label: 'Last Login',
      width: 140,
      sortable: true,
      render: (value) => {
        const date = new Date(value as string);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      },
    },
    {
      id: 'createdAt',
      label: 'Created',
      width: 140,
      sortable: true,
      render: (value) => {
        const date = new Date(value as string);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      },
    },
    {
      id: 'actions',
      label: '',
      width: 120,
      render: (_value, row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit user">
            <IconButton size="small" onClick={() => handleEdit(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.isActive ? 'Deactivate user' : 'Activate user'}>
            <IconButton size="small" onClick={() => handleToggleStatus(row)}>
              {row.isActive ? (
                <BlockIcon fontSize="small" color="warning" />
              ) : (
                <CheckCircleIcon fontSize="small" color="success" />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete user">
            <IconButton size="small" onClick={() => setDeleteTarget(row)}>
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

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

      {/* Toolbar with search, date range, and actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Search"
            placeholder="Search by name, email"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ width: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="inherit" sx={{ fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
          <DateRangePicker />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={exporting || isLoading}
          >
            Export
          </Button>
          <Box sx={{ ml: 2 }}>
            <UsersFilterChips
              roleFilter={roleFilter}
              statusFilter={statusFilter}
              onRoleFilterChange={handleRoleFilterChange}
              onStatusFilterChange={handleStatusFilterChange}
              onClearFilters={handleClearFilters}
              hasActiveFilters={!!roleFilter || statusFilter !== ''}
            />
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Add User
          </Button>
        </Box>
      </Box>

      <DataTable<UserDTO>
        columns={columns}
        rows={users}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        error={isError ? (error instanceof Error ? error.message : 'Failed to load users') : null}
        onRetry={() => refetch()}
        sortState={sort}
        onSortChange={handleSortChange}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        pagination={paginationState}
        onPageChange={handlePageChange}
        onPerPageChange={setPerPage}
      />

      {/* Create / Edit Dialog */}
      <UserFormDialog
        open={dialogOpen}
        user={editUser}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
        organizations={organizations}
        currentUserRole={user?.role}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.firstName} ${deleteTarget.lastName}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />

      {/* Bulk action confirmation */}
      <ConfirmDialog
        open={bulkConfirmOpen}
        title={
          bulkAction === 'delete'
            ? 'Delete Users'
            : bulkAction === 'activate'
              ? 'Activate Users'
              : 'Deactivate Users'
        }
        message={
          bulkAction === 'delete'
            ? `Are you sure you want to delete ${selectedIds.length} selected user${selectedIds.length === 1 ? '' : 's'}? This action cannot be undone.`
            : `Are you sure you want to ${
                bulkAction === 'activate' ? 'activate' : 'deactivate'
              } ${selectedIds.length} selected user${selectedIds.length === 1 ? '' : 's'}?`
        }
        confirmText={bulkAction === 'delete' ? 'Delete' : 'Confirm'}
        variant={bulkAction === 'delete' ? 'danger' : 'primary'}
        onConfirm={handleBulkConfirm}
        onClose={() => {
          setBulkConfirmOpen(false);
          setBulkAction(null);
        }}
        loading={bulkDeleteMutation.isPending || bulkStatusMutation.isPending}
      />
    </PageContainer>
  );
}