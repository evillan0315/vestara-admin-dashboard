import { useQuery } from '@tanstack/react-query';
import { auditLogsApi, type AuditLogListParams } from '../../api/audit-logs';
import type { AuditLogDTO } from '@vestara/types';

export const auditLogKeys = {
  all: ['audit-logs'] as const,
  list: (params?: AuditLogListParams) => ['audit-logs', 'list', params] as const,
  range: (startDate: string, endDate: string) =>
    ['audit-logs', 'range', startDate, endDate] as const,
  detail: (id: string) => ['audit-logs', id] as const,
};

export function useAuditLogs(params?: AuditLogListParams) {
  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: () => auditLogsApi.list(params),
  });
}

/**
 * Fetch every audit log within a date window by paginating through all pages
 * (the API caps `perPage` at 100). Used by the dashboard analytics charts to
 * build time-series and distribution aggregations on the client.
 */
export function useAuditLogsRange(startDate: string, endDate: string, maxPages = 10) {
  return useQuery({
    queryKey: auditLogKeys.range(startDate, endDate),
    queryFn: async (): Promise<AuditLogDTO[]> => {
      const perPage = 100;
      const all: AuditLogDTO[] = [];
      for (let page = 1; page <= maxPages; page += 1) {
        const res = await auditLogsApi.list({
          startDate,
          endDate,
          page,
          perPage,
          sort: 'createdAt',
          order: 'asc',
        });
        const items = res.data ?? [];
        all.push(...items);
        const total = res.meta?.total ?? 0;
        if (items.length === 0 || all.length >= total) break;
      }
      return all;
    },
  });
}

export function useAuditLog(id: string) {
  return useQuery({
    queryKey: auditLogKeys.detail(id),
    queryFn: () => auditLogsApi.getById(id),
    enabled: !!id,
  });
}

