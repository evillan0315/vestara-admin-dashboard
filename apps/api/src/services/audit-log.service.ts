import type { AuditAction, EntityType } from '@vestara/types';
import { auditLogRepository } from '../repositories/index.js';

export class AuditLogService {
  /**
   * Get all audit logs with filtering and pagination.
   */
  async findAll(params: {
    page?: number;
    perPage?: number;
    userId?: string;
    action?: AuditAction;
    entity?: EntityType;
    entityId?: string;
    ipAddress?: string;
    startDate?: Date;
    endDate?: Date;
    sort?: string;
    order?: 'asc' | 'desc';
  } = {}) {
    const { page = 1, perPage = 20 } = params;

    const result = await auditLogRepository.findAll({
      page,
      perPage,
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      startDate: params.startDate?.toISOString(),
      endDate: params.endDate?.toISOString(),
      sort: params.sort,
      order: params.order,
    });

    return { data: result.logs, page, perPage, total: result.total };
  }

  /**
   * Get a specific audit log by ID.
   */
  async findById(id: string) {
    const log = await auditLogRepository.findById(id);

    if (!log) {
      throw new Error(`Audit log with ID ${id} not found`);
    }

    return log;
  }

  /**
   * Delete expired audit logs (cleanup).
   */
  async deleteExpired() {
    await auditLogRepository.deleteOlderThan(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  }
}