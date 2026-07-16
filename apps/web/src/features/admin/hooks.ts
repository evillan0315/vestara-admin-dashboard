import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { useOrganizations } from '../organizations/hooks';
import { useFileStats } from '../files/hooks';
import { useUsers } from '../users/hooks';

export function useHealth() {
  return useQuery({
    queryKey: ['admin', 'health'],
    queryFn: async () => {
      const res = await adminApi.getHealth();
      return res.data;
    },
    refetchInterval: 30_000,
  });
}

export function useWsStatus() {
  return useQuery({
    queryKey: ['admin', 'ws-status'],
    queryFn: async () => {
      const res = await adminApi.getWsStatus();
      return res.data;
    },
    refetchInterval: 15_000,
  });
}

export function useAdminOverview() {
  const orgs = useOrganizations();
  const files = useFileStats();
  const users = useUsers({ perPage: 1 });

  return {
    organizations: orgs.data?.length ?? 0,
    files: files.data?.totalFiles ?? 0,
    users: users.data?.meta?.total ?? 0,
    loading: orgs.isLoading || files.isLoading || users.isLoading,
  };
}
