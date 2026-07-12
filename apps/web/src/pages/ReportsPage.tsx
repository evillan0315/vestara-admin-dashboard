import { Box, Typography, Button, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Menu, MenuItem, Tooltip, styled, Paper, Grid } from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PictureAsPdfIcon,
  TableChart as TableChartIcon,
  HourglassEmpty as HourglassEmptyIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useState, useCallback, useEffect, type ReactElement } from 'react';
import { DataTable, type Column, type SortState, type PaginationState } from '../components/data/DataTable';
import {
  useReports,
  useGenerateReport,
  useDownloadReport,
  useDeleteReport,
} from '../features/reports/hooks';
import { useToast } from '../components/feedback/Toast';
import { ConfirmDialog } from '../components/ui/Dialog';
import type { Report, ReportParams } from '../api/reports';

// ── Styled ──

const PageContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}));

const StatCard = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
}));

const StatValue = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 700,
  color: theme.palette.primary.main,
  lineHeight: 1.2,
}));

const StatLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
  marginTop: theme.spacing(0.5),
}));

// ── Helpers ──

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusIcon(status: Report['status']) {
  switch (status) {
    case 'pending':
    case 'generating':
      return <HourglassEmptyIcon color="warning" fontSize="small" />;
    case 'completed':
      return <CheckCircleIcon color="success" fontSize="small" />;
    case 'failed':
      return <ErrorIcon color="error" fontSize="small" />;
    default:
      return <HourglassEmptyIcon fontSize="small" />;
  }
}

function getStatusColor(status: Report['status']) {
  switch (status) {
    case 'pending':
    case 'generating':
      return 'warning';
    case 'completed':
      return 'success';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
}

function getFormatIcon(format: string) {
  switch (format) {
    case 'csv':
      return <TableChartIcon color="action" fontSize="small" />;
    case 'excel':
      return <DescriptionIcon color="success" fontSize="small" />;
    case 'pdf':
      return <PictureAsPdfIcon color="error" fontSize="small" />;
    default:
      return <AssessmentIcon color="action" fontSize="small" />;
  }
}

function getTypeLabel(type: Report['type']) {
  switch (type) {
    case 'audit-logs':
      return 'Audit Logs';
    case 'system-logs':
      return 'System Logs';
    case 'users':
      return 'Users';
    case 'activity':
      return 'Activity';
    default:
      return type;
  }
}

// ── Generate Report Dialog ──

interface GenerateReportDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (params: ReportParams, type: 'audit-logs' | 'system-logs') => void;
  generating: boolean;
}

function GenerateReportDialog({ open, onClose, onGenerate, generating }: GenerateReportDialogProps) {
  const [formData, setFormData] = useState<ReportParams & { type: 'audit-logs' | 'system-logs'; name: string }>({
    startDate: '',
    endDate: '',
    type: 'audit-logs',
    format: 'csv',
    name: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { type, ...params } = formData;
    onGenerate(params as ReportParams, type);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Generate Report</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ pt: 1 }}>
            <Grid size={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Report Configuration
              </Typography>
            </Grid>
            <Grid size={12}>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <Typography variant="body2" fontWeight={500}>
                  Report Name
                </Typography>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Monthly Audit Report"
                  required
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--mui-palette-divider)',
                    backgroundColor: 'var(--mui-palette-background-paper)',
                    color: 'var(--mui-palette-text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </label>
            </Grid>
            <Grid size={6}>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <Typography variant="body2" fontWeight={500}>
                  Report Type
                </Typography>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'audit-logs' | 'system-logs' })}
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--mui-palette-divider)',
                    backgroundColor: 'var(--mui-palette-background-paper)',
                    color: 'var(--mui-palette-text-primary)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="audit-logs">Audit Logs</option>
                  <option value="system-logs">System Logs</option>
                </select>
              </label>
            </Grid>
            <Grid size={6}>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <Typography variant="body2" fontWeight={500}>
                  Format
                </Typography>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value as 'csv' | 'excel' | 'pdf' })}
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--mui-palette-divider)',
                    backgroundColor: 'var(--mui-palette-background-paper)',
                    color: 'var(--mui-palette-text-primary)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="csv">CSV</option>
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="pdf">PDF</option>
                </select>
              </label>
            </Grid>
            <Grid size={6}>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <Typography variant="body2" fontWeight={500}>
                  Start Date
                </Typography>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--mui-palette-divider)',
                    backgroundColor: 'var(--mui-palette-background-paper)',
                    color: 'var(--mui-palette-text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </label>
            </Grid>
            <Grid size={6}>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <Typography variant="body2" fontWeight={500}>
                  End Date
                </Typography>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--mui-palette-divider)',
                    backgroundColor: 'var(--mui-palette-background-paper)',
                    color: 'var(--mui-palette-text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </label>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ gap: 2 }}>
          <Button onClick={onClose} disabled={generating}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" startIcon={<AssessmentIcon />} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Report'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ── Main Reports Page ──

