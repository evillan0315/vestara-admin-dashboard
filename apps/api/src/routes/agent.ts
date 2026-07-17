// External REST Data Source integration routes
import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import {
  createDataSourceSchema,
  dataSourceIdParamSchema,
  updateDataSourceSchema,
} from '@vestara/validation';
import { UserRole } from '@vestara/types';
import { agentService } from '../services/integrations/agent.service.js';

const router = express.Router();

const writeRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR];

function paramId(req: express.Request): string {
  const id = paramId(req);
  return Array.isArray(id) ? id[0] : id;
}

// List configured data sources
router.get('/data-sources', authenticate, async (req, res, next) => {
  try {
    const data = await agentService.list(req.user!.organizationId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Create a data source (admin / manager only)
router.post(
  '/data-sources',
  authenticate,
  requireRole(...writeRoles),
  validate(createDataSourceSchema),
  async (req, res, next) => {
    try {
      const data = await agentService.create(req.user!.organizationId, req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

// Get a single data source
router.get(
  '/data-sources/:id',
  authenticate,
  validate(dataSourceIdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const data = await agentService.get(req.user!.organizationId, paramId(req));
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

// Get cached last fetch result
router.get(
  '/data-sources/:id/result',
  authenticate,
  validate(dataSourceIdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const data = await agentService.getLastResult(req.user!.organizationId, paramId(req));
      if (!data) {
        res.json({ success: true, data: null });
        return;
      }
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

// Fetch + analyze the external API
router.post(
  '/data-sources/:id/fetch',
  authenticate,
  validate(dataSourceIdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const data = await agentService.fetch(req.user!.organizationId, req.user!.id, paramId(req));
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

// Update a data source (admin / manager only)
router.put(
  '/data-sources/:id',
  authenticate,
  requireRole(...writeRoles),
  validate(dataSourceIdParamSchema, 'params'),
  validate(updateDataSourceSchema),
  async (req, res, next) => {
    try {
      const data = await agentService.update(
        req.user!.organizationId,
        req.user!.id,
        paramId(req),
        req.body,
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
);

// Delete a data source (admin / manager only)
router.delete(
  '/data-sources/:id',
  authenticate,
  requireRole(...writeRoles),
  validate(dataSourceIdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      await agentService.delete(req.user!.organizationId, req.user!.id, paramId(req));
      res.json({ success: true, message: 'Data source deleted successfully' });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
