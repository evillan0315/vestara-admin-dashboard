/**
 * Socket.IO-based real-time types.
 *
 * The manager uses socket.io `Socket.data` to store per-connection context
 * (authenticated user + joined organization room).
 */
import type { Socket } from 'socket.io';

/** A live Socket.IO connection with attached auth context. */
export interface SocketConnection {
  socket: Socket;
  userId: string;
  organizationId: string;
  role: string;
  email: string | null;
  name: string | null;
}

/** Runtime health/telemetry snapshot. */
export interface WebSocketStats {
  startedAt: string | null;
  attached: boolean;
  activeConnections: number;
  totalConnections: number;
  totalMessages: number;
  byOrganization: Record<string, number>;
}
