import apiClient from './client';
import type { AuditLogDTO } from '@vestara/types';

export interface AuditLogListParams {
  page?: number;
  perPage?: number;
  action?: string;
  entity?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export const auditLogsApi = {
  list(params?: AuditLogListParams) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.perPage) searchParams.set('perPage', String(params.perPage));
    if (params?.action) searchParams.set('action', params.action);
    if (params?.entity) searchParams.set('entity', params.entity);
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.order) searchParams.set('order', params.order);
    const qs = searchParams.toString();
    return apiClient.get<AuditLogDTO[]>(`/audit-logs${qs ? `?${qs}` : ''}`);
  },

  getById(id: string) {
    return apiClient.get<{ log: AuditLogDTO }>(`/audit-logs/${id}`);
  },
};
