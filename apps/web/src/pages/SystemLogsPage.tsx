import { Box, Typography, Chip, styled } from '@mui/material';
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
} from '@mui/icons-material';
import { useState, useCallback, type ReactElement } from 'react';
import { DataTable, type Column, type SortState, type PaginationState } from '../components/data/DataTable';
import { useAuditLogs } from '../features/audit-logs/hooks';
import type { AuditLogDTO, AuditAction } from '@vestara/types';

// ── Styled ──

const PageContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}));

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

// ── Helpers ──

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

// ── Component ──

export function SystemLogsPage(): ReactElement {
  const [sort, setSort] = useState<SortState>({ field: 'createdAt', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useAuditLogs({
    page,
    perPage,
    sort: sort.field,
    order: sort.direction,
  });

  const logs = data?.data ?? [];
  const paginationMeta = data?.meta;
  const paginationState: PaginationState | undefined = paginationMeta
    ? {
        page: paginationMeta.page,
        perPage: paginationMeta.perPage,
        total: paginationMeta.total,
      }
    : undefined;

  const handleSortChange = useCallback((newSort: SortState) => {
    setSort(newSort);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const columns: Column<AuditLogDTO>[] = [
    {
      id: 'action',
      label: 'Action',
      width: 130,
      sortable: true,
      render: (_value, row) => {
        const Icon = getActionIcon(row.action);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <ActionChip
              action={row.action}
              label={row.action.replace(/_/g, ' ')}
              size="small"
            />
          </Box>
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

  return (
    <PageContainer>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          System Logs
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          View audit trail and system activity logs.
        </Typography>
      </Box>

      <DataTable<AuditLogDTO>
        columns={columns}
        rows={logs}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        error={isError ? (error instanceof Error ? error.message : 'Failed to load audit logs') : null}
        onRetry={() => refetch()}
        sortState={sort}
        onSortChange={handleSortChange}
        pagination={paginationState}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        searchable
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search logs by action or entity..."
        title="Audit Logs"
        emptyIcon={<HistoryIcon sx={{ fontSize: 48 }} />}
        emptyTitle="No audit logs found"
        emptyDescription="No activity has been recorded yet."
      />
    </PageContainer>
  );
}

export default SystemLogsPage;
