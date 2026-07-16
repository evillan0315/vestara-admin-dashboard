import { useState, useCallback, useMemo } from 'react';
import type { UserDTO, UserRole } from '@vestara/types';
import type { SortState, PaginationState } from '../../../components/data/DataTable';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useToggleUserStatus, useBulkDeleteUsers, useBulkUpdateUserStatus, useUserStats } from '../hooks';
import { useOrganizations } from '../../organizations/hooks';
import { exportUsersCsv } from '../exportUsers';
import { useToast } from '../../../components/feedback/Toast';
import { useAuth } from '../../auth/AuthContext';

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 13);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

export interface UsersPageState {
  sort: SortState;
  page: number;
  perPage: number;
  searchTerm: string;
  roleFilter: UserRole | '';
  statusFilter: boolean | '';
  dateRange: { startDate: string; endDate: string };
  selectedIds: string[];
  dialogOpen: boolean;
  editUser: UserDTO | null;
  deleteTarget: UserDTO | null;
  bulkConfirmOpen: boolean;
  bulkAction: 'delete' | 'activate' | 'deactivate' | null;
  exporting: boolean;
}

export function useUsersPage() {
  const { showSuccess, showError } = useToast();

  const [sort, setSort] = useState<SortState>({ field: 'createdAt', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<boolean | ''>('');
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>(getDefaultDateRange());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserDTO | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'delete' | 'activate' | 'deactivate' | null>(null);
  const [exporting, setExporting] = useState(false);

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

  const { data: userStats } = useUserStats();
  const { data: organizations = [] } = useOrganizations();
  const { user } = useAuth();

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const toggleStatusMutation = useToggleUserStatus();
  const bulkDeleteMutation = useBulkDeleteUsers();
  const bulkStatusMutation = useBulkUpdateUserStatus();

  const users = data?.data ?? [];

  const paginationState: PaginationState | undefined = useMemo(() => {
    const meta = data?.meta;
    if (!meta) return undefined;
    return { page: meta.page, perPage: meta.perPage, total: meta.total };
  }, [data?.meta]);

  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const org of organizations) {
      map.set(org.id, org.name);
    }
    return map;
  }, [organizations]);

  const hasActiveFilters = !!roleFilter || statusFilter !== '' || !!searchTerm;

  const resetPageAndSelection = useCallback(() => {
    setPage(1);
    setSelectedIds([]);
  }, []);

  const handleSortChange = useCallback((newSort: SortState) => {
    setSort(newSort);
    resetPageAndSelection();
  }, [resetPageAndSelection]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    resetPageAndSelection();
  }, [resetPageAndSelection]);

  const handleSearchClear = useCallback(() => {
    setSearchTerm('');
    resetPageAndSelection();
  }, [resetPageAndSelection]);

  const handleRoleFilterChange = useCallback((role: string) => {
    setRoleFilter(role as UserRole | '');
    resetPageAndSelection();
  }, [resetPageAndSelection]);

  const handleStatusFilterChange = useCallback((status: string) => {
    if (status === 'true') setStatusFilter(true);
    else if (status === 'false') setStatusFilter(false);
    else setStatusFilter('');
    resetPageAndSelection();
  }, [resetPageAndSelection]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
    setDateRange(getDefaultDateRange());
    setPage(1);
    setSelectedIds([]);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    setSelectedIds([]);
  }, []);

  const handleDateRangeChange = useCallback((newRange: { startDate: string; endDate: string }) => {
    setDateRange(newRange);
    resetPageAndSelection();
  }, [resetPageAndSelection]);

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
    async (formData: { firstName: string; lastName: string; email: string; password?: string; role: UserRole; organizationId?: string }) => {
      try {
        if (editUser) {
          await updateMutation.mutateAsync({
            id: editUser.id,
            data: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              role: formData.role,
              organizationId: formData.organizationId,
            },
          });
          showSuccess('User updated successfully');
        } else {
          await createMutation.mutateAsync(formData as Parameters<typeof createMutation.mutateAsync>[0]);
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

  const handleBulkClick = useCallback((action: 'delete' | 'activate' | 'deactivate') => {
    setBulkAction(action);
    setBulkConfirmOpen(true);
  }, []);

  const handleBulkClose = useCallback(() => {
    setBulkConfirmOpen(false);
    setBulkAction(null);
  }, []);

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

  return {
    userStats,
    sort,
    page,
    perPage,
    searchTerm,
    roleFilter,
    statusFilter,
    dateRange,
    selectedIds,
    dialogOpen,
    editUser,
    deleteTarget,
    bulkConfirmOpen,
    bulkAction,
    exporting,
    users,
    paginationState,
    organizations,
    orgMap,
    hasActiveFilters,
    isLoading,
    isError,
    error,
    refetch,
    user,
    createMutation,
    updateMutation,
    deleteMutation,
    toggleStatusMutation,
    bulkDeleteMutation,
    bulkStatusMutation,
    handleSortChange,
    handleSearchChange,
    handleSearchClear,
    handleRoleFilterChange,
    handleStatusFilterChange,
    handleClearFilters,
    handlePageChange,
    handleDateRangeChange,
    handleCreate,
    handleEdit,
    handleDialogClose,
    handleDialogSubmit,
    handleDelete,
    handleToggleStatus,
    handleBulkConfirm,
    handleBulkClick,
    handleBulkClose,
    handleExport,
    setPerPage,
    setSelectedIds,
    setDeleteTarget,
  };
}
