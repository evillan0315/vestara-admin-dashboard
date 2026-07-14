import { apiClient } from './client';
import type {
  CreateDataSourceRequestDTO,
  DataSourceDTO,
  DataSourceFetchResultDTO,
  DataSourceAnalysisDTO,
  UpdateDataSourceRequestDTO,
} from '@vestara/types';

export const agentApi = {
  list: () => apiClient.get<DataSourceDTO[]>('/integrations/data-sources'),
  get: (id: string) => apiClient.get<DataSourceDTO>(`/integrations/data-sources/${id}`),
  create: (data: CreateDataSourceRequestDTO) =>
    apiClient.post<DataSourceDTO>('/integrations/data-sources', data),
  update: (id: string, data: UpdateDataSourceRequestDTO) =>
    apiClient.put<DataSourceDTO>(`/integrations/data-sources/${id}`, data),
  delete: (id: string) => apiClient.delete(`/integrations/data-sources/${id}`),
  fetch: (id: string) =>
    apiClient.post<DataSourceFetchResultDTO>(`/integrations/data-sources/${id}/fetch`),
  result: (id: string) => apiClient.get<DataSourceAnalysisDTO | null>(`/integrations/data-sources/${id}/result`),
};

export default agentApi;
