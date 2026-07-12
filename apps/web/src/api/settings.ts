import apiClient from './client';
import type {
  SystemSettingDTO,
  UpdateSettingRequestDTO,
  SettingsImportResultDTO,
} from '@vestara/types';

export const settingsApi = {
  list() {
    return apiClient.get<{ settings: Record<string, unknown> }>('/settings');
  },

  getByKey(key: string) {
    return apiClient.get<{ setting: SystemSettingDTO }>(`/settings/${key}`);
  },

  upsert(data: UpdateSettingRequestDTO) {
    return apiClient.put<{ setting: SystemSettingDTO }>(`/settings/${data.key}`, data);
  },

  delete(key: string) {
    return apiClient.delete<void>(`/settings/${key}`);
  },

  exportSettings() {
    const token = localStorage.getItem('accessToken');
    const url = `/settings/export`;
    return fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}${url}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).then((res) => {
      if (!res.ok) throw new Error('Export failed');
      return res.json();
    });
  },

  importSettings(settings: Record<string, unknown>) {
    return apiClient.post<{ result: SettingsImportResultDTO }>('/settings/import', { settings });
  },

  getAuditHistory(params?: {
    page?: number;
    perPage?: number;
    startDate?: string;
    endDate?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.perPage) searchParams.set('perPage', String(params.perPage));
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.order) searchParams.set('order', params.order);

    const query = searchParams.toString();
    return apiClient.get<{
      logs: {
        id: string;
        action: string;
        entity: string;
        entityId: string;
        userId: string;
        metadata?: Record<string, unknown>;
        createdAt: string;
        user?: { id: string; firstName: string; lastName: string; email: string };
      }[];
      pagination: { page: number; perPage: number; total: number; totalPages: number };
    }>(`/settings/audit-history${query ? `?${query}` : ''}`);
  },
};
