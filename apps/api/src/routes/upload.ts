import { Router } from 'express';
import { put } from '@vercel/blob';
import { authenticate } from '../middleware/authenticate.js';
import { uploadSingle } from '../middleware/upload.js';

const router = Router();

// All upload routes require authentication
router.use(authenticate);

/**
 * POST /upload/image
 * Upload an image to Vercel Blob storage
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

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const extension = file.originalname.split('.').pop() || 'png';
    const filename = `organizations/${timestamp}-${randomSuffix}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file.buffer, {
      access: 'public',
      addRandomSuffix: false,
    });

    res.json({
      success: true,
      data: { url: blob.url },
    });
  } catch (error) {
    next(error);
  }
});

export default router;