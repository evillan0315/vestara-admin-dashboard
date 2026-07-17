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
  /** Top users by activity count */
  byUser: DistributionEntry[];
  total: number;
  loading: boolean;
}

/**
 * Aggregates audit logs within a window into the daily time-series,
 * action/entity distributions, and top-user distribution.
 */
export function useAuditActivity(
  startDate: string,
  endDate: string,
  rangeDays: number,
): AuditActivity {
  const query = useAuditLogsRange(startDate, endDate);
  const logs = query.data ?? [];

  const daily = useMemo(
    () => buildDailySeries(logs, rangeDays, endDate),
    [logs, rangeDays, endDate],
  );
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
  const byUser = useMemo(
    () =>
      buildDistribution(
        logs,
        (l) => l.userName || 'System',
        (k) => k,
        8,
      ),
    [logs],
  );

  return {
    logs,
    daily,
    byAction,
    byEntity,
    byUser,
    total: logs.length,
    loading: query.isLoading,
  };
}

// ── Dual-Period Hooks ─────────────────────────────

export interface DualAuditSeries {
  /** Current period daily series */
  current: DailySeries;
  /** Previous period daily series */
  previous: DailySeries;
  /** Loading state (true while either is loading) */
  loading: boolean;
}

/**
 * Fetches audit logs for both the current and previous equal-length windows,
 * returning two daily series suitable for overlay comparison charts.
 */
export function useDualAuditActivity(
  startDate: string,
  endDate: string,
  rangeDays: number,
): DualAuditSeries {
  const currentQuery = useAuditLogsRange(startDate, endDate);
  const prevRange = useMemo(() => getPreviousRange(rangeDays, endDate), [rangeDays, endDate]);
  const previousQuery = useAuditLogsRange(prevRange.startDate, prevRange.endDate);

  const currentLogs = currentQuery.data ?? [];
  const previousLogs = previousQuery.data ?? [];

  const current = useMemo(
    () => buildDailySeries(currentLogs, rangeDays, endDate),
    [currentLogs, rangeDays, endDate],
  );
  const previous = useMemo(
    () => buildDailySeries(previousLogs, rangeDays, prevRange.endDate),
    [previousLogs, rangeDays, prevRange.endDate],
  );

  return {
    current,
    previous,
    loading: currentQuery.isLoading || previousQuery.isLoading,
  };
}
