import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, type UserListParams } from '../../api/users';
import type { CreateUserRequestDTO, UpdateUserRequestDTO, UserDTO } from '@vestara/types';

export const userKeys = {
  all: ['users'] as const,
  list: (params?: UserListParams) => ['users', 'list', params] as const,
  detail: (id: string) => ['users', id] as const,
  stats: ['users', 'stats'] as const,
};

export function useUsers(params?: UserListParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.list(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: userKeys.stats,
    queryFn: () => usersApi.getStats(),
    select: (data) => data.data?.stats,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserRequestDTO) => usersApi.create(data),
    onMutate: async (newUser) => {
      await queryClient.cancelQueries({ queryKey: userKeys.all });
      const previousUsers = queryClient.getQueriesData({ queryKey: userKeys.all });
      queryClient.setQueriesData(
        { queryKey: userKeys.list() },
        (old: { data?: UserDTO[]; meta?: { total: number } } | undefined) => {
          if (!old || !old.data) return old;
          const optimisticUser: UserDTO = {
            id: `temp-${Date.now()}`,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
            isActive: true,
            organizationId: newUser.organizationId ?? '',
            avatarUrl: undefined,
            provider: undefined,
            providerId: undefined,
            lastLoginAt: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            ...old,
            data: [optimisticUser, ...old.data],
            meta: old.meta ? { ...old.meta, total: old.meta.total + 1 } : undefined,
          };
        }
      );
      return { previousUsers };
    },
    onError: (_err, _newUser, context) => {
      context?.previousUsers?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequestDTO }) =>
      usersApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: userKeys.all });
      const previousUsers = queryClient.getQueriesData({ queryKey: userKeys.all });
      queryClient.setQueriesData(
        { queryKey: userKeys.list() },
        (old: { data?: UserDTO[] } | undefined) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.map((user) =>
              user.id === id ? { ...user, ...data, updatedAt: new Date().toISOString() } : user
            ),
          };
        }
      );
      return { previousUsers };
    },
    onError: (_err, _variables, context) => {
      context?.previousUsers?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: userKeys.all });
      const previousUsers = queryClient.getQueriesData({ queryKey: userKeys.all });
      queryClient.setQueriesData(
        { queryKey: userKeys.list() },
        (old: { data?: UserDTO[]; meta?: { total: number } } | undefined) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.filter((user) => user.id !== id),
            meta: old.meta ? { ...old.meta, total: old.meta.total - 1 } : undefined,
          };
        }
      );
      return { previousUsers };
    },
    onError: (_err, _id, context) => {
      context?.previousUsers?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.toggleStatus(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: userKeys.all });
      const previousUsers = queryClient.getQueriesData({ queryKey: userKeys.all });
      queryClient.setQueriesData(
        { queryKey: userKeys.list() },
        (old: { data?: UserDTO[] } | undefined) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.map((user) =>
              user.id === id ? { ...user, isActive: !user.isActive, updatedAt: new Date().toISOString() } : user
            ),
          };
        }
      );
      return { previousUsers };
    },
    onError: (_err, _id, context) => {
      context?.previousUsers?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useBulkDeleteUsers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => usersApi.bulkDelete(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: userKeys.all });
      const previousUsers = queryClient.getQueriesData({ queryKey: userKeys.all });
      queryClient.setQueriesData(
        { queryKey: userKeys.list() },
        (old: { data?: UserDTO[]; meta?: { total: number } } | undefined) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.filter((user) => !ids.includes(user.id)),
            meta: old.meta ? { ...old.meta, total: old.meta.total - ids.length } : undefined,
          };
        }
      );
      return { previousUsers };
    },
    onError: (_err, _ids, context) => {
      context?.previousUsers?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useBulkUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 'active' | 'inactive' }) =>
      usersApi.bulkStatus(ids, status),
    onMutate: async ({ ids, status }) => {
      await queryClient.cancelQueries({ queryKey: userKeys.all });
      const previousUsers = queryClient.getQueriesData({ queryKey: userKeys.all });
      const newIsActive = status === 'active';
      queryClient.setQueriesData(
        { queryKey: userKeys.list() },
        (old: { data?: UserDTO[] } | undefined) => {
          if (!old || !old.data) return old;
          return {
            ...old,
            data: old.data.map((user) =>
              ids.includes(user.id) ? { ...user, isActive: newIsActive, updatedAt: new Date().toISOString() } : user
            ),
          };
        }
      );
      return { previousUsers };
    },
    onError: (_err, _variables, context) => {
      context?.previousUsers?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}