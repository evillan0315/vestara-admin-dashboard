import { Router } from 'express';
import { UserRole } from '@vestara/types';
import { updateSettingSchema } from '@vestara/validation';
import { validate } from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { settingsRepository } from '../repositories/index.js';
import { sendSuccess, sendNoContent } from '../utils/response.js';

const router = Router();

// Helper to safely extract param (Express 5 type quirk)
const param = (val: string | string[] | undefined): string => String(val ?? '');

// All routes require authentication
router.use(authenticate);

/**
 * GET /settings — Get all settings as a key-value map
 * Access: SUPER_ADMIN, ADMIN
 */
router.get(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (req, res, next) => {
    try {
      const settings = await settingsRepository.getAllAsMap();
      sendSuccess(res, { settings });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /settings/:key — Get a single setting by key
 * Access: SUPER_ADMIN, ADMIN
 */
router.get(
  '/:key',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (req, res, next) => {
    try {
      const key = param(req.params.key);
      const setting = await settingsRepository.findByKeyOrThrow(key);
      sendSuccess(res, { setting });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PUT /settings/:key — Upsert a setting
 * Access: SUPER_ADMIN
 */
router.put(
  '/:key',
  requireRole(UserRole.SUPER_ADMIN),
  validate(updateSettingSchema),
  async (req, res, next) => {
    try {
      const key = param(req.params.key);
      const setting = await settingsRepository.upsert(
        key,
        req.body.value,
        req.user?.id,
      );
      sendSuccess(res, { setting });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /settings/:key — Delete a setting
 * Access: SUPER_ADMIN
 */
router.delete(
  '/:key',
  requireRole(UserRole.SUPER_ADMIN),
  async (req, res, next) => {
    try {
      const key = param(req.params.key);
      await settingsRepository.findByKeyOrThrow(key);
      await settingsRepository.delete(key);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
