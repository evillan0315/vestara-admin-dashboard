/**
 * Dashboard Date Range Context
 *
 * Provides a globally-selected date range (start + end ISO timestamps) used by
 * the Dashboard to scope analytics, KPIs, and charts. The selection is
 * persisted to localStorage so it survives reloads and is shared across the
 * dashboard surface (header calendar launcher + dashboard page).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/** Maximum range length (days) accepted by the dashboard analytics. */
export const MAX_RANGE_DAYS = 180;

/** Default number of days covered by the initial range (today minus N days). */
export const DEFAULT_RANGE_DAYS = 14;

export interface DateRangeValue {
  /** Inclusive lower bound (ISO string, local midnight). */
  startDate: string;
  /** Inclusive upper bound (ISO string, local end-of-day). */
  endDate: string;
}

export interface DateRangeContextValue {
  /** Currently selected range. */
  range: DateRangeValue;
  /** Number of whole days covered by the range. */
  rangeDays: number;
  /** Human-readable label, e.g. "Jun 1 – Jun 18, 2026". */
  label: string;
  /** Replace the entire range. */
  setRange: (range: DateRangeValue) => void;
  /** Convenience setter from two `Date` objects (time ignored). */
  setRangeFromDates: (start: Date, end: Date) => void;
  /** Reset to the default trailing window. */
  resetRange: () => void;
}

const STORAGE_KEY = 'vestara-dashboard-date-range';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Build the default range: the last `DEFAULT_RANGE_DAYS` days ending today. */
function buildDefaultRange(): DateRangeValue {
  const end = endOfDay(new Date());
  const start = startOfDay(new Date());
  start.setDate(start.getDate() - (DEFAULT_RANGE_DAYS - 1));
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

function loadRange(): DateRangeValue {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<DateRangeValue>;
      if (parsed.startDate && parsed.endDate) {
        return {
          startDate: parsed.startDate,
          endDate: parsed.endDate,
        };
      }
    }
  } catch {
    // Corrupt storage — fall through to default.
  }
  return buildDefaultRange();
}

function persistRange(range: DateRangeValue): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(range));
  } catch {
    // Storage may be unavailable; non-fatal.
  }
}

/** Number of whole days between two ISO timestamps (minimum 1). */
function diffDays(startISO: string, endISO: string): number {
  const start = startOfDay(new Date(startISO)).getTime();
  const end = startOfDay(new Date(endISO)).getTime();
  const ms = end - start;
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Format a date as "Jun 18, 2026". */
function formatLong(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** Build a compact label spanning the range; collapses same-month/same-year. */
function buildLabel(range: DateRangeValue): string {
  const start = new Date(range.startDate);
  const end = new Date(range.endDate);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startStr = sameYear ? `${MONTHS[start.getMonth()]} ${start.getDate()}` : formatLong(start);
  return `${startStr} – ${formatLong(end)}`;
}

const DateRangeContext = createContext<DateRangeContextValue | undefined>(undefined);

interface DateRangeProviderProps {
  children: ReactNode;
}

export function DateRangeProvider({ children }: DateRangeProviderProps) {
  const [range, setRangeState] = useState<DateRangeValue>(() => loadRange());

  // Persist on change.
  useEffect(() => {
    persistRange(range);
  }, [range]);

  const setRange = useCallback((next: DateRangeValue) => {
    setRangeState(next);
  }, []);

  const setRangeFromDates = useCallback((start: Date, end: Date) => {
    const s = startOfDay(start);
    const e = endOfDay(end);
    // Ensure start <= end.
    const orderedStart = s <= e ? s : e;
    const orderedEnd = s <= e ? e : s;
    setRangeState({
      startDate: orderedStart.toISOString(),
      endDate: orderedEnd.toISOString(),
    });
  }, []);

  const resetRange = useCallback(() => {
    setRangeState(buildDefaultRange());
  }, []);

  const value = useMemo<DateRangeContextValue>(
    () => ({
      range,
      rangeDays: diffDays(range.startDate, range.endDate),
      label: buildLabel(range),
      setRange,
      setRangeFromDates,
      resetRange,
    }),
    [range, setRange, setRangeFromDates, resetRange],
  );

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}

/** Access the dashboard date range. Throws if used outside the provider. */
export function useDateRange(): DateRangeContextValue {
  const ctx = useContext(DateRangeContext);
  if (!ctx) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return ctx;
}
