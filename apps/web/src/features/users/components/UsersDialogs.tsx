import type { UserDTO, UserRole } from '@vestara/types';
import type { OrganizationDTO } from '@vestara/types';
import { UserFormDialog } from '../UserFormDialog';
import { ConfirmDialog } from '../../../components/ui/Modal';

interface UsersDialogsProps {
  dialogOpen: boolean;
  editUser: UserDTO | null;
  onDialogClose: () => void;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    role: UserRole;
    organizationId?: string;
  }) => Promise<void>;
  dialogLoading: boolean;
  organizations: OrganizationDTO[];
  currentUserRole: UserRole | undefined;

  deleteTarget: UserDTO | null;
  onDeleteConfirm: () => void;
  onDeleteClose: () => void;
  deleteLoading: boolean;

  bulkConfirmOpen: boolean;
  bulkAction: 'delete' | 'activate' | 'deactivate' | null;
  selectedIds: string[];
  onBulkConfirm: () => void;
  onBulkClose: () => void;
  bulkLoading: boolean;
}

export function UsersDialogs({
  dialogOpen,
  editUser,
  onDialogClose,
  onSubmit,
  dialogLoading,
  organizations,
  currentUserRole,
  deleteTarget,
  onDeleteConfirm,
  onDeleteClose,
  deleteLoading,
  bulkConfirmOpen,
  bulkAction,
  selectedIds,
  onBulkConfirm,
  onBulkClose,
  bulkLoading,
}: UsersDialogsProps) {
  return (
    <>
      <UserFormDialog
        open={dialogOpen}
        user={editUser}
        onClose={onDialogClose}
        onSubmit={onSubmit}
        loading={dialogLoading}
        organizations={organizations}
        currentUserRole={currentUserRole}
      />

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
        onConfirm={onDeleteConfirm}
        onClose={onDeleteClose}
        loading={deleteLoading}
      />

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
        onConfirm={onBulkConfirm}
        onClose={onBulkClose}
        loading={bulkLoading}
      />
    </>
  );
}

export default UsersDialogs;
