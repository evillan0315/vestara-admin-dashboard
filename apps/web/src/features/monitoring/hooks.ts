import { useQuery } from '@tanstack/react-query';
import { monitoringApi, type SystemMetrics, type HealthDeep } from '../../api/monitoring';

/** Fetch system metrics (refreshes every 30 seconds). */
export function useSystemMetrics() {
  return useQuery<SystemMetrics>({
    queryKey: ['monitoring', 'metrics'],
    queryFn: async () => {
      const res = await monitoringApi.getMetrics();
      return res.data as SystemMetrics;
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

/** Fetch deep health status (refreshes every 15 seconds). */
export function useHealthStatus() {
  return useQuery<HealthDeep>({
    queryKey: ['monitoring', 'health'],
    queryFn: async () => {
      const res = await monitoringApi.getHealth();
      return res.data as HealthDeep;
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}
