import { Box, Typography, Button, Chip, IconButton, styled, Avatar, Tooltip } from '@mui/material';
import {
  People as PeopleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useState, useCallback, type ReactElement } from 'react';
import { DataTable, type Column, type SortState, type PaginationState } from '../components/data/DataTable';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useToggleUserStatus } from '../features/users/hooks';
import { UserFormDialog } from '../features/users/UserFormDialog';
import { useToast } from '../components/feedback/Toast';
import { ConfirmDialog } from '../components/ui/Modal';
import type { UserDTO, UserRole } from '@vestara/types';

// ── Styled ──

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

// ── Helpers ──

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// ── Component ──

export function UsersPage(): ReactElement {
  const { showSuccess, showError } = useToast();

  // Sort & pagination state
  const [sort, setSort] = useState<SortState>({ field: 'createdAt', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [search, setSearch] = useState('');

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserDTO | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<UserDTO | null>(null);

  // Queries & mutations
  const { data, isLoading, isError, error, refetch } = useUsers({
    page,
    perPage,
    search: search || undefined,
    sort: sort.field,
    order: sort.direction,
  });

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const toggleStatusMutation = useToggleUserStatus();

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
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

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
    async (data: { firstName: string; lastName: string; email: string; password?: string; role: UserRole }) => {
      try {
        if (editUser) {
          await updateMutation.mutateAsync({
            id: editUser.id,
            data: {
              firstName: data.firstName,
              lastName: data.lastName,
              role: data.role,
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
            {getInitials(row.firstName, row.lastName)}
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
      id: 'lastLoginAt',
      label: 'Last Login',
      width: 140,
      sortable: true,
      render: (value) => formatDate(value as string),
    },
    {
      id: 'createdAt',
      label: 'Created',
      width: 140,
      sortable: true,
      render: (value) => formatDate(value as string),
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
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        searchable
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search users by name or email..."
        title="All Users"
        emptyIcon={<PeopleIcon sx={{ fontSize: 48 }} />}
        emptyTitle="No users found"
        emptyDescription="No users match your search criteria."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Add User
          </Button>
        }
      />

      {/* Create / Edit Dialog */}
      <UserFormDialog
        open={dialogOpen}
        user={editUser}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
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
    </PageContainer>
  );
}

export default UsersPage;
