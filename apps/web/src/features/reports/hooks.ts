import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsApi, type ReportParams, type Report } from '../../api/reports';

export const reportKeys = {
  all: ['reports'] as const,
  list: (params?: Record<string, unknown>) => ['reports', 'list', params] as const,
  stats: () => ['reports', 'stats'] as const,
  status: (id: string) => ['reports', 'status', id] as const,
  templates: () => ['reports', 'templates'] as const,
};

export function useReports(params?: {
  page?: number;
  perPage?: number;
  search?: string;
  sortField?: string;
  sortDirection?: string;
}) {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: () => reportsApi.list(params),
  });
}

export function useReportStats() {
  return useQuery({
    queryKey: reportKeys.stats(),
    queryFn: () => reportsApi.stats(),
    refetchInterval: 30_000,
  });
}

export function useAvailableColumns(type: string) {
  return useQuery({
    queryKey: ['reports', 'columns', type],
    queryFn: () => reportsApi.getAvailableColumns(type),
    enabled: !!type,
  });
}

export function usePreviewReport() {
  return useMutation({
    mutationFn: ({ params, type }: { params: ReportParams; type?: Report['type'] }) =>
      reportsApi.preview({ ...params, type }),
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ params, type }: { params: ReportParams; type?: Report['type'] }) =>
      reportsApi.generate(params, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

export function useReportStatus(reportId: string, enabled = true) {
  return useQuery({
    queryKey: reportKeys.status(reportId),
    queryFn: () => reportsApi.getStatus(reportId),
    enabled: enabled && !!reportId,
    refetchInterval: (query) => {
      const d = query.state.data?.data as Report | undefined;
      return d?.status === 'pending' || d?.status === 'generating' ? 3000 : false;
    },
  });
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: (reportId: string) => reportsApi.download(reportId),
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportId: string) => reportsApi.delete(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

// ── Templates ─────────────────────────────────────────────────────────────

export function useReportTemplates() {
  return useQuery({
    queryKey: reportKeys.templates(),
    queryFn: () => reportsApi.listTemplates(),
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      type: Report['type'];
      format: Report['format'];
      config?: Record<string, unknown>;
    }) => reportsApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.templates() });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        name: string;
        description: string;
        type: Report['type'];
        format: Report['format'];
        config: Record<string, unknown>;
      }>;
    }) => reportsApi.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.templates() });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reportsApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.templates() });
    },
  });
}

// ── Comparison ────────────────────────────────────────────────────────────

export function useCompareReports() {
  return useMutation({
    mutationFn: (reportIds: string[]) => reportsApi.compare(reportIds),
  });
}
