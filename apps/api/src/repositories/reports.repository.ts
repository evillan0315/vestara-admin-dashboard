import { prisma } from '../utils/prisma.js';
import { ReportType, ReportFormat, ReportStatus } from '../generated/prisma/enums.js';
import { Prisma } from '../generated/prisma/client.js';

export class ReportsRepository {
  async create(data: {
    name: string;
    description?: string;
    type: ReportType;
    format: ReportFormat;
    status: ReportStatus;
    params: Prisma.InputJsonValue;
    organizationId: string;
    createdBy: string;
  }) {
    return await prisma.report.create({ data });
  }

  async findById(id: string) {
    return await prisma.report.findUnique({ where: { id } });
  }

  async findMany(organizationId: string, skip: number, take: number) {
    return await prisma.report.findMany({
      where: { organizationId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(organizationId: string) {
    return await prisma.report.count({ where: { organizationId } });
  }

  async update(id: string, data: Record<string, unknown>) {
    return await prisma.report.update({ where: { id }, data });
  }

  async delete(id: string) {
    return await prisma.report.delete({ where: { id } });
  }

  async findUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });
  }

  async fetchAuditLogs(params: {
    organizationId: string;
    startDate: Date;
    endDate: Date;
    action?: string;
    entity?: string;
    userId?: string;
  }) {
    return await prisma.auditLog.findMany({
      where: {
        organizationId: params.organizationId,
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
        ...(params.action && { action: params.action }),
        ...(params.entity && { entity: params.entity }),
        ...(params.userId && { userId: params.userId }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async fetchUsers(params: {
    organizationId: string;
    startDate: Date;
    endDate: Date;
  }) {
    return await prisma.user.findMany({
      where: {
        organizationId: params.organizationId,
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        provider: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async fetchSystemLogs(params: {
    organizationId: string;
    startDate: Date;
    endDate: Date;
  }) {
    return await prisma.auditLog.findMany({
      where: {
        organizationId: params.organizationId,
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
        OR: [
          { action: 'error' },
          { entity: 'api' },
          { entity: 'system' },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

export const reportsRepository = new ReportsRepository();