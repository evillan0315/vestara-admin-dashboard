import { useState, useMemo, useEffect, useCallback, type ReactElement } from 'react';
import { Box, Typography, Button, Menu, MenuItem, Tabs, Tab, styled, alpha } from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
  CompareArrows as CompareIcon,
  AutoAwesome as TemplateIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DataTable } from '../components/data/DataTable';
import { ConfirmDialog } from '../components/ui/Dialog';
import { useReportsPage } from '../features/reports/hooks/useReportsPage';
import { createReportsColumns } from '../features/reports/components/ReportsTableColumns';
import { ReportsStatsCards } from '../features/reports/components/ReportsStatsCards';
import { GenerateReportDialog } from '../features/reports/components/GenerateReportDialog';
import { ReportsTemplatesPanel } from '../features/reports/components/ReportsTemplatesPanel';
import { ReportsCompareDialog } from '../features/reports/components/ReportsCompareDialog';
import { useWebSocketEvent } from '../websocket/hooks';
import { WS_EVENT, type WsReportStatusPayload } from '@vestara/types';
import type { Report } from '../api/reports';

const PageContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}));

export function ReportsPage(): ReactElement {
  const ctx = useReportsPage();
  const [tab, setTab] = useState(0);
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedReports = useMemo(
    () => ctx.reports.filter((r) => selectedIds.includes(r.id)),
    [ctx.reports, selectedIds],
  );

  // Live WebSocket updates for report status
  const handleReportStatus = useCallback(
    (msg: { type: string; payload: WsReportStatusPayload }) => {
      if (msg.payload.status === 'completed' || msg.payload.status === 'failed') {
        ctx.refetch();
      }
    },
    [ctx.refetch],
  );
  useWebSocketEvent(WS_EVENT.REPORT_STATUS, handleReportStatus);

  const columns = useMemo(
    () => createReportsColumns({ onMenuOpen: ctx.handleMenuOpen }),
    [ctx.handleMenuOpen],
  );

  const hasPendingReports = ctx.reports.some(
    (r) => r.status === 'pending' || r.status === 'generating',
  );
  useEffect(() => {
    if (hasPendingReports) {
      const interval = setInterval(() => ctx.refetch(), 3000);
      return () => clearInterval(interval);
    }
  }, [hasPendingReports, ctx.refetch]);

  const handleTabChange = (_: unknown, newValue: number) => setTab(newValue);

  return (
    <PageContainer>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Reports
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, display: { xs: 'none', sm: 'block' } }}>
            Generate and manage data export reports.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => ctx.refetch()}
          sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
        >
          Refresh
        </Button>
      </Box>

      <ReportsStatsCards
        total={ctx.stats.total}
        completed={ctx.stats.completed}
        inProgress={ctx.stats.inProgress}
        failed={ctx.stats.failed}
      />

      <Tabs value={tab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Report History" icon={<AssessmentIcon />} iconPosition="start" />
        <Tab label="Templates" icon={<TemplateIcon />} iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <>
          <DataTable<Report>
            columns={columns}
            rows={ctx.reports}
            keyExtractor={(row) => row.id}
            loading={ctx.isLoading}
            error={
              ctx.isError
                ? ctx.error instanceof Error
                  ? ctx.error.message
                  : 'Failed to load reports'
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
            searchPlaceholder="Search reports by name..."
            title="All Reports"
            emptyIcon={<AssessmentIcon sx={{ fontSize: 48 }} />}
            emptyTitle="No reports found"
            emptyDescription="Generate your first report to get started."
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            actions={
              <Box sx={{ display: 'flex', gap: 1 }}>
                {selectedIds.length >= 2 && (
                  <Button
                    variant="outlined"
                    startIcon={<CompareIcon />}
                    onClick={() => setCompareOpen(true)}
                    sx={{ textTransform: 'none' }}
                  >
                    Compare ({selectedIds.length})
                  </Button>
                )}
                {selectedIds.length > 0 && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() =>
                      ctx.handleBulkDelete(
                        selectedIds.map((id) => ctx.reports.find((r) => r.id === id)!),
                      )
                    }
                    sx={{ textTransform: 'none' }}
                  >
                    Delete ({selectedIds.length})
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => ctx.setGenerateDialogOpen(true)}
                >
                  Generate Report
                </Button>
              </Box>
            }
          />
        </>
      )}

      {tab === 1 && <ReportsTemplatesPanel />}

      <GenerateReportDialog
        open={ctx.generateDialogOpen}
        onClose={() => ctx.setGenerateDialogOpen(false)}
        onGenerate={ctx.handleGenerate}
        generating={ctx.generateMutation.isPending}
      />

      <ReportsCompareDialog
        open={compareOpen}
        reportIds={selectedIds}
        reports={selectedReports}
        onClose={() => setCompareOpen(false)}
      />

      <Menu anchorEl={ctx.anchorEl} open={Boolean(ctx.anchorEl)} onClose={ctx.handleMenuClose}>
        <MenuItem
          onClick={ctx.handleDownloadClick}
          disabled={!ctx.menuReport || ctx.menuReport.status !== 'completed'}
        >
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
        message={
          ctx.deleteTarget
            ? `Are you sure you want to delete "${ctx.deleteTarget.name || 'this report'}"? This action cannot be undone.`
            : ''
        }
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
