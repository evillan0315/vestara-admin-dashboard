import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsApi, type ReportParams } from '../../api/reports';

export function useReports(params?: { page?: number; perPage?: number }) {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: () => reportsApi.list(params),
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ params, type }: { params: ReportParams; type?: 'audit-logs' | 'system-logs' }) =>
      reportsApi.generate(params, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useReportStatus(reportId: string, enabled = true) {
  return useQuery({
    queryKey: ['reports', 'status', reportId],
    queryFn: () => reportsApi.getStatus(reportId),
    enabled: enabled && !!reportId,
    refetchInterval: (query) => {
      const data = query.state.data?.data?.report;
      return data?.status === 'pending' || data?.status === 'generating' ? 3000 : false;
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
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}