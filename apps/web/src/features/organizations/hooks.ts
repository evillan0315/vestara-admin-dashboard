import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '../../api/organizations';
import type { CreateOrganizationInput, UpdateOrganizationInput } from '@vestara/validation';

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await organizationsApi.list();
      return res.data?.organizations ?? [];
    },
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: ['organizations', id],
    queryFn: async () => {
      const res = await organizationsApi.getById(id);
      return res.data?.organization;
    },
    enabled: !!id,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOrganizationInput) => {
      const res = await organizationsApi.create(data);
      return res.data!.organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & UpdateOrganizationInput) => {
      const res = await organizationsApi.update(id, data);
      return res.data!.organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}
