import apiClient from './client';
import type { AuditLogDTO } from '@vestara/types';

export interface ReportParams {
  startDate: string;
  endDate: string;
  action?: string;
  entity?: string;
  userId?: string;
  format?: 'csv' | 'excel' | 'pdf';
}

export interface Report {
  id: string;
  type: 'audit-logs' | 'system-logs';
  status: 'pending' | 'generating' | 'completed' | 'failed';
  params: ReportParams;
  createdAt: string;
  completedAt?: string;
  fileUrl?: string;
  fileSize?: number;
}

export const reportsApi = {
  // Generate a new report
  generate(params: ReportParams, type: 'audit-logs' | 'system-logs' = 'audit-logs') {
    return apiClient.post<{ report: Report }>('/reports/generate', {
      ...params,
      type,
    });
  },

  // Get report status
  getStatus(reportId: string) {
    return apiClient.get<{ report: Report }>(`/reports/${reportId}/status`);
  },

  // Download report file
  download(reportId: string) {
    return apiClient.get<Blob>(`/reports/${reportId}/download`, {
      responseType: 'blob',
    });
  },

  // Get user's report history
  list(params?: { page?: number; perPage?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.perPage) searchParams.set('perPage', String(params.perPage));
    
    const qs = searchParams.toString();
    return apiClient.get<{ reports: Report[]; meta: { total: number; page: number; perPage: number } }>(`/reports${qs ? `?${qs}` : ''}`);
  },

  // Delete report
  delete(reportId: string) {
    return apiClient.delete<{ message: string }>(`/reports/${reportId}`);
  },
};
