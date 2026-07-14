import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from '../../api/audit-logs';
import { useAuditLogsRange } from '../audit-logs/hooks';
import type { AuditLogDTO } from '@vestara/types';
import {
  buildDailySeries,
  buildDistribution,
  type DailySeries,
  type DistributionEntry,
} from './charts';
import { ACTION_LABELS, ENTITY_LABELS } from './constants';

export interface RangeDates {
  startDate: string;
  endDate: string;
}

/** Returns the previous equal-length window immediately before `endDate`. */
export function getPreviousRange(rangeDays: number, endDate: string): RangeDates {
  const prevEnd = new Date(endDate);
  prevEnd.setDate(prevEnd.getDate() - rangeDays);
  const prevStart = new Date(endDate);
  prevStart.setDate(prevStart.getDate() - rangeDays * 2);
  prevStart.setHours(0, 0, 0, 0);
  prevEnd.setHours(23, 59, 59, 999);
  return { startDate: prevStart.toISOString(), endDate: prevEnd.toISOString() };
}

/** Lightweight count of audit events in a window (reads `meta.total`, no full fetch). */
export function useAuditCount(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['audit-logs', 'count', startDate, endDate],
    queryFn: async () => {
      const res = await auditLogsApi.list({
        startDate,
        endDate,
        page: 1,
        perPage: 1,
      });
      return res.meta?.total ?? 0;
    },
    enabled: !!startDate && !!endDate,
  });
}

export interface AuditActivity {
  logs: AuditLogDTO[];
  daily: DailySeries;
  byAction: DistributionEntry[];
  byEntity: DistributionEntry[];
  total: number;
  loading: boolean;
}

/**
 * Aggregates audit logs within a window into the daily time-series and
 * action/entity distributions used by the dashboard and analytics charts.
 */
export function useAuditActivity(startDate: string, endDate: string, rangeDays: number): AuditActivity {
  const query = useAuditLogsRange(startDate, endDate);
  const logs = query.data ?? [];

  const daily = useMemo(() => buildDailySeries(logs, rangeDays, endDate), [logs, rangeDays, endDate]);
  const byAction = useMemo(
    () =>
      buildDistribution(
        logs,
        (l) => l.action,
        (k) => ACTION_LABELS[k as keyof typeof ACTION_LABELS] ?? k,
        6,
      ),
    [logs],
  );
  const byEntity = useMemo(
    () =>
      buildDistribution(
        logs,
        (l) => l.entity,
        (k) => ENTITY_LABELS[k as keyof typeof ENTITY_LABELS] ?? k,
      ),
    [logs],
  );

  return {
    logs,
    daily,
    byAction,
    byEntity,
    total: logs.length,
    loading: query.isLoading,
  };
}
