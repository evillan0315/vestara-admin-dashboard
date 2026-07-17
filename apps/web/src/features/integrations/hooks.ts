import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agentApi } from '../../api/agent';
import type { CreateDataSourceRequestDTO, UpdateDataSourceRequestDTO } from '@vestara/types';

export const integrationsKeys = {
  all: ['integrations'] as const,
  list: () => [...integrationsKeys.all, 'list'] as const,
  detail: (id: string) => [...integrationsKeys.all, 'detail', id] as const,
  result: (id: string) => [...integrationsKeys.all, 'result', id] as const,
};

export function useDataSources() {
  return useQuery({
    queryKey: integrationsKeys.list(),
    queryFn: () => agentApi.list().then((r) => r.data ?? []),
  });
}

export function useDataSourceResult(id: string | undefined) {
  return useQuery({
    queryKey: integrationsKeys.result(id ?? ''),
    queryFn: () => agentApi.result(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateDataSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDataSourceRequestDTO) => agentApi.create(data).then((r) => r.data!),
    onSuccess: () => qc.invalidateQueries({ queryKey: integrationsKeys.list() }),
  });
}

export function useUpdateDataSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDataSourceRequestDTO }) =>
      agentApi.update(id, data).then((r) => r.data!),
    onSuccess: () => qc.invalidateQueries({ queryKey: integrationsKeys.list() }),
  });
}

export function useDeleteDataSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agentApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: integrationsKeys.list() }),
  });
}

export function useFetchDataSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agentApi.fetch(id).then((r) => r.data!),
    onSuccess: (data) =>
      qc.invalidateQueries({ queryKey: integrationsKeys.result(data.dataSourceId) }),
  });
}
