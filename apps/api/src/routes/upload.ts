import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { uploadSingle } from '../middleware/upload.js';
import { CloudinaryStorageProvider } from '../storage/cloudinary.provider.js';
import { LocalStorageProvider } from '../storage/local.provider.js';
import type { UploadResult } from '../storage/types.js';

const router = Router();

// All upload routes require authentication
router.use(authenticate);

/**
 * Check whether Cloudinary credentials are available in this environment.
 */
function hasCloudinaryCredentials(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Get the appropriate storage provider based on available credentials.
 */
function getStorageProvider(): CloudinaryStorageProvider | LocalStorageProvider {
  if (hasCloudinaryCredentials()) {
    return new CloudinaryStorageProvider({
      provider: 'cloudinary',
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME!,
      cloudinaryApiKey: process.env.CLOUDINARY_API_KEY!,
      cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET!,
    });
  }

  // Fallback to local storage (development without Cloudinary)
  return new LocalStorageProvider({
    provider: 'local',
    localPath: './uploads',
  });
}

/**
 * POST /upload/image
 * Upload an image to Cloudinary (production) or local filesystem (dev fallback).
 * Accepts multipart/form-data with field 'file'
 * Returns { url: string }
 */
router.post('/image', uploadSingle('file'), async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' },
      });
    }

    const file = req.file;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'Only JPEG, PNG, WebP, and SVG images are allowed',
        },
      });
    }

    const provider = getStorageProvider();

    let result: UploadResult;
    if (provider instanceof CloudinaryStorageProvider) {
      // ── Cloudinary ──────────────────────────────────────────
      result = await provider.upload(file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
        folder: 'avatars',
      });
    } else {
      // ── Local filesystem fallback ───────────────────────────
      result = await provider.upload(file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
        folder: 'avatars',
      });
    }

    res.json({
      success: true,
      data: { url: result.url },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
