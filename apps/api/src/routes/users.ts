import { Router } from 'express';
import { UserRole } from '@vestara/types';
import {
  createUserSchema,
  updateUserSchema,
  paginationSchema,
  userIdParamSchema,
  idsBodySchema,
  bulkStatusSchema,
} from '@vestara/validation';
import { validate } from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { userRepository } from '../repositories/index.js';
import { sendSuccess, sendPaginated, sendCreated, sendNoContent } from '../utils/response.js';
import bcrypt from 'bcryptjs';

const router = Router();

// Helper to safely extract param (Express 5 type quirk)
const param = (val: string | string[] | undefined): string => String(val ?? '');

// All routes require authentication
router.use(authenticate);

/**
 * GET /users/stats — Get user statistics
 * Access: SUPER_ADMIN, ADMIN
 */
router.get(
  '/stats',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (req, res, next) => {
    try {
      const stats = await userRepository.getStats(req.user!.organizationId);
      sendSuccess(res, { stats });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /users — List users (paginated, filterable)
 * Access: SUPER_ADMIN, ADMIN
 */
router.get(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(paginationSchema, 'query'),
  async (req, res, next) => {
    try {
      const { page, perPage, sort, order, search } = req.query as unknown as {
        page: number;
        perPage: number;
        sort?: string;
        order?: 'asc' | 'desc';
        search?: string;
      };

      const result = await userRepository.findAll({
        page,
        perPage,
        sort,
        order,
        search,
        // SUPER_ADMIN sees all users across all organizations; others scoped to their org
        organizationId: req.user!.role === UserRole.SUPER_ADMIN ? undefined : req.user!.organizationId,
      });

      sendPaginated(res, result.users, {
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
 * POST /users/bulk-delete — Delete multiple users
 * Access: SUPER_ADMIN
 * The requesting user's own ID is always excluded to prevent self-lockout.
 */
router.post(
  '/bulk-delete',
  requireRole(UserRole.SUPER_ADMIN),
  validate(idsBodySchema),
  async (req, res, next) => {
    try {
      const currentUserId = req.user!.id;
      const ids = (req.body.ids as string[]).filter((id) => id !== currentUserId);

      if (ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_DELETE_SELF',
            message: 'You cannot delete your own account',
          },
        });
      }

      const deleted = await userRepository.deleteMany(ids);
      res.status(200).json({ success: true, data: { deleted }, meta: { total: deleted } });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /users/bulk-status — Activate or deactivate multiple users
 * Access: SUPER_ADMIN, ADMIN
 */
router.post(
  '/bulk-status',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(bulkStatusSchema),
  async (req, res, next) => {
    try {
      const { ids, status } = req.body as { ids: string[]; status: 'active' | 'inactive' };
      const updated = await userRepository.updateManyStatus(ids, status === 'active');
      res.status(200).json({ success: true, data: { updated }, meta: { total: updated } });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /users/:id — Get user by ID
 * Access: SUPER_ADMIN, ADMIN
 */
router.get(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(userIdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const id = param(req.params.id);
      const user = await userRepository.findByIdOrThrow(id);
      sendSuccess(res, { user });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /users — Create a new user
 * Access: SUPER_ADMIN
 */
router.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN),
  validate(createUserSchema),
  async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, role, organizationId } = req.body;

      // Check for existing user
      const existing = await userRepository.findByEmail(email);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: { code: 'USER_ALREADY_EXISTS', message: 'A user with this email already exists' },
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      // SUPER_ADMIN can specify organizationId, otherwise use their own organization
      const targetOrgId = organizationId ?? req.user!.organizationId;

      const user = await userRepository.create({
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        organizationId: targetOrgId,
      });

      sendCreated(res, { user });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PUT /users/:id — Update a user
 * Access: SUPER_ADMIN, ADMIN
 */
router.put(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateUserSchema),
  async (req, res, next) => {
    try {
      const id = param(req.params.id);
      // Verify user exists
      await userRepository.findByIdOrThrow(id);

      // SUPER_ADMIN can change organization, ADMIN cannot
      const updateData = { ...req.body };
      if (req.user!.role !== UserRole.SUPER_ADMIN) {
        delete updateData.organizationId;
      }

      const user = await userRepository.update(id, updateData);
      sendSuccess(res, { user });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /users/:id — Delete a user (super_admin only)
 * Access: SUPER_ADMIN
 */
router.delete(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN),
  async (req, res, next) => {
    try {
      const id = param(req.params.id);

      if (id === req.user!.id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_DELETE_SELF',
            message: 'You cannot delete your own account',
          },
        });
      }

      await userRepository.findByIdOrThrow(id);
      await userRepository.delete(id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /users/:id/status — Toggle user active status
 * Access: SUPER_ADMIN, ADMIN
 */
router.patch(
  '/:id/status',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (req, res, next) => {
    try {
      const id = param(req.params.id);
      const user = await userRepository.findByIdOrThrow(id);
      const updated = await userRepository.update(id, {
        isActive: !user.isActive,
      });
      sendSuccess(res, { user: updated });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
