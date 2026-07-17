import { Router } from 'express';
import { UserRole } from '@vestara/types';
import { updateSettingSchema } from '@vestara/validation';
import { validate } from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { settingsService } from '../services/index.js';
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
router.get('/', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), async (_req, res, next) => {
  try {
    const settings = await settingsService.getAllAsMap(_req.user!.organizationId);
    sendSuccess(res, { settings });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /settings/export — Export all settings as downloadable JSON
 * Access: SUPER_ADMIN, ADMIN
 */
router.get(
  '/export',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (_req, res, next) => {
    try {
      const allSettings = await settingsService.getAll(_req.user!.organizationId);

      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        organizationId: _req.user!.organizationId,
        settings: allSettings.map((s) => ({
          key: s.key,
          value: s.value,
          updatedAt: s.updatedAt.toISOString(),
          updatedBy: s.updatedBy,
        })),
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="vestara-settings-${new Date().toISOString().split('T')[0]}.json"`,
      );
      res.json(exportData);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /settings/import — Import settings from JSON
 * Access: SUPER_ADMIN only
 */
router.post('/import', requireRole(UserRole.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { settings } = req.body as { settings?: Record<string, unknown> };

    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'settings must be a JSON object with key-value pairs',
        },
      });
      return;
    }

    // Validate each value is an object (JSON-compatible)
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value !== 'object' || value === null) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Setting "${key}" must be a JSON object, got ${typeof value}`,
          },
        });
        return;
      }
      if (key.length > 100) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Setting key "${key}" exceeds 100 characters`,
          },
        });
        return;
      }
    }

    const results = await settingsService.importSettings(
      settings,
      req.user?.id,
      req.user!.organizationId,
    );

    sendSuccess(res, {
      imported: results.length,
      created: results.filter((r) => r.action === 'created').length,
      updated: results.filter((r) => r.action === 'updated').length,
      details: results,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /settings/audit-history — Get audit history for settings changes
 * Access: SUPER_ADMIN, ADMIN
 */
router.get(
  '/audit-history',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (req, res, next) => {
    try {
      const page = Number(req.query.page) || 1;
      const perPage = Math.min(Number(req.query.perPage) || 20, 100);
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const sort = (req.query.sort as string) || 'createdAt';
      const order = (req.query.order as 'asc' | 'desc') || 'desc';

      const { logs, total } = await settingsService.getAuditHistory(req.user!.organizationId, {
        page,
        perPage,
        startDate,
        endDate,
        sort,
        order,
      });

      sendSuccess(res, {
        logs,
        pagination: {
          page,
          perPage,
          total,
          totalPages: Math.ceil(total / perPage),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /settings/:key — Get a single setting by key
 * Returns 200 with null data when the key doesn't exist (optional setting).
 * Access: SUPER_ADMIN, ADMIN
 */
router.get('/:key', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), async (req, res, next) => {
  try {
    const key = param(req.params.key);
    const setting = await settingsService.findByKey(key, req.user!.organizationId);
    sendSuccess(res, { setting: setting ?? null });
  } catch (error) {
    next(error);
  }
});

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
      const setting = await settingsService.upsert(
        key,
        req.body.value,
        req.user?.id,
        req.user!.organizationId,
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
router.delete('/:key', requireRole(UserRole.SUPER_ADMIN), async (req, res, next) => {
  try {
    const key = param(req.params.key);
    await settingsService.delete(key, req.user!.organizationId, req.user?.id);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

export default router;
