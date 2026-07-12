/**
 * Browser-side Socket.IO client for real-time features.
 *
 * Thin wrapper around `socket.io-client` that preserves the previous public
 * API (`on`, `onStatus`, `connect`, `disconnect`, `send`, `subscribe`,
 * `unsubscribe`) so the React `WebSocketProvider` and hooks require no changes.
 *
 * Vercel-compatible: the client forces the `websocket` transport and connects to
 * the Socket.IO mount path under the API prefix. Reconnection with exponential
 * backoff + jitter is handled by socket.io-client itself.
 */
import { io, type Socket } from 'socket.io-client';

import {
  WS_EVENT,
  type ServerToClientMessage,
  type ClientToServerMessage,
  type WsEventType,
  type WebSocketConnectionStatus,
} from '@vestara/types';

/** Socket.IO mount path on the API server. */
export const SOCKET_IO_PATH = '/socket.io';

/** Set of valid server→client event names (values of WS_EVENT). */
const ALLOWED_EVENTS = new Set(Object.values(WS_EVENT));

/** Resolve the Socket.IO connection origin from the configured API base URL. */
function resolveSocketIoOrigin(): string {
  const base = import.meta.env.VITE_API_URL || '/api/v1';
  if (base.startsWith('http')) {
    try {
      return new URL(base).origin;
    } catch {
      // fall through
    }
  }
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:5173';
}

export class WebSocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;
  private intentionalClose = false;
  private reconnectAttempts = 0;

  private messageHandlers = new Map<WsEventType, Set<(msg: ServerToClientMessage) => void>>();
  private statusHandlers = new Set<(status: WebSocketConnectionStatus) => void>();

  /** Register a handler for a specific server-to-client event. */
  on<T extends WsEventType>(
    type: T,
    handler: (msg: Extract<ServerToClientMessage, { type: T }>) => void,
  ): () => void {
    let set = this.messageHandlers.get(type);
    if (!set) {
      set = new Set();
      this.messageHandlers.set(type, set);
    }
    const genericHandler = handler as (msg: ServerToClientMessage) => void;
    set.add(genericHandler);
    return () => set!.delete(genericHandler);
  }

  /** Register a handler for connection-status changes. Returns an unsubscribe. */
  onStatus(handler: (status: WebSocketConnectionStatus) => void): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  /** Open the Socket.IO connection using a JWT access token. */
  connect(token: string): void {
    if (typeof window === 'undefined') return;
    if (this.socket?.connected) return;

    this.token = token;
    this.intentionalClose = false;
    const origin = resolveSocketIoOrigin();

    this.socket = io(origin, {
      path: SOCKET_IO_PATH,
      // Vercel (and most serverless WS platforms) only support the websocket
      // transport; forcing it avoids the polling handshake entirely.
      transports: ['websocket'],
      auth: { token },
      query: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15_000,
      randomizationFactor: 0.5,
      timeout: 20_000,
    });

    this.registerSocketHandlers();
    this.setStatus('connecting');
  }

  private registerSocketHandlers(): void {
    const socket = this.socket;
    if (!socket) return;

    // Dispatch every known server event to registered type handlers.
    socket.onAny((event, ...args) => {
      if (!ALLOWED_EVENTS.has(event)) return;
      const payload = args[0];
      const handler = this.messageHandlers.get(event as WsEventType);
      if (handler) {
        const message = { type: event, payload } as ServerToClientMessage;
        handler.forEach((h) => h(message));
      }
    });

    socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.setStatus('connected');
    });

    socket.on('disconnect', () => {
      if (this.intentionalClose) {
        this.setStatus('disconnected');
      } else {
        this.setStatus('reconnecting');
      }
    });

    socket.on('connect_error', () => {
      this.setStatus('error');
    });

    socket.io.on('reconnect_attempt', () => {
      this.reconnectAttempts += 1;
      this.setStatus('reconnecting');
    });

    socket.io.on('reconnect', () => {
      this.reconnectAttempts = 0;
      this.setStatus('connected');
    });

    socket.io.on('reconnect_failed', () => {
      this.setStatus('error');
    });
  }

  /** Send a client-to-server message. */
  send(message: ClientToServerMessage): void {
    this.socket?.emit(message.type, message.payload);
  }

  /** Join an org-scoped room to receive broadcasts. */
  subscribe(room: string): void {
    this.socket?.emit(WS_EVENT.SUBSCRIBE, { room });
  }

  /** Leave a room. */
  unsubscribe(room: string): void {
    this.socket?.emit(WS_EVENT.UNSUBSCRIBE, { room });
  }

  /** Close the connection (considered intentional). */
  disconnect(): void {
    this.intentionalClose = true;
    this.socket?.disconnect();
    this.socket = null;
    this.setStatus('disconnected');
  }

  private setStatus(status: WebSocketConnectionStatus): void {
    this.statusHandlers.forEach((h) => h(status));
  }
}

export default WebSocketClient;
