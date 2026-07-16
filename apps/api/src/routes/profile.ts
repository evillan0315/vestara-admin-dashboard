import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { AuditAction } from '@vestara/types';
import {
  updateProfileSchema,
  changePasswordSchema,
  changeEmailSchema,
  deleteAccountSchema,
  submitKycSchema,
  addKycDocumentSchema,
} from '@vestara/validation';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { uploadSingle } from '../middleware/upload.js';
import {
  userRepository,
  auditLogRepository,
  sessionRepository,
  refreshTokenRepository,
  userProfileRepository,
  fileRepository,
} from '../repositories/index.js';
import { CloudinaryStorageProvider } from '../storage/cloudinary.provider.js';
import { LocalStorageProvider } from '../storage/local.provider.js';
import type { UploadResult } from '../storage/types.js';
import { sendSuccess, sendNoContent } from '../utils/response.js';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors.js';
import { toUserProfileDTO } from '../utils/profile-dto.js';

const router = Router();

// All profile routes require authentication
router.use(authenticate);

/**
 * Resolve the storage provider (Cloudinary if configured, else local dev).
 */
function getStorageProvider(): CloudinaryStorageProvider | LocalStorageProvider {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    return new CloudinaryStorageProvider({
      provider: 'cloudinary',
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
      cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
      cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
    });
  }
  return new LocalStorageProvider({ provider: 'local', localPath: './uploads' });
}

/**
 * GET /profile — Get the current user's profile (base user + extended profile).
 */
router.get('/', async (req, res, next) => {
  try {
    const user = await userRepository.findByIdOrThrow(req.user!.id);
    const profile = await userProfileRepository.findOrCreateByUserId(
      req.user!.id,
      req.user!.organizationId,
    );
    sendSuccess(res, { user, profile: toUserProfileDTO(profile) });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /profile — Update the current user's profile + extended fields.
 */
router.put('/', validate(updateProfileSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const organizationId = req.user!.organizationId;

    // Fields that map to the base User row.
    const userFields: Record<string, unknown> = {};
    if (req.body.firstName !== undefined) userFields.firstName = req.body.firstName;
    if (req.body.lastName !== undefined) userFields.lastName = req.body.lastName;
    if (req.body.avatarUrl !== undefined) {
      userFields.avatarUrl = req.body.avatarUrl || null;
    }

    if (Object.keys(userFields).length > 0) {
      await userRepository.update(userId, userFields);
    }

    // Remaining fields map to the extended profile.
    const profile = await userProfileRepository.updateByUserId(userId, req.body);

    await auditLogRepository.create({
      action: AuditAction.PROFILE_UPDATE,
      entity: 'user',
      entityId: userId,
      userId,
      organizationId,
      metadata: { updatedFields: Object.keys(req.body) },
    });

    sendSuccess(res, { user: await userRepository.findByIdOrThrow(userId), profile: toUserProfileDTO(profile) });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /profile/password — Change the current user's password.
 */
router.put('/password', validate(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new BadRequestError('User not found');
    }

    if (user.passwordHash) {
      if (!currentPassword) {
        throw new BadRequestError('Current password is required', 'PASSWORD_MISMATCH');
      }
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        throw new BadRequestError('Current password is incorrect', 'PASSWORD_MISMATCH');
      }
    }

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
 */
router.put('/email', validate(changeEmailSchema), async (req, res, next) => {
  try {
    const { newEmail, currentPassword } = req.body;
    const userId = req.user!.id;

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
 */
router.post('/delete-account', validate(deleteAccountSchema), async (req, res, next) => {
  try {
    const { currentPassword } = req.body;
    const userId = req.user!.id;

    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new BadRequestError('User not found');
    }

    if (user.passwordHash) {
      if (!currentPassword) {
        throw new BadRequestError('Current password is required to delete your account');
      }
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        throw new BadRequestError('Current password is incorrect', 'PASSWORD_MISMATCH');
      }
    }

    await auditLogRepository.create({
      action: AuditAction.ACCOUNT_DELETION,
      entity: 'user',
      entityId: userId,
      userId,
      organizationId: req.user!.organizationId,
      metadata: { email: user.email, timestamp: new Date().toISOString() },
    });

    await sessionRepository.deleteAllForUser(userId);
    await refreshTokenRepository.revokeAllForUser(userId);
    await userRepository.delete(userId);

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /profile/kyc/submit — Submit KYC for review (sets status to pending).
 */
router.post('/kyc/submit', validate(submitKycSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const organizationId = req.user!.organizationId;

    const profile = await userProfileRepository.findOrCreateByUserId(userId, organizationId);

    if (profile.documents.length === 0) {
      throw new BadRequestError('Upload at least one document before submitting for verification');
    }

    const updated = await userProfileRepository.submitKyc(userId);

    await auditLogRepository.create({
      action: AuditAction.KYC_SUBMIT,
      entity: 'user_profile',
      entityId: profile.id,
      userId,
      organizationId,
      metadata: { documentCount: profile.documents.length },
    });

    sendSuccess(res, { profile: toUserProfileDTO(updated) });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /profile/documents — Upload a KYC document (multipart, field 'file').
 */
router.post('/documents', uploadSingle('file'), validate(addKycDocumentSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const organizationId = req.user!.organizationId;
    const documentType = req.body.documentType || 'other';

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' },
      });
    }

    const file = req.file;
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_FILE_TYPE', message: 'Only JPEG, PNG, WebP, SVG, and PDF files are allowed' },
      });
    }

    const provider = getStorageProvider();
    const result: UploadResult = await provider.upload(file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
      folder: 'kyc',
    });

    const storedFile = await fileRepository.create({
      name: `kyc-${documentType}-${Date.now()}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: BigInt(file.size),
      path: result.key,
      url: result.url,
      provider: result.provider,
      providerId: result.metadata?.id as string | undefined ?? null,
      folderId: null,
      uploadedBy: userId,
      organizationId,
    });

    const profile = await userProfileRepository.findOrCreateByUserId(userId, organizationId);
    const doc = await userProfileRepository.addKycDocument({
      userId,
      profileId: profile.id,
      fileId: storedFile.id,
      organizationId,
      documentType,
    });

    await auditLogRepository.create({
      action: AuditAction.KYC_DOCUMENT_UPLOAD,
      entity: 'kyc_document',
      entityId: doc.id,
      userId,
      organizationId,
      metadata: { documentType, fileName: file.originalname },
    });

    const updatedProfile = await userProfileRepository.findOrCreateByUserId(userId, organizationId);
    sendSuccess(res, { profile: toUserProfileDTO(updatedProfile) });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /profile/documents/:id — Remove a KYC document. Ownership enforced.
 */
router.delete('/documents/:id', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const organizationId = req.user!.organizationId;
    const docId = req.params.id;

    const profile = await userProfileRepository.findOrCreateByUserId(userId, organizationId);
    const doc = profile.documents.find((d) => d.id === docId);
    if (!doc) {
      throw new NotFoundError('KYC document not found');
    }

    await userProfileRepository.deleteKycDocument(docId);

    await auditLogRepository.create({
      action: AuditAction.KYC_DOCUMENT_DELETE,
      entity: 'kyc_document',
      entityId: docId,
      userId,
      organizationId,
      metadata: { documentType: doc.documentType },
    });

    const updatedProfile = await userProfileRepository.findOrCreateByUserId(userId, organizationId);
    sendSuccess(res, { profile: toUserProfileDTO(updatedProfile) });
  } catch (error) {
    next(error);
  }
});

export default router;
