import { Router } from 'express';
import { UserRole } from '@vestara/types';
import { auditLogQuerySchema } from '@vestara/validation';
import { validate } from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { auditLogRepository } from '../repositories/index.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';

const router = Router();

// Helper to safely extract param (Express 5 type quirk)
const param = (val: string | string[] | undefined): string => String(val ?? '');

// All routes require authentication
router.use(authenticate);

/**
 * GET /audit-logs — List audit logs (paginated, filterable)
 * Access: SUPER_ADMIN, ADMIN
 */
router.get(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(auditLogQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const { page, perPage, action, entity, userId, startDate, endDate, sort, order } =
        req.query as unknown as {
          page: number;
          perPage: number;
          action?: string;
          entity?: string;
          userId?: string;
          startDate?: string;
          endDate?: string;
          sort?: string;
          order?: 'asc' | 'desc';
        };

      const result = await auditLogRepository.findAll({
        page,
        perPage,
        action,
        entity,
        userId,
        organizationId: req.user!.organizationId,
        startDate,
        endDate,
        sort,
        order,
      });

      sendPaginated(res, result.logs, {
        page: Number(page),
        perPage: Number(perPage),
        total: result.total,
        totalPages: Math.ceil(result.total / Number(perPage)),
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /audit-logs/:id — Get a single audit log by ID
 * Access: SUPER_ADMIN, ADMIN
 */
router.get(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (req, res, next) => {
    try {
      const id = param(req.params.id);
      const log = await auditLogRepository.findById(id);
      if (!log) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Audit log not found' },
        });
      }
      sendSuccess(res, { log });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
