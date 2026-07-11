import apiClient from './client';
import type { OrganizationDTO, CreateOrganizationRequestDTO, UpdateOrganizationRequestDTO } from '@vestara/types';

export const organizationsApi = {
  list() {
    return apiClient.get<{ organizations: OrganizationDTO[] }>('/organizations');
  },

  getById(id: string) {
    return apiClient.get<{ organization: OrganizationDTO }>(`/organizations/${id}`);
  },

  create(data: CreateOrganizationRequestDTO) {
    return apiClient.post<{ organization: OrganizationDTO }>('/organizations', data);
  },

  update(id: string, data: UpdateOrganizationRequestDTO) {
    return apiClient.put<{ organization: OrganizationDTO }>(`/organizations/${id}`, data);
  },
};