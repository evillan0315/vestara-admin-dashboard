import {
  WS_EVENT,
  type ServerToClientMessage,
  type ClientToServerMessage,
  type WebSocketConnectionStatus,
} from '@vestara/types';

const ACCESS_TOKEN_KEY = 'accessToken';
const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;
const HEARTBEAT_INTERVAL_MS = 25_000;

type MessageHandler<T extends ServerToClientMessage['type']> = (
  message: Extract<ServerToClientMessage, { type: T }>,
) => void;
type StatusHandler = (status: WebSocketConnectionStatus) => void;

/**
 * Build the absolute WebSocket URL from the configured API base.
 * Supports both absolute (http/https) and relative (`/api/v1`) bases, and
 * upgrades the scheme to `ws`/`wss` accordingly.
 */
function resolveWsUrl(): string {
  const base = import.meta.env.VITE_API_URL || '/api/v1';
  const absolute = base.startsWith('http') ? base : `${window.location.origin}${base}`;
  const wsBase = absolute.replace(/^http/, 'ws');
  return `${wsBase.replace(/\/$/, '')}/ws`;
}

/**
 * Browser WebSocket client with:
 *  - JWT auth via query param
 *  - automatic reconnection with exponential backoff + jitter
 *  - application-level heartbeat (ping/pong)
 *  - typed publish/subscribe over a single connection
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private intentionalClose = false;
  private readonly messageHandlers = new Map<string, Set<(message: ServerToClientMessage) => void>>();
  private readonly statusHandlers = new Set<StatusHandler>();
  private status: WebSocketConnectionStatus = 'disconnected';

  constructor() {
    this.url = resolveWsUrl();
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    handler(this.status);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  on<T extends ServerToClientMessage['type']>(
    type: T,
    handler: MessageHandler<T>,
  ): () => void {
    let set = this.messageHandlers.get(type);
    if (!set) {
      set = new Set();
      this.messageHandlers.set(type, set);
    }
    const wrapped = handler as (message: ServerToClientMessage) => void;
    set.add(wrapped);
    return () => {
      this.messageHandlers.get(type)?.delete(wrapped);
    };
  }

  connect(token: string): void {
    this.token = token;
    this.intentionalClose = false;
    this.open();
  }

  private open(): void {
    if (typeof window === 'undefined') return;
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const token = this.token ?? localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      this.setStatus('disconnected');
      return;
    }

    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    let ws: WebSocket;
    try {
      ws = new WebSocket(`${this.url}?token=${encodeURIComponent(token)}`);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setStatus('connected');
      this.startHeartbeat();
    };

    ws.onmessage = (event) => {
      let message: ServerToClientMessage;
      try {
        message = JSON.parse(event.data as string) as ServerToClientMessage;
      } catch {
        return; // Ignore malformed frames.
      }
      this.dispatch(message);
    };

    ws.onclose = (event) => {
      this.stopHeartbeat();
      if (this.intentionalClose || event.code === 1000) {
        this.setStatus('disconnected');
        return;
      }
      this.setStatus('error');
      this.scheduleReconnect();
    };

    ws.onerror = () => {
      // Reconnection is handled by the `onclose` handler.
      this.setStatus('error');
    };
  }

  private dispatch(message: ServerToClientMessage): void {
    const set = this.messageHandlers.get(message.type);
    if (!set) return;
    for (const handler of set) handler(message);
  }

  private setStatus(status: WebSocketConnectionStatus): void {
    this.status = status;
    for (const handler of this.statusHandlers) handler(status);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: WS_EVENT.PING, payload: { timestamp: Date.now() } });
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    const delay =
      Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** this.reconnectAttempts) +
      Math.floor(Math.random() * 500);
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.open();
    }, delay);
  }

  send(message: ClientToServerMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  subscribe(room: string): void {
    this.send({ type: WS_EVENT.SUBSCRIBE, payload: { room } });
  }

  unsubscribe(room: string): void {
    this.send({ type: WS_EVENT.UNSUBSCRIBE, payload: { room } });
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      try {
        this.ws.close(1000, 'Client disconnected');
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.setStatus('disconnected');
  }
}
