import { useQuery } from '@tanstack/react-query';
import { auditLogsApi, type AuditLogListParams } from '../../api/audit-logs';

export const auditLogKeys = {
  all: ['audit-logs'] as const,
  list: (params?: AuditLogListParams) => ['audit-logs', 'list', params] as const,
  detail: (id: string) => ['audit-logs', id] as const,
};

export function useAuditLogs(params?: AuditLogListParams) {
  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: () => auditLogsApi.list(params),
  });
}

export function useAuditLog(id: string) {
  return useQuery({
    queryKey: auditLogKeys.detail(id),
    queryFn: () => auditLogsApi.getById(id),
    enabled: !!id,
  });
}
