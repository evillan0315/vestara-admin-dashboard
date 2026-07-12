/**
 * Socket.IO real-time manager.
 *
 * Replaces the previous native `ws` implementation so that live features
 * (notifications, presence, dashboard refresh) work when the API is hosted on
 * Vercel — Vercel supports WebSockets (public beta) for Socket.IO when the
 * client forces `transports: ['websocket']` and broadcasts use the Redis
 * adapter (required for cross-instance delivery on serverless hosts).
 *
 * The application-level protocol is unchanged from the previous implementation
 * (`connection:established`, `presence:update`, `audit:created`, `notification`)
 * so the frontend feature modules keep working without modification.
 */
import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

import { JwtService } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import { userRepository } from '../repositories/index.js';
import {
  WS_EVENT,
  WS_ROOM,
  type UserRole,
  type WsPresencePayload,
  type WsPresenceUser,
  type WsNotificationPayload,
  type AuditLogDTO,
} from '@vestara/types';
import type { SocketConnection, WebSocketStats } from './types.js';

/** socket.io server path, mounted at the function root (Vercel catch-all rewrite). */
export const SOCKET_IO_PATH = '/socket.io';

interface ClientToServerEvents {
  subscribe: (payload: { room: string }) => void;
  unsubscribe: (payload: { room: string }) => void;
  ping: (payload: { timestamp: number }) => void;
}

interface ServerToClientEvents {
  [event: string]: (...args: unknown[]) => void;
}

class SocketIoManager {
  private io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;
  private attached = false;
  private startedAt: string | null = null;

  private connections = new Set<SocketConnection>();

  // Local presence index (userId -> presence) per organization.
  private presenceByOrg = new Map<string, Map<string, WsPresenceUser>>();

  get isAttached(): boolean {
    return this.attached;
  }

  /** Attach the Socket.IO server to an existing HTTP server. Idempotent. */
  attach(httpServer: HttpServer): void {
    if (this.attached) return;
    this.attached = true;
    this.startedAt = new Date().toISOString();

    // socket.io's `cors.origin` must follow the engine.io `(origin, callback)`
    // contract — returning a boolean is ignored and the handshake hangs.
    const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void => {
      if (!origin) return callback(null, true);
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      const allowed = (process.env.CORS_ORIGIN ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
      callback(null, allowed.includes(origin));
    };

    const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
      path: SOCKET_IO_PATH,
      cors: {
        origin: corsOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
      },
      pingInterval: 25_000,
      pingTimeout: 10_000,
    });

    void this.attachRedisAdapter(io).catch((err) =>
      logger.warn({ err: (err as Error).message }, '[socket.io] Redis adapter disabled'),
    );

    io.on('connection', (socket) => void this.handleConnection(socket));
    this.io = io;

