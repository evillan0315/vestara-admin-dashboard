import { useState, useCallback, useMemo } from 'react';
import type { SortState, PaginationState } from '../../../components/data/DataTable';
import { useReports, useGenerateReport, useDownloadReport, useDeleteReport } from '../hooks';
import type { Report, ReportParams } from '../../../api/reports';
import { useToast } from '../../../components/feedback/Toast';

export function useReportsPage() {
  const { showSuccess, showError } = useToast();

  const [sort, setSort] = useState<SortState>({ field: 'createdAt', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuReport, setMenuReport] = useState<Report | null>(null);

  const { data, isLoading, isError, error, refetch } = useReports({ page, perPage });
  const generateMutation = useGenerateReport();
  const downloadMutation = useDownloadReport();
  const deleteMutation = useDeleteReport();

  const reports = data?.data?.reports ?? [];
  const paginationMeta = data?.meta;

  const stats = useMemo(() => ({
    total: data?.meta?.total ?? 0,
    completed: reports.filter((r) => r.status === 'completed').length,
    inProgress: reports.filter((r) => r.status === 'generating' || r.status === 'pending').length,
    failed: reports.filter((r) => r.status === 'failed').length,
  }), [reports, data?.meta?.total]);

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
    setGenerateDialogOpen,
    setDeleteTarget,
    setPerPage,
  };
}
