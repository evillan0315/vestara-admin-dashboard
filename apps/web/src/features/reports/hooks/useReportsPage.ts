import { useState, useCallback, useMemo } from 'react';
import type { SortState, PaginationState } from '../../../components/data/DataTable';
import { useReports, useGenerateReport, useDownloadReport, useDeleteReport, useReportStats } from '../hooks';
import type { Report, ReportParams } from '../../../api/reports';
import { useToast } from '../../../components/feedback/Toast';
import { useConfirm } from '../../../hooks/useConfirm';

export function useReportsPage() {
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirm();

  const [sort, setSort] = useState<SortState>({ field: 'createdAt', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuReport, setMenuReport] = useState<Report | null>(null);

  const query = useReports({
    page,
    perPage,
    search: search || undefined,
    sortField: sort.field,
    sortDirection: sort.direction,
  });

  const statsQuery = useReportStats();
  const generateMutation = useGenerateReport();
  const downloadMutation = useDownloadReport();
  const deleteMutation = useDeleteReport();

  type ApiData<T> = { success: boolean; data?: T; meta?: { page: number; perPage: number; total: number } };
  const response = query.data as ApiData<Report[]> | undefined;
  const statsResponse = statsQuery.data as ApiData<{ total: number; completed: number; generating: number; failed: number }> | undefined;

  const { isLoading, isError, error } = query;
  const refetch = query.refetch;

  const reports: Report[] = response?.data ?? [];
  const paginationMeta = response?.meta;

  const stats = useMemo(() => ({
    total: statsResponse?.data?.total ?? paginationMeta?.total ?? 0,
    completed: statsResponse?.data?.completed ?? 0,
    inProgress: statsResponse?.data?.generating ?? 0,
    failed: statsResponse?.data?.failed ?? 0,
  }), [statsResponse, paginationMeta]);

  const paginationState: PaginationState | undefined = paginationMeta
    ? { page: paginationMeta.page, perPage: paginationMeta.perPage, total: paginationMeta.total }
    : undefined;

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
    async (params: ReportParams, type: Report['type']) => {
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
        const ext = report.format === 'csv' ? 'csv' : report.format === 'excel' ? 'xlsx' : 'pdf';
        a.href = url;
        a.download = `${report.name || 'report'}.${ext}`;
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

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, report: Report) => {
    setAnchorEl(event.currentTarget);
    setMenuReport(report);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setMenuReport(null);
  }, []);

  const handleDownloadClick = useCallback(() => {
    if (menuReport) {
      handleDownload(menuReport);
      handleMenuClose();
    }
  }, [menuReport, handleDownload, handleMenuClose]);

  const handleDeleteClick = useCallback(() => {
    if (menuReport) {
      setDeleteTarget(menuReport);
      handleMenuClose();
    }
  }, [menuReport, handleMenuClose]);

  // Bulk delete
  const handleBulkDelete = useCallback(
    async (selected: Report[]) => {
      const confirmed = await confirm({
        title: 'Delete Reports',
        message: `Are you sure you want to delete ${selected.length} report(s)? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger',
      });
      if (!confirmed) return;
      try {
        await Promise.all(selected.map((r) => deleteMutation.mutateAsync(r.id)));
        showSuccess(`Deleted ${selected.length} report(s)`);
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Bulk delete failed');
      }
    },
    [deleteMutation, showSuccess, showError, confirm],
  );

  return {
    sort,
    page,
    perPage,
    search,
    generateDialogOpen,
    deleteTarget,
    anchorEl,
    menuReport,
    stats,
    reports,
    paginationState,
    isLoading,
    isError,
    error,
    refetch,
    generateMutation,
    downloadMutation,
    deleteMutation,
    handleSortChange,
    handleSearchChange,
    handlePageChange,
    handleGenerate,
    handleDownload,
    handleDelete,
    handleMenuOpen,
    handleMenuClose,
    handleDownloadClick,
    handleDeleteClick,
    handleBulkDelete,
    setGenerateDialogOpen,
    setDeleteTarget,
    setPerPage,
  };
}
