import { useEffect, useRef } from 'react';
import type { ServerToClientMessage } from '@vestara/types';
import { useWebSocket } from './WebSocketProvider';

/**
 * Current WebSocket connection status.
 */
export function useConnectionStatus(): ReturnType<typeof useWebSocket>['status'] {
  return useWebSocket().status;
}

/**
 * Subscribe to a specific server event for the lifetime of the component.
 * The latest `handler` is always invoked without re-subscribing on every render.
 */
export function useWebSocketEvent<T extends ServerToClientMessage['type']>(
  type: T,
  handler: (message: Extract<ServerToClientMessage, { type: T }>) => void,
): void {
  const { on } = useWebSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const off = on(type, (message) => handlerRef.current(message));
    return off;
  }, [on, type]);
}
