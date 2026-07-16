import { Box, Typography, Button, Menu, MenuItem, styled } from '@mui/material';
import { Add as AddIcon, Download as DownloadIcon, Delete as DeleteIcon, Assessment as AssessmentIcon } from '@mui/icons-material';
import { useMemo, useEffect, type ReactElement } from 'react';
import { DataTable } from '../components/data/DataTable';
import { ConfirmDialog } from '../components/ui/Dialog';
import { useReportsPage } from '../features/reports/hooks/useReportsPage';
import { createReportsColumns } from '../features/reports/components/ReportsTableColumns';
import { ReportsStatsCards } from '../features/reports/components/ReportsStatsCards';
import { GenerateReportDialog } from '../features/reports/components/GenerateReportDialog';
import type { Report } from '../api/reports';

const PageContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}));

export function ReportsPage(): ReactElement {
  const ctx = useReportsPage();

  const columns = useMemo(
    () => createReportsColumns({ onMenuOpen: ctx.handleMenuOpen }),
    [ctx.handleMenuOpen],
  );

  const hasPendingReports = ctx.reports.some((r) => r.status === 'pending' || r.status === 'generating');
  useEffect(() => {
    if (hasPendingReports) {
      const interval = setInterval(() => ctx.refetch(), 3000);
      return () => clearInterval(interval);
    }
  }, [hasPendingReports, ctx.refetch]);

  return (
    <PageContainer>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Reports
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Generate and manage data export reports.
        </Typography>
      </Box>

      <ReportsStatsCards
        total={ctx.stats.total}
        completed={ctx.stats.completed}
        inProgress={ctx.stats.inProgress}
        failed={ctx.stats.failed}
      />

      <DataTable<Report>
        columns={columns}
        rows={ctx.reports}
        keyExtractor={(row) => row.id}
        loading={ctx.isLoading}
        error={ctx.isError ? (ctx.error instanceof Error ? ctx.error.message : 'Failed to load reports') : null}
        onRetry={() => ctx.refetch()}
        sortState={ctx.sort}
        onSortChange={ctx.handleSortChange}
        pagination={ctx.paginationState}
        onPageChange={ctx.handlePageChange}
        onPerPageChange={ctx.setPerPage}
        searchable
        searchValue={ctx.search}
        onSearchChange={ctx.handleSearchChange}
        searchPlaceholder="Search reports by name..."
        title="All Reports"
        emptyIcon={<AssessmentIcon sx={{ fontSize: 48 }} />}
        emptyTitle="No reports found"
        emptyDescription="Generate your first report to get started."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => ctx.setGenerateDialogOpen(true)}>
            Generate Report
          </Button>
        }
      />

      <GenerateReportDialog
        open={ctx.generateDialogOpen}
        onClose={() => ctx.setGenerateDialogOpen(false)}
        onGenerate={ctx.handleGenerate}
        generating={ctx.generateMutation.isPending}
      />

      <Menu anchorEl={ctx.anchorEl} open={Boolean(ctx.anchorEl)} onClose={ctx.handleMenuClose}>
        <MenuItem onClick={ctx.handleDownloadClick} disabled={!ctx.menuReport || ctx.menuReport.status !== 'completed'}>
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Download
        </MenuItem>
        <MenuItem onClick={ctx.handleDeleteClick} disabled={!ctx.menuReport}>
          <DeleteIcon fontSize="small" color="error" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={!!ctx.deleteTarget}
        title="Delete Report"
        message={ctx.deleteTarget ? `Are you sure you want to delete "${ctx.deleteTarget.name || 'this report'}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        variant="danger"
        onConfirm={ctx.handleDelete}
        onClose={() => ctx.setDeleteTarget(null)}
        loading={ctx.deleteMutation.isPending}
      />
    </PageContainer>
  );
}

export default ReportsPage;
