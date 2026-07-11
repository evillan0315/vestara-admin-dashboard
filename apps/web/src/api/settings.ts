import apiClient from './client';
import type { SystemSettingDTO, UpdateSettingRequestDTO } from '@vestara/types';

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
};
