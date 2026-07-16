import { Box, Typography, Chip, IconButton, styled, Avatar, Tooltip } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import type { Column } from '../../../components/data/DataTable';
import type { UserDTO } from '@vestara/types';

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

interface CreateUsersColumnsParams {
  orgMap: Map<string, string>;
  onEdit: (user: UserDTO) => void;
  onToggleStatus: (user: UserDTO) => Promise<void>;
  onDeleteRequest: (user: UserDTO) => void;
}

export function createUsersColumns({
  orgMap,
  onEdit,
  onToggleStatus,
  onDeleteRequest,
}: CreateUsersColumnsParams): Column<UserDTO>[] {
  return [
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
      render: (_value, row) => {
        const orgName = row.organizationId ? orgMap.get(row.organizationId) : null;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {orgName || '—'}
            </Typography>
          </Box>
        );
      },
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
            <IconButton size="small" onClick={() => onEdit(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.isActive ? 'Deactivate user' : 'Activate user'}>
            <IconButton size="small" onClick={() => onToggleStatus(row)}>
              {row.isActive ? (
                <BlockIcon fontSize="small" color="warning" />
              ) : (
                <CheckCircleIcon fontSize="small" color="success" />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete user">
            <IconButton size="small" onClick={() => onDeleteRequest(row)}>
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];
}
