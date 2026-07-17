import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { useWebSocketEvent } from '../../websocket/hooks';
import { auditLogsApi } from '../../api/audit-logs';
import { auditToNotification } from './auditToNotification';
import type { Notification } from '../../components/header/types';

const MAX_NOTIFICATIONS = 50;
const INITIAL_LIMIT = 12;
const INITIAL_QUERY_KEY = ['notifications', 'initial'] as const;

interface LiveNotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clear: () => void;
  refresh: () => void;
}

const LiveNotificationsContext = createContext<LiveNotificationsContextValue | undefined>(
  undefined,
);

function dedupeById(items: Notification[]): Notification[] {
  const seen = new Set<string>();
  return items.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });
}

export function LiveNotificationsProvider({ children }: { children: ReactNode }): ReactNode {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [live, setLive] = useState<Notification[]>([]);

  const initialQuery = useQuery({
    queryKey: INITIAL_QUERY_KEY,
    queryFn: async () => {
      const res = await auditLogsApi.list({
        perPage: INITIAL_LIMIT,
        sort: 'createdAt',
        order: 'desc',
      });
      return (res.data ?? []).map((log) => auditToNotification(log, false));
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  useWebSocketEvent('audit:created', (message) => {
    setLive((prev) => {
      const next = [auditToNotification(message.payload, true), ...prev];
      return dedupeById(next).slice(0, MAX_NOTIFICATIONS);
    });
  });

  const notifications = useMemo(
    () => dedupeById([...live, ...(initialQuery.data ?? [])]),
    [live, initialQuery.data],
  );

  const unreadCount = useMemo(() => live.filter((n) => n.unread).length, [live]);

  const markAllRead = useCallback(() => {
    setLive((prev) => prev.map((n) => (n.unread ? { ...n, unread: false } : n)));
  }, []);

  const markRead = useCallback((id: string) => {
    setLive((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  }, []);

  const clear = useCallback(() => setLive([]), []);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: INITIAL_QUERY_KEY });
  }, [queryClient]);

  const value = useMemo<LiveNotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      loading: initialQuery.isLoading,
      markAllRead,
      markRead,
      clear,
      refresh,
    }),
    [notifications, unreadCount, initialQuery.isLoading, markAllRead, markRead, clear, refresh],
  );

  return (
    <LiveNotificationsContext.Provider value={value}>{children}</LiveNotificationsContext.Provider>
  );
}

export function useLiveNotifications(): LiveNotificationsContextValue {
  const ctx = useContext(LiveNotificationsContext);
  if (!ctx) {
    throw new Error('useLiveNotifications must be used within a LiveNotificationsProvider');
  }
  return ctx;
}
