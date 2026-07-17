import apiClient from './client';

export interface ReportParams {
  name?: string;
  description?: string;
  startDate: string;
  endDate: string;
  action?: string;
  entity?: string;
  userId?: string;
  format?: 'csv' | 'excel' | 'pdf';
  /** Optional columns to include (if omitted, all columns are included). */
  selectedColumns?: string[];
  /** Optional cron expression for scheduled reports. */
  schedule?: string;
  /** Optional email address for delivery. */
  emailTo?: string;
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  type: 'audit_logs' | 'system_logs' | 'users' | 'activity';
  status: 'pending' | 'generating' | 'completed' | 'failed';
  params: ReportParams;
  format: 'csv' | 'excel' | 'pdf';
  fileUrl?: string;
  fileSize?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
  updatedAt: string;
}

export interface ReportStats {
  total: number;
  completed: number;
  generating: number;
  failed: number;
}

export interface ColumnDef {
  id: string;
  label: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: Report['type'];
  format: Report['format'];
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const reportsApi = {
  // List reports with search, sort, pagination
  list(params?: {
    page?: number;
    perPage?: number;
    search?: string;
    sortField?: string;
    sortDirection?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.perPage) searchParams.set('perPage', String(params.perPage));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sortField) searchParams.set('sortField', params.sortField);
    if (params?.sortDirection) searchParams.set('sortDirection', params.sortDirection);

    const qs = searchParams.toString();
    return apiClient.get<{
      data: Report[];
      meta: { total: number; page: number; perPage: number };
    }>(`/reports${qs ? `?${qs}` : ''}`);
  },

  // Get report stats
  stats() {
    return apiClient.get<{ data: ReportStats }>('/reports/stats');
  },

  // Get available columns for a report type
  getAvailableColumns(type: string) {
    return apiClient.get<{ data: ColumnDef[] }>(`/reports/columns/${type}`);
  },

  // Preview report data
  preview(params: ReportParams & { type?: Report['type'] }) {
    return apiClient.post<{ data: Record<string, unknown>[] }>('/reports/preview', params);
  },

  // Generate a new report
  generate(params: ReportParams, type: Report['type'] = 'audit_logs') {
    return apiClient.post<{ data: Report }>('/reports/generate', { ...params, type });
  },

  // Get report status
  getStatus(reportId: string) {
    return apiClient.get<{ data: Report }>(`/reports/${reportId}/status`);
  },

  // Download report file
  download(reportId: string) {
    return apiClient.getBlob(`/reports/${reportId}/download`);
  },

  // Delete report
  delete(reportId: string) {
    return apiClient.delete<{ message: string }>(`/reports/${reportId}`);
  },

  // ── Templates ───────────────────────────────────────────────────────────

  listTemplates() {
    return apiClient.get<{ data: ReportTemplate[] }>('/reports/templates');
  },

  createTemplate(data: {
    name: string;
    description?: string;
    type: Report['type'];
    format: Report['format'];
    config?: Record<string, unknown>;
  }) {
    return apiClient.post<{ data: ReportTemplate }>('/reports/templates', data);
  },

  updateTemplate(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      type: Report['type'];
      format: Report['format'];
      config: Record<string, unknown>;
    }>,
  ) {
    return apiClient.put<{ data: ReportTemplate }>(`/reports/templates/${id}`, data);
  },

  deleteTemplate(id: string) {
    return apiClient.delete<{ message: string }>(`/reports/templates/${id}`);
  },

  // ── Comparison ──────────────────────────────────────────────────────────

  compare(reportIds: string[]) {
    return apiClient.post<{ data: Report[] }>('/reports/compare', { reportIds });
  },
};
