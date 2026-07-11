import { Router } from 'express';
import { UserRole } from '@vestara/types';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  organizationIdParamSchema,
} from '@vestara/validation';
import { validate } from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { organizationRepository } from '../repositories/index.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

const router = Router();

// Helper to safely extract param (Express 5 type quirk)
const param = (val: string | string[] | undefined): string => String(val ?? '');

// All routes require authentication and the super_admin role.
router.use(authenticate);
router.use(requireRole(UserRole.SUPER_ADMIN));

/**
 * GET /organizations — List all organizations with member counts.
 */
router.get('/', async (_req, res, next) => {
  try {
    const organizations = await organizationRepository.findAll();
    sendSuccess(res, { organizations });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /organizations/:id — Get a single organization by ID.
 */
router.get(
  '/:id',
  validate(organizationIdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const id = param(req.params.id);
      const organization = await organizationRepository.findById(id);
      if (!organization) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Organization not found' },
        });
      }
      sendSuccess(res, { organization });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /organizations — Create a new organization.
 */
router.post(
  '/',
  validate(createOrganizationSchema),
  async (req, res, next) => {
    try {
      const { name, slug, logoUrl } = req.body;

      const existing = await organizationRepository.findBySlug(slug);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'ORGANIZATION_SLUG_EXISTS',
            message: 'An organization with this slug already exists',
          },
        });
      }

      const organization = await organizationRepository.create({
        name,
        slug,
        ...(logoUrl ? { logoUrl } : {}),
      });

      sendCreated(res, { organization });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PUT /organizations/:id — Update an organization's name or logo.
 */
router.put(
  '/:id',
  validate(organizationIdParamSchema, 'params'),
  validate(updateOrganizationSchema),
  async (req, res, next) => {
    try {
      const id = param(req.params.id);
      const { name, logoUrl } = req.body;

      await organizationRepository.findByIdOrThrow(id);

      const organization = await organizationRepository.update(id, {
        ...(name !== undefined && { name }),
        ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
      });

      sendSuccess(res, { organization });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
