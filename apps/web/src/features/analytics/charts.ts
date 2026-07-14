import { useMemo } from 'react';
import { AuditAction, EntityType, type AuditLogDTO } from '@vestara/types';
import { ACTION_LABELS, ENTITY_LABELS } from './constants';

export interface DailySeries {
  labels: string[];
  values: number[];
}

export interface DistributionEntry {
  label: string;
  value: number;
}

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildDailySeries(
  logs: AuditLogDTO[],
  rangeDays: number,
  endDate: string,
): DailySeries {
  const labels: string[] = [];
  const buckets: number[] = [];
  const indexByDay = new Map<string, number>();

  for (let i = rangeDays - 1; i >= 0; i -= 1) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    indexByDay.set(dayKey(d), buckets.length);
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
    buckets.push(0);
  }

  for (const log of logs) {
    const idx = indexByDay.get(dayKey(new Date(log.createdAt)));
    if (idx !== undefined) buckets[idx] += 1;
  }

  return { labels, values: buckets };
}

export function buildDistribution<T extends string>(
  logs: AuditLogDTO[],
  pick: (log: AuditLogDTO) => T,
  label: (key: T) => string,
  limit?: number,
): DistributionEntry[] {
  const counts = new Map<T, number>();
  for (const log of logs) {
    const key = pick(log);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const entries = [...counts.entries()]
    .map(([key, value]) => ({ label: label(key), value }))
    .sort((a, b) => b.value - a.value);
  return limit ? entries.slice(0, limit) : entries;
}

export function useDailySeries(logs: AuditLogDTO[], rangeDays: number, endDate: string): DailySeries {
  return useMemo(() => buildDailySeries(logs, rangeDays, endDate), [logs, rangeDays, endDate]);
}

export function useDistribution(
  logs: AuditLogDTO[],
  pick: (log: AuditLogDTO) => AuditAction | EntityType,
  label: (key: string) => string,
  limit?: number,
): DistributionEntry[] {
  return useMemo(() => buildDistribution(logs, pick, label, limit), [logs, pick, label, limit]);
}

export const actionLabelLookup = (key: string): string =>
  ACTION_LABELS[key as AuditAction] ?? key;

export const entityLabelLookup = (key: string): string =>
  ENTITY_LABELS[key as EntityType] ?? key;
