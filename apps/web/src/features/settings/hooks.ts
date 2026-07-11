import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../../api/settings';
import type { UpdateSettingRequestDTO } from '@vestara/types';

export const settingKeys = {
  all: ['settings'] as const,
  list: () => ['settings', 'list'] as const,
  detail: (key: string) => ['settings', key] as const,
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
