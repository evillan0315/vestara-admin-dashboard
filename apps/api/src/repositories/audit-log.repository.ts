import { Prisma } from '../generated/prisma/client.js';
import { BaseRepository } from './base.repository.js';
import { getWebSocketManager } from '../websocket/index.js';

export class AuditLogRepository extends BaseRepository {
  /**
   * Create an audit log entry.
   */
  async create(data: {
    action: string;
    entity: string;
    entityId: string;
    userId: string;
    organizationId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const audit = await this.prisma.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        userId: data.userId,
        organizationId: data.organizationId,
        metadata: data.metadata !== undefined
          ? (data.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });

    // Best-effort real-time broadcast. Never affects persistence — the
    // WebSocket server may be unattached (e.g. serverless) and broadcasts
    // are internally guarded against throwing.
    try {
      getWebSocketManager().broadcastAuditCreated(audit);
    } catch {
      // Real-time delivery is optional; ignore any failure.
    }

    return audit;
  }

  /**
   * Find audit logs with filtering and pagination.
   */
  async findAll(params?: {
    page?: number;
    perPage?: number;
    action?: string;
    entity?: string;
    userId?: string;
    organizationId?: string;
    startDate?: string;
    endDate?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const page = params?.page ?? 1;
    const perPage = params?.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const where: Prisma.AuditLogWhereInput = {};

    if (params?.organizationId) where.organizationId = params.organizationId;
    if (params?.action) where.action = params.action;
    if (params?.entity) where.entity = params.entity;
    if (params?.userId) where.userId = params.userId;
    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params?.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params?.endDate) where.createdAt.lte = new Date(params.endDate);
    }

    const orderBy: Prisma.AuditLogOrderByWithRelationInput = {};
    if (params?.sort) {
      (orderBy as Record<string, string>)[params.sort] = params.order ?? 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Find an audit log by ID.
   */
  async findById(id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  /**
   * Count audit logs in a date range.
   */
  async countInRange(startDate: Date, endDate: Date) {
    return this.prisma.auditLog.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    });
  }

  /**
   * Delete audit logs older than the given date.
   */
  async deleteOlderThan(date: Date) {
    await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: date } },
    });
  }
}
