// Report backend API routes
import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { auditLogService } from '../services/audit-log.service.js';
import { reportService } from '../services/reports.service.js';
import { z } from 'zod';

const router = express.Router();

// Export schemas
export const generateReportSchema = z.object({
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  action: z.string().optional(),
  entity: z.string().optional(),
  userId: z.string().optional(),
  format: z.enum(['csv', 'excel', 'pdf']).default('csv'),
  type: z.enum(['audit-logs', 'system-logs']).default('audit-logs'),
});

// Generate report endpoint
router.post('/generate', authenticate, validate(generateReportSchema), async (req, res, next) => {
  try {
    const report = await reportService.generate(req.body, req.user!.id);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

// Get report status endpoint
router.get('/:reportId/status', authenticate, async (req, res, next) => {
  try {
    const report = await reportService.getStatus(req.params.reportId, req.user!.id);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

// Download report endpoint
router.get('/:reportId/download', authenticate, async (req, res, next) => {
  try {
    const report = await reportService.getStatus(req.params.reportId, req.user!.id);
    
    if (!report.fileUrl) {
      return res.status(404).json({ success: false, message: 'Report not available for download' });
    }
    
    // Download from storage provider
    const downloadUrl = await reportService.getDownloadUrl(report.fileUrl);
    res.redirect(downloadUrl);
  } catch (err) {
    next(err);
  }
});

// List user reports endpoint
router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 20;
    
    const reports = await reportService.list(req.user!.id, page, perPage);
    const total = await reportService.count(req.user!.id);
    
    res.json({
      success: true,
      data: reports,
      meta: {
        total,
        page,
        perPage,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Delete report endpoint
router.delete('/:reportId', authenticate, async (req, res, next) => {
  try {
    await reportService.delete(req.params.reportId, req.user!.id);
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
