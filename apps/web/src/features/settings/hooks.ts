import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../../api/settings';
import type { UpdateSettingRequestDTO } from '@vestara/types';

export const settingKeys = {
  all: ['settings'] as const,
  list: () => ['settings', 'list'] as const,
  detail: (key: string) => ['settings', key] as const,
  auditHistory: (params?: Record<string, unknown>) => ['settings', 'audit-history', params] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingKeys.list(),
    queryFn: () => settingsApi.list(),
  });
}

export function useSetting(key: string) {
  return useQuery({
    queryKey: settingKeys.detail(key),
    queryFn: () => settingsApi.getByKey(key),
    enabled: !!key,
  });
}

export function useUpsertSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSettingRequestDTO) => settingsApi.upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingKeys.all });
    },
  });
}

export function useDeleteSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => settingsApi.delete(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingKeys.all });
    },
  });
}

export function useExportSettings() {
  return useMutation({
    mutationFn: async () => {
      const data = await settingsApi.exportSettings();
      // Handle blob download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vestara-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return data;
    },
  });
}

export function useImportSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: Record<string, unknown>) => settingsApi.importSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingKeys.all });
    },
  });
}

export function useSettingsAuditHistory(params?: {
  page?: number;
  perPage?: number;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: settingKeys.auditHistory(params),
    queryFn: () => settingsApi.getAuditHistory(params),
  });
}
