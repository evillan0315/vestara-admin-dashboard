import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../features/auth/AuthContext';
import {
  WS_EVENT,
  WS_ROOM,
  type ServerToClientMessage,
  type ClientToServerMessage,
  type WebSocketConnectionStatus,
} from '@vestara/types';
import { getWsCapability } from '../api/websocket';
import { WebSocketClient } from './WebSocketClient';

interface WebSocketContextValue {
  status: WebSocketConnectionStatus;
  /** Subscribe to a server event. Returns an unsubscribe function. */
  on: <T extends ServerToClientMessage['type']>(
    type: T,
    handler: (message: Extract<ServerToClientMessage, { type: T }>) => void,
  ) => () => void;
  send: (message: ClientToServerMessage) => void;
  subscribe: (room: string) => void;
  unsubscribe: (room: string) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

/**
 * Provides a single shared WebSocket connection for the app. Connects
 * automatically once the user is authenticated (using the current access
 * token from localStorage) and subscribes to the user's organization room.
 * Disconnects on logout. Degrades gracefully — the rest of the app keeps
 * working over REST if the connection cannot be established or if the
 * deployment does not support WebSockets (e.g. Vercel serverless).
 */
export function WebSocketProvider({ children }: { children: ReactNode }): ReactNode {
  const { isAuthenticated, user } = useAuth();
  const clientRef = useRef<WebSocketClient | null>(null);
  const [status, setStatus] = useState<WebSocketConnectionStatus>('disconnected');

  if (!clientRef.current) {
    clientRef.current = new WebSocketClient();
  }

  // Track connection status from the client.
  useEffect(() => {
    const client = clientRef.current!;
    const off = client.onStatus(setStatus);
    return off;
  }, []);

  // Connect / disconnect based on auth state.
  useEffect(() => {
    const client = clientRef.current!;
    const organizationId = user?.organizationId;

    if (!isAuthenticated || !organizationId) {
      client.disconnect();
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      client.disconnect();
      return;
    }

    let cancelled = false;
    let offConnection: (() => void) | undefined;

    void (async () => {
      // Probe whether this deployment actually serves WebSockets. On serverless
      // hosts (Vercel) the WS server is never attached, so we must NOT attempt
      // the upgrade handshake — it 404s at the edge and would be retried forever.
      const capability = await getWsCapability();
      if (cancelled) return;

      if (!capability.available) {
        setStatus('unavailable');
        return;
      }

      client.connect(token);

      // Once the connection is established, join the org room.
      offConnection = client.on(WS_EVENT.CONNECTION_ESTABLISHED, () => {
        client.subscribe(WS_ROOM.org(organizationId));
      });
    })();

    return () => {
      cancelled = true;
      offConnection?.();
      client.disconnect();
    };
  }, [isAuthenticated, user?.organizationId, user?.id]);

  // Stable action methods — they only reference `clientRef`, which never
  // changes, so event subscriptions don't churn on every status change.
  const actions = useMemo(
    () => ({
      on: <T extends ServerToClientMessage['type']>(
        type: T,
        handler: (message: Extract<ServerToClientMessage, { type: T }>) => void,
      ) => clientRef.current!.on(type, handler),
      send: (message: ClientToServerMessage) => clientRef.current!.send(message),
      subscribe: (room: string) => clientRef.current!.subscribe(room),
      unsubscribe: (room: string) => clientRef.current!.unsubscribe(room),
    }),
    [],
  );

  const value = useMemo<WebSocketContextValue>(() => ({ status, ...actions }), [status, actions]);

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export function useWebSocket(): WebSocketContextValue {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return ctx;
}
