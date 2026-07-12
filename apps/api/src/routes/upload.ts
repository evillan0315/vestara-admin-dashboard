import { Router } from 'express';
import { put } from '@vercel/blob';
import path from 'path';
import { authenticate } from '../middleware/authenticate.js';
import { uploadSingle } from '../middleware/upload.js';
import { LocalStorageProvider } from '../storage/local.provider.js';

const router = Router();

// All upload routes require authentication
router.use(authenticate);

/**
 * Check whether Vercel Blob credentials are available in this environment.
 */
function hasVercelBlobCredentials(): boolean {
  return !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_OIDC_TOKEN);
}

/**
 * POST /upload/image
 * Upload an image to Vercel Blob storage (production) or local filesystem (dev).
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
        error: { code: 'INVALID_FILE_TYPE', message: 'Only JPEG, PNG, WebP, and SVG images are allowed' },
      });
    }

    if (hasVercelBlobCredentials()) {
      // ── Vercel Blob (production/Vercel) ──────────────────────
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const extension = file.originalname.split('.').pop() || 'png';
      const filename = `organizations/${timestamp}-${randomSuffix}.${extension}`;

      const blob = await put(filename, file.buffer, {
        access: 'public',
        addRandomSuffix: false,
      });

      return res.json({
        success: true,
        data: { url: blob.url },
      });
    }

    // ── Local filesystem fallback (development) ────────────────
    const localProvider = new LocalStorageProvider({
      provider: 'local',
      localPath: path.resolve(process.cwd(), 'uploads'),
    });

    const result = await localProvider.upload(file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
      folder: 'avatars',
    });

    res.json({
      success: true,
      data: { url: result.url },
    });
  } catch (error) {
    next(error);
  }
});

export default router;