    logger.info({ path: SOCKET_IO_PATH }, '[socket.io] attached');
  }

  /** Lazily wire the Redis adapter for cross-instance broadcasts. */
  private async attachRedisAdapter(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
  ): Promise<void> {
    const url = process.env.REDIS_URL;
    if (!url) {
      logger.warn('[socket.io] REDIS_URL not set; using in-memory adapter');
      return;
    }
    const pubClient = new Redis(url);
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient, subClient].map((c) => c.ping()));
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('[socket.io] Redis adapter enabled');
  }

  private async handleConnection(socket: SocketConnection['socket']): Promise<void> {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.query?.token as string | undefined);

    if (!token) {
      socket.emit(WS_EVENT.ERROR, { message: 'Authentication required' });
      socket.disconnect(true);
      return;
    }

    const decoded = JwtService.validateAccessToken(token);
    if (!decoded) {
      socket.emit(WS_EVENT.ERROR, { message: 'Invalid or expired token' });
      socket.disconnect(true);
      return;
    }

    const user = await userRepository.findById(decoded.id);
    if (!user || !user.isActive) {
      socket.emit(WS_EVENT.ERROR, { message: 'User not authorized' });
      socket.disconnect(true);
      return;
    }

    const conn: SocketConnection = {
      socket,
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role as UserRole,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
    };
    this.connections.add(conn);

    // Auto-subscribe to the organization room for org-scoped broadcasts.
    socket.join(WS_ROOM.org(conn.organizationId));
    this.addPresence(conn);
    this.broadcastPresence(conn.organizationId);

    socket.emit(WS_EVENT.CONNECTION_ESTABLISHED, {
      clientId: socket.id,
      userId: conn.userId,
      organizationId: conn.organizationId,
    });

    socket.on('subscribe', ({ room }) => {
      if (typeof room === 'string') socket.join(room);
    });
    socket.on('unsubscribe', ({ room }) => {
      if (typeof room === 'string') socket.leave(room);
    });
    socket.on('ping', (payload) => {
      socket.emit(WS_EVENT.PONG, {
        timestamp: payload?.timestamp ?? Date.now(),
      });
    });

    socket.on('disconnect', () => {
      this.connections.delete(conn);
      this.removePresence(conn);
      this.broadcastPresence(conn.organizationId);
    });
  }

  private addPresence(conn: SocketConnection): void {
    let org = this.presenceByOrg.get(conn.organizationId);
    if (!org) {
      org = new Map();
      this.presenceByOrg.set(conn.organizationId, org);
    }
    org.set(conn.userId, {
      userId: conn.userId,
      name: conn.name ?? '',
      email: conn.email ?? '',
      role: conn.role as UserRole,
    });
  }

  private removePresence(conn: SocketConnection): void {
    this.presenceByOrg.get(conn.organizationId)?.delete(conn.userId);
  }

  private broadcastPresence(organizationId: string): void {
    const users = [...(this.presenceByOrg.get(organizationId)?.values() ?? [])];
    const payload: WsPresencePayload = {
      organizationId,
      onlineCount: users.length,
      users,
    };
    this.broadcastToOrganization(organizationId, WS_EVENT.PRESENCE_UPDATE, payload);
  }

  // ---- Public broadcast API (used by repositories / feature code) ----

  broadcastToOrganization(
    organizationId: string,
    event: typeof WS_EVENT.AUDIT_CREATED | typeof WS_EVENT.PRESENCE_UPDATE | typeof WS_EVENT.NOTIFICATION,
    payload: AuditLogDTO | WsPresencePayload | WsNotificationPayload,
  ): void {
    if (!this.io) return;
    this.io.to(WS_ROOM.org(organizationId)).emit(event, payload);
  }

  broadcastToAll(event: string, payload: unknown): void {
    if (!this.io) return;
    this.io.emit(event, payload);
  }

  /** Broadcast a new audit-log entry to its organization (best-effort). */
  broadcastAuditCreated(audit: unknown): void {
    const dto = this.mapAuditToDto(audit);
    if (!dto) return;
    this.broadcastToOrganization(dto.organizationId, WS_EVENT.AUDIT_CREATED, dto);
  }

  /**
   * Convert a raw Prisma audit-log row into the serializable `AuditLogDTO`
   * expected by clients. Returns null when the input is malformed.
   */
  private mapAuditToDto(audit: unknown): AuditLogDTO | null {
    if (!audit || typeof audit !== 'object') return null;
    const a = audit as Record<string, unknown>;
    if (typeof a.id !== 'string') return null;
    return {
      id: a.id,
      action: a.action as AuditLogDTO['action'],
      entity: a.entity as AuditLogDTO['entity'],
      entityId: a.entityId as string,
      userId: a.userId as string,
      organizationId: a.organizationId as string,
      userName: typeof a.userName === 'string' ? a.userName : undefined,
      metadata: a.metadata as AuditLogDTO['metadata'],
      ipAddress: typeof a.ipAddress === 'string' ? a.ipAddress : undefined,
      userAgent: typeof a.userAgent === 'string' ? a.userAgent : undefined,
      createdAt:
        a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
    };
  }

  /** Broadcast a notification to a specific organization (best-effort). */
  broadcastNotification(organizationId: string, notification: WsNotificationPayload): void {
    this.broadcastToOrganization(organizationId, WS_EVENT.NOTIFICATION, notification);
  }

  /** Graceful shutdown (closes sockets and adapter). */
  async shutdown(): Promise<void> {
    if (this.io) {
      await new Promise<void>((resolve) => this.io?.close(() => resolve()));
      this.io = null;
    }
    this.attached = false;
    this.connections.clear();
    this.presenceByOrg.clear();
  }

  /** Runtime stats for the `/api/v1/ws/status` admin endpoint. */
  getStats(): WebSocketStats {
    const byOrganization: Record<string, number> = {};
    for (const [orgId, users] of this.presenceByOrg) {
      byOrganization[orgId] = users.size;
    }
    return {
      startedAt: this.startedAt,
      attached: this.attached,
      activeConnections: this.io?.engine?.clientsCount ?? 0,
      totalConnections: this.connections.size,
      totalMessages: 0,
      byOrganization,
    };
  }
}

let instance: SocketIoManager | null = null;

export function getWebSocketManager(): SocketIoManager {
  if (!instance) instance = new SocketIoManager();
  return instance;
}

export type { SocketConnection };
