import { Box, Chip, Typography, styled, Tooltip } from '@mui/material';
import {
  History as HistoryIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  AddCircle as CreateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Block as SuspendIcon,
  Lock as LockIcon,
  Settings as SettingsIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import type { Column } from '../../../components/data/DataTable';
import type { AuditLogDTO } from '@vestara/types';

const ActionChip = styled(Chip)<{ action: string }>(({ theme, action }) => {
  const colors: Record<string, string> = {
    login: theme.palette.success.main,
    logout: theme.palette.grey[500],
    create: theme.palette.info.main,
    update: theme.palette.warning.main,
    delete: theme.palette.error.main,
    approve: theme.palette.success.main,
    reject: theme.palette.error.main,
    suspend: theme.palette.error.dark,
    activate: theme.palette.success.main,
    password_change: theme.palette.warning.main,
    settings_update: theme.palette.info.main,
    settings_delete: theme.palette.error.main,
    error: theme.palette.error.main,
  };
  return {
    backgroundColor: colors[action] || theme.palette.grey[500],
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.6875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  };
});

function getActionIcon(action: string) {
  const icons: Record<string, typeof LoginIcon> = {
    login: LoginIcon,
    logout: LogoutIcon,
    create: CreateIcon,
    update: EditIcon,
    delete: DeleteIcon,
    approve: ApproveIcon,
    reject: RejectIcon,
    suspend: SuspendIcon,
    activate: ApproveIcon,
    password_change: LockIcon,
    settings_update: SettingsIcon,
    settings_delete: SettingsIcon,
    error: ErrorIcon,
  };
  return icons[action] || HistoryIcon;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function LogTooltipContent({ row }: { row: AuditLogDTO }) {
  return (
    <Box sx={{ p: 1.5, maxWidth: 360 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        {row.action.replace(/_/g, ' ').toUpperCase()}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          <strong>Entity:</strong> {row.entity} {row.entityId ? `(${row.entityId})` : ''}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          <strong>User:</strong> {row.userName || 'System'} ({row.userId})
        </Typography>
        {row.ipAddress && (
          <Typography variant="caption" color="text.secondary">
            <strong>IP:</strong> {row.ipAddress}
          </Typography>
        )}
        {row.userAgent && (
          <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
            <strong>User Agent:</strong> {row.userAgent}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          <strong>Timestamp:</strong> {new Date(row.createdAt).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
          })}
        </Typography>
        {row.metadata && Object.keys(row.metadata).length > 0 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 0.5,
              fontFamily: 'monospace',
              fontSize: '0.65rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              bgcolor: 'action.hover',
              p: 0.75,
              borderRadius: 0.5,
            }}
          >
            {JSON.stringify(row.metadata, null, 2)}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export function createSystemLogsColumns(): Column<AuditLogDTO>[] {
  return [
    {
      id: 'action',
      label: 'Action',
      width: 130,
      sortable: true,
      render: (_value, row) => {
        const Icon = getActionIcon(row.action);
        return (
          <Tooltip
            title={<LogTooltipContent row={row} />}
            placement="left"
            slotProps={{
              popper: {
                sx: {
                  '& .MuiTooltip-tooltip': {
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    boxShadow: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 0,
                    maxWidth: 380,
                  },
                },
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
              <Icon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <ActionChip
                action={row.action}
                label={row.action.replace(/_/g, ' ')}
                size="small"
              />
            </Box>
          </Tooltip>
        );
      },
    },
    {
      id: 'entity',
      label: 'Entity',
      width: 100,
      sortable: true,
      render: (value) => (
        <Chip
          label={value as string}
          size="small"
          variant="outlined"
          sx={{ textTransform: 'capitalize', fontSize: '0.75rem' }}
        />
      ),
    },
    {
      id: 'entityId',
      label: 'Entity ID',
      width: 100,
      render: (value) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }} noWrap>
          {(value as string)?.substring(0, 8)}...
        </Typography>
      ),
    },
    {
      id: 'userName',
      label: 'User',
      sortable: true,
      render: (_value, row) => (
        <Typography variant="body2" fontWeight={500}>
          {row.userName || 'System'}
        </Typography>
      ),
    },
    {
      id: 'ipAddress',
      label: 'IP Address',
      width: 130,
      render: (value) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {value as string || '—'}
        </Typography>
      ),
    },
    {
      id: 'createdAt',
      label: 'Timestamp',
      width: 180,
      sortable: true,
      render: (value) => (
        <Typography variant="body2" color="text.secondary">
          {formatDate(value as string)}
        </Typography>
      ),
    },
  ];
}
