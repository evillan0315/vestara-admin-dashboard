import { Box, Typography, styled } from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import { useMemo, type ReactElement } from 'react';
import { DataTable } from '../components/data/DataTable';
import { useSystemLogsPage } from '../features/audit-logs/hooks/useSystemLogsPage';
import { createSystemLogsColumns } from '../features/audit-logs/components/SystemLogsColumns';
import type { AuditLogDTO } from '@vestara/types';

const PageContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}));

export function SystemLogsPage(): ReactElement {
  const ctx = useSystemLogsPage();

  const columns = useMemo(() => createSystemLogsColumns(), []);

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
        rows={ctx.logs}
        keyExtractor={(row) => row.id}
        loading={ctx.isLoading}
        error={
          ctx.isError
            ? ctx.error instanceof Error
              ? ctx.error.message
              : 'Failed to load audit logs'
            : null
        }
        onRetry={() => ctx.refetch()}
        sortState={ctx.sort}
        onSortChange={ctx.handleSortChange}
        pagination={ctx.paginationState}
        onPageChange={ctx.handlePageChange}
        onPerPageChange={ctx.setPerPage}
        searchable
        searchValue={ctx.search}
        onSearchChange={ctx.handleSearchChange}
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
