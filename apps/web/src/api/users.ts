import apiClient from './client';
import type { UserDTO, CreateUserRequestDTO, UpdateUserRequestDTO } from '@vestara/types';
import type { PaginationMeta } from '@vestara/types';

export interface UserListParams {
  page?: number;
  perPage?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  isActive?: boolean;
  role?: string;
}

export interface UserListResponse {
  users: UserDTO[];
  pagination: PaginationMeta;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: { role: string; count: number }[];
}

export const usersApi = {
  list(params?: UserListParams) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.perPage) searchParams.set('perPage', String(params.perPage));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.order) searchParams.set('order', params.order);
    if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
    if (params?.role) searchParams.set('role', params.role);
    const qs = searchParams.toString();
    return apiClient.get<UserDTO[]>(`/users${qs ? `?${qs}` : ''}`);
  },

  getStats() {
    return apiClient.get<{ stats: UserStats }>('/users/stats');
  },

  getById(id: string) {
    return apiClient.get<{ user: UserDTO }>(`/users/${id}`);
  },

  create(data: CreateUserRequestDTO) {
    return apiClient.post<{ user: UserDTO }>('/users', data);
  },

  update(id: string, data: UpdateUserRequestDTO) {
    return apiClient.put<{ user: UserDTO }>(`/users/${id}`, data);
  },

  delete(id: string) {
    return apiClient.delete<void>(`/users/${id}`);
  },

  toggleStatus(id: string) {
    return apiClient.patch<{ user: UserDTO }>(`/users/${id}/status`);
  },

  bulkDelete(ids: string[]) {
    return apiClient.post<{ deleted: number }>('/users/bulk-delete', { ids });
  },

  bulkStatus(ids: string[], status: 'active' | 'inactive') {
    return apiClient.post<{ updated: number }>('/users/bulk-status', { ids, status });
  },
};
