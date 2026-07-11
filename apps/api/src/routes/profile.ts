import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { AuditAction } from '@vestara/types';
import { updateProfileSchema, changePasswordSchema } from '@vestara/validation';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { userRepository, auditLogRepository } from '../repositories/index.js';
import { sendSuccess } from '../utils/response.js';
import { BadRequestError } from '../utils/errors.js';

const router = Router();

// All profile routes require authentication
router.use(authenticate);

/**
 * GET /profile — Get the current user's profile.
 */
router.get('/', async (req, res, next) => {
  try {
    const user = await userRepository.findByIdOrThrow(req.user!.id);
    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /profile — Update the current user's profile.
 * Fields: firstName, lastName, avatarUrl
 */
router.put('/', validate(updateProfileSchema), async (req, res, next) => {
  try {
    const { firstName, lastName, avatarUrl } = req.body;
    const userId = req.user!.id;

    const user = await userRepository.update(userId, {
      firstName,
      lastName,
      ...(avatarUrl !== undefined && { avatarUrl: avatarUrl || null }),
    });

    await auditLogRepository.create({
      action: AuditAction.UPDATE,
      entity: 'user',
      entityId: userId,
      userId,
      organizationId: req.user!.organizationId,
      metadata: { updatedFields: Object.keys(req.body) },
    });

    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /profile/password — Change the current user's password.
 * Fields: currentPassword, newPassword
 */
router.put('/password', validate(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    // Fetch user with password hash
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new BadRequestError('User not found');
    }

    // OAuth-only accounts have no password set
    if (!user.passwordHash) {
      throw new BadRequestError(
        'Password change is not available for OAuth-linked accounts',
        'OAUTH_ACCOUNT',
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestError('Current password is incorrect', 'PASSWORD_MISMATCH');
    }

    // Hash and update the new password
    const newHash = await bcrypt.hash(newPassword, 12);
    await userRepository.updatePassword(userId, newHash);

    await auditLogRepository.create({
      action: AuditAction.PASSWORD_CHANGE,
      entity: 'user',
      entityId: userId,
      userId,
      organizationId: req.user!.organizationId,
      metadata: { timestamp: new Date().toISOString() },
    });

    sendSuccess(res, { message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
