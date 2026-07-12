import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { AuditAction } from '@vestara/types';
import {
  updateProfileSchema,
  changePasswordSchema,
  changeEmailSchema,
  deleteAccountSchema,
} from '@vestara/validation';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { userRepository, auditLogRepository, sessionRepository, refreshTokenRepository } from '../repositories/index.js';
import { sendSuccess, sendNoContent } from '../utils/response.js';
import { BadRequestError, ConflictError } from '../utils/errors.js';

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
 * Fields: currentPassword (optional if no password set), newPassword
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

    // If user has a password hash, verify current password
    if (user.passwordHash) {
      if (!currentPassword) {
        throw new BadRequestError('Current password is required', 'PASSWORD_MISMATCH');
      }
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        throw new BadRequestError('Current password is incorrect', 'PASSWORD_MISMATCH');
      }
    } else {
      // OAuth account without password - allow setting initial password
      // currentPassword should not be provided (or we ignore it)
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

/**
 * PUT /profile/email — Change the current user's email address.
 * Fields: newEmail, currentPassword (optional for OAuth)
 */
router.put('/email', validate(changeEmailSchema), async (req, res, next) => {
  try {
    const { newEmail, currentPassword } = req.body;
    const userId = req.user!.id;

    // Verify current password if user has a password set
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new BadRequestError('User not found');
    }

    if (user.passwordHash) {
      if (!currentPassword) {
        throw new BadRequestError('Current password is required to change email');
      }
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        throw new BadRequestError('Current password is incorrect', 'PASSWORD_MISMATCH');
      }
    }

    // Check email uniqueness
    const existingUser = await userRepository.findByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictError('Email is already in use', 'USER_ALREADY_EXISTS');
    }

    const updatedUser = await userRepository.updateEmail(userId, newEmail);

    await auditLogRepository.create({
      action: AuditAction.EMAIL_CHANGE,
      entity: 'user',
      entityId: userId,
      userId,
      organizationId: req.user!.organizationId,
      metadata: { previousEmail: user.email, newEmail },
    });

    sendSuccess(res, { user: updatedUser });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /profile/delete-account — Delete the current user's account (self-service).
 * Body: currentPassword (optional for OAuth), confirmation ("DELETE")
 */
router.post('/delete-account', validate(deleteAccountSchema), async (req, res, next) => {
  try {
    const { currentPassword } = req.body;
    const userId = req.user!.id;

    // Fetch user with password hash
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new BadRequestError('User not found');
    }

    // Verify current password if user has a password set
    if (user.passwordHash) {
      if (!currentPassword) {
        throw new BadRequestError('Current password is required to delete your account');
      }
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        throw new BadRequestError('Current password is incorrect', 'PASSWORD_MISMATCH');
      }
    }

    // Audit log before deletion (so we capture who deleted themselves)
    await auditLogRepository.create({
      action: AuditAction.ACCOUNT_DELETION,
      entity: 'user',
      entityId: userId,
      userId,
      organizationId: req.user!.organizationId,
      metadata: { email: user.email, timestamp: new Date().toISOString() },
    });

    // Delete sessions and revoke refresh tokens first
    await sessionRepository.deleteAllForUser(userId);
    await refreshTokenRepository.revokeAllForUser(userId);

    // Delete the user (cascades audit logs, but we already logged above)
    await userRepository.delete(userId);

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

export default router;
