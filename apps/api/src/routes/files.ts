// ──────────────────────────────────────────────
// Files Routes
// ──────────────────────────────────────────────

import { Router } from 'express';
import multer from 'multer';
import { UserRole } from '@vestara/types';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { fileService } from '../services/index.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';
import { z } from 'zod';

const router = Router();

// Helper to safely extract param
const param = (val: string | string[] | undefined): string => String(val ?? '');

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (_req, _file, cb) => {
    // Allow all file types for file manager
    cb(null, true);
  },
});

// Validation schemas
const fileIdParamSchema = z.object({
  id: z.string().uuid(),
});

const folderIdParamSchema = z.object({
  id: z.string().uuid().nullable(),
});

const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentFolderId: z.string().uuid().nullable().optional(),
});

const moveFilesSchema = z.object({
  fileIds: z.array(z.string().uuid()).min(1),
  folderId: z.string().uuid().nullable(),
});

const updateFileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  folderId: z.string().uuid().nullable().optional(),
});

const listFilesQuerySchema = z.object({
  folderId: z.string().uuid().nullable().optional(),
  mimeType: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

const storageSettingsSchema = z.object({
  provider: z.enum(['LOCAL', 'CLOUDINARY', 'S3', 'GOOGLE_DRIVE']),
  config: z.record(z.unknown()).optional(),
});

// All routes require authentication
router.use(authenticate);

/**
 * GET /files/stats - Get file statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await fileService.getStats(req.user!.organizationId);
    sendSuccess(res, { stats });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /files - List files with pagination and filters
 */
router.get('/', validate(listFilesQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { folderId, mimeType, search, page, perPage, sort, order } = req.query as any;
    const result = await fileService.listFiles(req.user!.organizationId, {
      folderId: folderId || null,
      mimeType,
      search,
      page,
      perPage,
      sort,
      order,
    });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /files/folder - Get root folder contents (files + subfolders)
 * GET /files/folder/:folderId - Get folder contents (files + subfolders)
 */
router.get(
  '/folder',
  async (req, res, next) => {
    try {
      const contents = await fileService.getFolderContents(req.user!.organizationId, null);
      sendSuccess(res, { contents });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/folder/:folderId',
  validate(folderIdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const folderId = param(req.params.folderId);
      const contents = await fileService.getFolderContents(req.user!.organizationId, folderId);
      sendSuccess(res, { contents });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /files/:id - Get file by ID
 */
router.get(
  '/:id',
  validate(fileIdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const id = param(req.params.id);
      const file = await fileService.getFile(req.user!.organizationId, id);
      sendSuccess(res, { file });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /files/upload - Upload file(s)
 */
router.post(
  '/upload',
  upload.array('files', 20),
  async (req, res, next) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILES', message: 'No files uploaded' },
        });
      }

      const folderId = req.body.folderId || null;

      const results = await Promise.all(
        files.map((file) =>
          fileService.uploadFile(
            req.user!.organizationId,
            req.user!.id,
            file.buffer,
            file.originalname,
            file.mimetype,
            folderId
          )
        )
      );

      sendCreated(res, { files: results });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /files/folder - Create folder
 */
router.post(
  '/folder',
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR, UserRole.SUPPORT),
  validate(createFolderSchema),
  async (req, res, next) => {
    try {
      const { name, parentFolderId } = req.body;
      const folder = await fileService.createFolder(req.user!.organizationId, req.user!.id, name, parentFolderId);
      sendCreated(res, { folder });
    } catch (error) {
      if (error instanceof Error && error.message === 'FOLDER_EXISTS') {
        return res.status(409).json({
          success: false,
          error: { code: 'FOLDER_EXISTS', message: 'A folder with this name already exists' },
        });
      }
      if (error instanceof Error && error.message === 'PARENT_FOLDER_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: { code: 'PARENT_FOLDER_NOT_FOUND', message: 'Parent folder not found' },
        });
      }
      next(error);
    }
  }
);

/**
 * PUT /files/:id - Update file metadata
 */
router.put(
  '/:id',
  validate(fileIdParamSchema, 'params'),
  validate(updateFileSchema),
  async (req, res, next) => {
    try {
      const id = param(req.params.id);
      const { name, folderId } = req.body;
      const file = await fileService.updateFile(req.user!.organizationId, id, req.user!.id, { name, folderId });
      sendSuccess(res, { file });
    } catch (error) {
      if (error instanceof Error && error.message === 'TARGET_FOLDER_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: { code: 'TARGET_FOLDER_NOT_FOUND', message: 'Target folder not found' },
        });
      }
      next(error);
    }
  }
);

/**
 * GET /files/:id/download - Get file download URL
 */
router.get(
  '/:id/download',
  validate(fileIdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const id = param(req.params.id);
      const file = await fileService.getFile(req.user!.organizationId, id);
      // Return the file URL - in production this would be a signed URL
      sendSuccess(res, { url: file.url || `/api/files/${file.path}` });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /files/move - Move files to folder
 */
router.post(
  '/move',
  validate(moveFilesSchema),
  async (req, res, next) => {
    try {
      const { fileIds, folderId } = req.body;
      const result = await fileService.moveFiles(req.user!.organizationId, fileIds, folderId, req.user!.id);
      sendSuccess(res, { moved: result.count });
    } catch (error) {
      if (error instanceof Error && error.message === 'TARGET_FOLDER_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: { code: 'TARGET_FOLDER_NOT_FOUND', message: 'Target folder not found' },
        });
      }
      next(error);
    }
  }
);

/**
 * DELETE /files/:id - Delete file
 */
router.delete(
  '/:id',
  validate(fileIdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const id = param(req.params.id);
      await fileService.deleteFile(req.user!.organizationId, id, req.user!.id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /files/bulk-delete - Bulk delete files
 */
router.post(
  '/bulk-delete',
  validate(z.object({ fileIds: z.array(z.string().uuid()).min(1) })),
  async (req, res, next) => {
    try {
      const { fileIds } = req.body;
      const result = await fileService.bulkDeleteFiles(req.user!.organizationId, fileIds, req.user!.id);
      sendSuccess(res, { deleted: result.count });
    } catch (error) {
      next(error);
    }
  }
);

// Storage Settings Routes (Admin only)

/**
 * GET /files/storage/settings - Get storage settings
 */
router.get(
  '/storage/settings',
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  async (req, res, next) => {
    try {
      const settings = await fileService.getStorageSettings(req.user!.organizationId);
      sendSuccess(res, { settings });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /files/storage/settings - Update storage settings
 */
router.put(
  '/storage/settings',
  requireRole(UserRole.SUPER_ADMIN),
  validate(storageSettingsSchema),
  async (req, res, next) => {
    try {
      const settings = req.body;
      const updated = await fileService.updateStorageSettings(req.user!.organizationId, settings, req.user!.id);
      sendSuccess(res, { settings: updated });
    } catch (error) {
      next(error);
    }
  }
);

export default router;