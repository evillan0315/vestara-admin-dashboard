import type { WebSocket } from 'ws';
import type { UserRole } from '@vestara/types';

/**
 * Represents a single authenticated WebSocket connection.
 */
export interface ClientConnection {
  id: string;
  socket: WebSocket;
  userId: string;
  organizationId: string;
  name: string;
  email: string;
  role: UserRole;
  /** Rooms the client is subscribed to (e.g. `org:<organizationId>`). */
  rooms: Set<string>;
  /** Liveness flag used by the heartbeat probe. */
  isAlive: boolean;
  connectedAt: number;
}

/**
 * Aggregate runtime statistics for health monitoring.
 */
export interface WebSocketStats {
  startedAt: number | null;
  uptimeSeconds: number;
  totalConnections: number;
  activeConnections: number;
  messagesReceived: number;
  messagesSent: number;
  errorsTotal: number;
  reconnectsTotal: number;
  byOrganization: Record<string, number>;
}