export function ReportsPage(): ReactElement {
  const { showSuccess, showError } = useToast();

  // Sort & pagination state
  const [sort, setSort] = useState<SortState>({ field: 'createdAt', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [search, setSearch] = useState('');

  // Dialog state
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);

  // Queries & mutations
  const { data, isLoading, isError, error, refetch } = useReports({ page, perPage });
  const generateMutation = useGenerateReport();
  const downloadMutation = useDownloadReport();
  const deleteMutation = useDeleteReport();

  const reports = data?.data?.reports ?? [];
  const paginationMeta = data?.meta;
  const paginationState: PaginationState | undefined = paginationMeta
    ? {
        page: paginationMeta.page,
        perPage: paginationMeta.perPage,
        total: paginationMeta.total,
      }
    : undefined;

  // Auto-refresh for pending reports
  const hasPendingReports = reports.some((r) => r.status === 'pending' || r.status === 'generating');
  useEffect(() => {
    if (hasPendingReports) {
      const interval = setInterval(() => refetch(), 3000);
      return () => clearInterval(interval);
    }
  }, [hasPendingReports, refetch]);

  // Handlers
  const handleSortChange = useCallback((newSort: SortState) => {
    setSort(newSort);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleGenerate = useCallback(
    async (params: ReportParams, type: 'audit-logs' | 'system-logs') => {
      try {
        await generateMutation.mutateAsync({ params, type });
        showSuccess('Report generation started');
        setGenerateDialogOpen(false);
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to generate report');
      }
    },
    [generateMutation, showSuccess, showError],
  );

  const handleDownload = useCallback(
    async (report: Report) => {
      try {
        const blob = await downloadMutation.mutateAsync(report.id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.name || 'report'}.${report.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showSuccess('Download started');
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Download failed');
      }
    },
    [downloadMutation, showSuccess, showError],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showSuccess('Report deleted successfully');
      setDeleteTarget(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Delete failed');
    }
  }, [deleteTarget, deleteMutation, showSuccess, showError]);

  // Columns
  const columns: Column<Report>[] = [
    {
      id: 'name',
      label: 'Report',
      sortable: true,
      width: 200,
      render: (_value: unknown, row: Report) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 1, backgroundColor: 'action.hover' }}>
            {getFormatIcon(row.format)}
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {row.name || 'Unnamed Report'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getTypeLabel(row.type)} • {row.format.toUpperCase()}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      width: 130,
      sortable: true,
      render: (_value: unknown, row: Report) => (
        <Chip
          icon={getStatusIcon(row.status)}
          label={row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          color={getStatusColor(row.status)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      id: 'params',
      label: 'Date Range',
      width: 180,
      sortable: false,
      render: (_value: unknown, row: Report) => (
        <Typography variant="body2" color="text.secondary">
          {row.params?.startDate ? formatDate(row.params.startDate as string) : '—'} –{' '}
          {row.params?.endDate ? formatDate(row.params.endDate as string) : '—'}
        </Typography>
      ),
    },
    {
      id: 'fileSize',
      label: 'Size',
      width: 100,
      sortable: false,
      align: 'right',
      render: (value: unknown) => <Typography variant="body2" color="text.secondary">{formatFileSize(value as number)}</Typography>,
    },
    {
      id: 'createdAt',
      label: 'Created',
      width: 160,
      sortable: true,
      render: (value: unknown) => <Typography variant="body2" color="text.secondary">{formatDate(value as string)}</Typography>,
    },
    {
      id: 'actions',
      label: '',
      width: 80,
      render: (_value: unknown, row: Report) => (
        <Tooltip title="More actions">
          <IconButton size="small" onClick={(e) => handleMenuOpen(e, row)}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  // Context menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuReport, setMenuReport] = useState<Report | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, report: Report) => {
    setAnchorEl(event.currentTarget);
    setMenuReport(report);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuReport(null);
  };

  const handleDownloadClick = () => {
    if (menuReport) {
      handleDownload(menuReport);
      handleMenuClose();
    }
  };

  const handleDeleteClick = () => {
    if (menuReport) {
      setDeleteTarget(menuReport);
      handleMenuClose();
    }
  };

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

      {/* Stats Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard>
            <StatValue>{data?.meta?.total ?? 0}</StatValue>
            <StatLabel>Total Reports</StatLabel>
          </StatCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard>
            <StatValue>
              {reports.filter((r) => r.status === 'completed').length}
            </StatValue>
            <StatLabel>Completed</StatLabel>
          </StatCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard>
            <StatValue>
              {reports.filter((r) => r.status === 'generating' || r.status === 'pending').length}
            </StatValue>
            <StatLabel>In Progress</StatLabel>
          </StatCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard>
            <StatValue>
              {reports.filter((r) => r.status === 'failed').length}
            </StatValue>
            <StatLabel>Failed</StatLabel>
          </StatCard>
        </Grid>
      </Grid>

      {/* Reports Table */}
      <DataTable<Report>
        columns={columns}
        rows={reports}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        error={isError ? (error instanceof Error ? error.message : 'Failed to load reports') : null}
        onRetry={() => refetch()}
        sortState={sort}
        onSortChange={handleSortChange}
        pagination={paginationState}
        onPageChange={handlePageChange}
        onPerPageChange={setPerPage}
        searchable
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search reports by name..."
        title="All Reports"
        emptyIcon={<AssessmentIcon sx={{ fontSize: 48 }} />}
        emptyTitle="No reports found"
        emptyDescription="Generate your first report to get started."
        actions={
          <>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setGenerateDialogOpen(true)}>
              Generate Report
            </Button>
          </>
        }
      />

      {/* Generate Report Dialog */}
      <GenerateReportDialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        onGenerate={handleGenerate}
        generating={generateMutation.isPending}
      />

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleDownloadClick} disabled={!menuReport || menuReport.status !== 'completed'}>
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Download
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} disabled={!menuReport}>
          <DeleteIcon fontSize="small" color="error" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Report"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name || 'this report'}"? This action cannot be undone.`
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

export default ReportsPage;