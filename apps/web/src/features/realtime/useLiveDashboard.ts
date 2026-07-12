import { useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocketEvent } from '../../websocket/hooks';

const THROTTLE_MS = 1500;

/**
 * Keeps admin dashboard data fresh by invalidating the underlying query keys
 * whenever an org-scoped audit event arrives over the WebSocket. Updates are
 * throttled so a burst of events triggers a single refresh.
 *
 * Invalidating `['audit-logs']` also refreshes the date-range queries used by
 * the dashboard charts (their keys are prefixed with `['audit-logs']`).
 */
export function useLiveDashboard() {
  const queryClient = useQueryClient();
  const lastRef = useRef(0);

  useWebSocketEvent('audit:created', () => {
    const now = Date.now();
    if (now - lastRef.current < THROTTLE_MS) return;
    lastRef.current = now;

    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['settings'] });
  });
}
