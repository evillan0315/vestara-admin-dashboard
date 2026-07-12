import { randomUUID } from 'node:crypto';
import type { Server as HttpServer, IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocketServer, WebSocket, type RawData } from 'ws';
import type { UserRole, ServerToClientMessage, ClientToServerMessage, AuditLogDTO, WsPresenceUser } from '@vestara/types';
import { JwtService } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import { userRepository } from '../repositories/index.js';
import { WS_EVENT, WS_ROOM } from '@vestara/types';
import type { ClientConnection, WebSocketStats } from './types.js';

const HEARTBEAT_INTERVAL_MS = 30_000;
const AUTH_FAILURE_CODE = 4001;

/**
 * Manages the real-time WebSocket layer:
 *  - JWT-authenticated connections (token passed as a query param)
 *  - Org-scoped rooms for targeted broadcasts
 *  - Presence tracking per organization
 *  - Heartbeat liveness probing
 *  - Runtime stats for health monitoring
 *
 * The server is attached to the existing Express HTTP server via `attach()`,
 * so it shares the same port. Broadcasting is a no-op until the server is
 * attached (e.g. in serverless/Vercel environments where WebSockets are
 * unavailable), keeping callers like repositories safe to call unconditionally.
 */
export class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private readonly path: string;
  private readonly clients = new Map<string, ClientConnection>();
  private readonly orgClients = new Map<string, Set<string>>();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  private readonly stats = {
    startedAt: null as number | null,
    totalConnections: 0,
    messagesReceived: 0,
    messagesSent: 0,
    errorsTotal: 0,
    reconnectsTotal: 0,
  };

  constructor(path = '/api/v1/ws') {
    this.path = path;
  }

  get isAttached(): boolean {
    return this.wss !== null;
  }

  /**
   * Attach the WebSocket server to an existing HTTP server. Uses a `noServer`
   * WebSocketServer and handles the HTTP `upgrade` event so it coexists with
   * the Express app on the same port. Idempotent.
   */
  attach(server: HttpServer, path: string = this.path): void {
    if (this.wss) return;

    this.wss = new WebSocketServer({ noServer: true });
    this.stats.startedAt = Date.now();

    server.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
      const reqPath = (req.url ?? '').split('?')[0];
      if (reqPath !== path) return; // Not our WebSocket endpoint.

      this.wss!.handleUpgrade(req, socket, head, (ws) => {
        this.wss!.emit('connection', ws, req);
      });
    });

    this.wss.on('connection', (socket: WebSocket, req: IncomingMessage) => {
      void this.handleConnection(socket, req);
    });

    this.startHeartbeat();
    logger.info({ path }, 'WebSocket server attached');
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (!this.wss) return;
      for (const client of this.clients.values()) {
        if (client.isAlive === false) {
          client.socket.terminate();
          this.handleClose(client);
          continue;
        }
        client.isAlive = false;
        try {
          client.socket.ping();
        } catch {
          // Socket may already be closing; handled by close/error events.
        }
      }
    }, HEARTBEAT_INTERVAL_MS);
    // Do not keep the process alive solely for the heartbeat.
    this.heartbeatTimer.unref?.();
  }

  private async handleConnection(socket: WebSocket, req: IncomingMessage): Promise<void> {
    const token = this.extractToken(req);
    if (!token) {
      this.closeWithError(socket, AUTH_FAILURE_CODE, 'Missing authentication token');
      return;
    }

    const payload = JwtService.validateAccessToken(token);
    if (!payload) {
      this.closeWithError(socket, AUTH_FAILURE_CODE, 'Invalid or expired authentication token');
      return;
    }

    const user = await userRepository.findById(payload.id);
    if (!user || !user.isActive) {
      this.closeWithError(socket, AUTH_FAILURE_CODE, 'User not authorized');
      return;
    }

    const clientId = randomUUID();
    const client: ClientConnection = {
      id: clientId,
      socket,
      userId: user.id,
      organizationId: user.organizationId,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role as UserRole,
      rooms: new Set([WS_ROOM.org(user.organizationId)]),
      isAlive: true,
      connectedAt: Date.now(),
    };

    this.clients.set(clientId, client);
    this.addToOrg(user.organizationId, clientId);
    this.stats.totalConnections += 1;

    socket.on('pong', () => {
      client.isAlive = true;
    });
    socket.on('message', (data: RawData) => {
      void this.handleMessage(client, data);
    });
    socket.on('close', () => this.handleClose(client));
    socket.on('error', (err) => {
      logger.warn({ err, clientId }, 'WebSocket socket error');
      this.stats.errorsTotal += 1;
      this.handleClose(client);
    });

    // Auto-subscribe to the organization room and confirm the connection.
    this.send(client, {
      type: WS_EVENT.CONNECTION_ESTABLISHED,
      payload: { clientId, userId: user.id, organizationId: user.organizationId },
    });
    this.broadcastPresence(user.organizationId);
  }

  private async handleMessage(client: ClientConnection, data: RawData): Promise<void> {
    let parsed: ClientToServerMessage;
    try {
      parsed = JSON.parse(data.toString()) as ClientToServerMessage;
    } catch {
      this.send(client, { type: WS_EVENT.ERROR, payload: { message: 'Invalid message format' } });
      return;
    }

    this.stats.messagesReceived += 1;

    switch (parsed.type) {
      case WS_EVENT.PING:
        this.send(client, { type: WS_EVENT.PONG, payload: { timestamp: parsed.payload.timestamp } });
        break;
      case WS_EVENT.SUBSCRIBE: {
        client.rooms.add(parsed.payload.room);
        if (parsed.payload.room.startsWith('org:')) {
          this.addToOrg(parsed.payload.room.slice(4), client.id);
          this.broadcastPresence(parsed.payload.room.slice(4));
        }
        break;
      }
      case WS_EVENT.UNSUBSCRIBE: {
        client.rooms.delete(parsed.payload.room);
        if (parsed.payload.room.startsWith('org:')) {
          this.removeFromOrg(parsed.payload.room.slice(4), client.id);
          this.broadcastPresence(parsed.payload.room.slice(4));
        }
        break;
      }
      default:
        this.send(client, {
          type: WS_EVENT.ERROR,
          payload: { message: `Unknown event: ${(parsed as { type: string }).type}` },
        });
    }
  }

  private handleClose(client: ClientConnection): void {
    if (!this.clients.has(client.id)) return;
    this.clients.delete(client.id);
    this.removeFromOrg(client.organizationId, client.id);
    this.broadcastPresence(client.organizationId);
  }

  // ── Broadcasting ─────────────────────────────

  /**
   * Send a server message to every client subscribed to the given room.
   * Per-socket failures are isolated and never abort the rest of the broadcast.
   */
  broadcastToRoom(room: string, message: ServerToClientMessage): void {
    if (!this.wss) return;
    for (const client of this.clients.values()) {
      if (client.rooms.has(room)) this.send(client, message);
    }
  }

  broadcastToOrganization(organizationId: string, message: ServerToClientMessage): void {
    this.broadcastToRoom(WS_ROOM.org(organizationId), message);
  }

  broadcastToAll(message: ServerToClientMessage): void {
    if (!this.wss) return;
    for (const client of this.clients.values()) this.send(client, message);
  }

  /**
   * Push a newly-created audit log to all clients in the owning organization.
   * Safe to call from anywhere — it is a no-op when the WS server is not
   * attached and never throws, so it can be called from the persistence path.
   */
  broadcastAuditCreated(audit: unknown): void {
    try {
      const dto = this.mapAuditToDto(audit);
      if (!dto) return;
      this.broadcastToOrganization(dto.organizationId, {
        type: WS_EVENT.AUDIT_CREATED,
        payload: dto,
      });
    } catch (err) {
      logger.warn({ err }, 'Failed to broadcast audit event');
    }
  }

  // ── Presence ─────────────────────────────────

  private broadcastPresence(organizationId: string): void {
    const clientIds = this.orgClients.get(organizationId);
    const seen = new Set<string>();
    const users: WsPresenceUser[] = [];

    if (clientIds) {
      for (const id of clientIds) {
        const client = this.clients.get(id);
        if (!client || seen.has(client.userId)) continue;
        seen.add(client.userId);
        users.push({
          userId: client.userId,
          name: client.name,
          email: client.email,
          role: client.role,
        });
      }
    }

    this.broadcastToOrganization(organizationId, {
      type: WS_EVENT.PRESENCE_UPDATE,
      payload: { organizationId, onlineCount: users.length, users },
    });
  }

  // ── Helpers ──────────────────────────────────

  private send(client: ClientConnection, message: ServerToClientMessage): void {
    if (client.socket.readyState !== WebSocket.OPEN) return;
    try {
      client.socket.send(JSON.stringify(message));
      this.stats.messagesSent += 1;
    } catch (err) {
      logger.warn({ err, clientId: client.id }, 'Failed to send WebSocket message');
      this.stats.errorsTotal += 1;
    }
  }

  private addToOrg(orgId: string, clientId: string): void {
    let set = this.orgClients.get(orgId);
    if (!set) {
      set = new Set();
      this.orgClients.set(orgId, set);
    }
    set.add(clientId);
  }

  private removeFromOrg(orgId: string, clientId: string): void {
    const set = this.orgClients.get(orgId);
    if (!set) return;
    set.delete(clientId);
    if (set.size === 0) this.orgClients.delete(orgId);
  }

  private extractToken(req: IncomingMessage): string | null {
    const url = new URL(req.url ?? '', 'http://localhost');
    const token = url.searchParams.get('token');
    if (token) return token;

    // Fallback: token passed as a `Bearer <token>` subprotocol.
    const protocol = req.headers['sec-websocket-protocol'];
    if (typeof protocol === 'string' && protocol.startsWith('Bearer ')) {
      return protocol.slice(7);
    }
    return null;
  }

  private closeWithError(socket: WebSocket, code: number, message: string): void {
    try {
      socket.close(code, message);
    } catch {
      // Socket may already be closed; ignore.
    }
  }

  private mapAuditToDto(audit: unknown): AuditLogDTO | null {
    if (!audit || typeof audit !== 'object') return null;
    const a = audit as Record<string, unknown>;
    const orgId = a.organizationId;
    if (typeof orgId !== 'string') return null;

    return {
      id: String(a.id ?? ''),
      action: a.action as AuditLogDTO['action'],
      entity: a.entity as AuditLogDTO['entity'],
      entityId: String(a.entityId ?? ''),
      userId: String(a.userId ?? ''),
      organizationId: orgId,
      userName: typeof a.userName === 'string' ? a.userName : undefined,
      metadata: (a.metadata as Record<string, unknown> | null) ?? undefined,
      ipAddress: a.ipAddress ? String(a.ipAddress) : undefined,
      userAgent: a.userAgent ? String(a.userAgent) : undefined,
      createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt ?? ''),
    };
  }

  getStats(): WebSocketStats {
    const byOrganization: Record<string, number> = {};
    for (const [orgId, set] of this.orgClients.entries()) {
      byOrganization[orgId] = set.size;
    }
    return {
      startedAt: this.stats.startedAt,
      uptimeSeconds: this.stats.startedAt ? Math.floor((Date.now() - this.stats.startedAt) / 1000) : 0,
      totalConnections: this.stats.totalConnections,
      activeConnections: this.clients.size,
      messagesReceived: this.stats.messagesReceived,
      messagesSent: this.stats.messagesSent,
      errorsTotal: this.stats.errorsTotal,
      reconnectsTotal: this.stats.reconnectsTotal,
      byOrganization,
    };
  }

  /**
   * Gracefully close all connections and the underlying server (used on shutdown).
   */
  shutdown(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    for (const client of this.clients.values()) {
      try {
        client.socket.close(1000, 'Server shutting down');
      } catch {
        // ignore
      }
    }
    this.clients.clear();
    this.orgClients.clear();
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}
