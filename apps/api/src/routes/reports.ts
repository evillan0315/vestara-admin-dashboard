// Report backend API routes - all report features
import express from 'express';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { reportService, type CreateReportParams } from '../services/reports.service.js';
import { UserRole } from '@vestara/types';
import { z } from 'zod';

const router = express.Router();

// ── Validation Schemas ──────────────────────────────────────────────────────

export const generateReportSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  action: z.string().optional(),
  entity: z.string().optional(),
  userId: z.string().optional(),
  format: z.enum(['csv', 'excel', 'pdf']).default('csv'),
  type: z.enum(['audit_logs', 'system_logs', 'users', 'activity']).default('audit_logs'),
  selectedColumns: z.array(z.string()).optional(),
  schedule: z.string().optional(),
  emailTo: z.string().email().optional(),
});

const previewReportSchema = generateReportSchema.extend({
  name: z.string().optional(),
});

const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  type: z.enum(['audit_logs', 'system_logs', 'users', 'activity']),
  format: z.enum(['csv', 'excel', 'pdf']),
  config: z.record(z.unknown()).default({}),
});

const templateUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['audit_logs', 'system_logs', 'users', 'activity']).optional(),
  format: z.enum(['csv', 'excel', 'pdf']).optional(),
  config: z.record(z.unknown()).optional(),
});

const compareSchema = z.object({
  reportIds: z.array(z.string()).min(2, 'At least 2 reports needed for comparison').max(5, 'Max 5 reports'),
});

// ── Helper ──────────────────────────────────────────────────────────────────

const typeLabels: Record<string, string> = {
  audit_logs: 'Audit Logs',
  system_logs: 'System Logs',
  users: 'Users',
  activity: 'Activity',
};

function generateReportName(body: z.infer<typeof generateReportSchema>): string {
  const dateStr = new Date(body.startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return body.name || `${typeLabels[body.type] || body.type} Report - ${dateStr}`;
}

// ── Report CRUD Endpoints ───────────────────────────────────────────────────

// List reports (with search, sort, pagination)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 20;
    const search = (req.query.search as string) || undefined;
    const sortField = (req.query.sortField as string) || undefined;
    const sortDirection = (req.query.sortDirection as 'asc' | 'desc') || undefined;

    const user = await import('../utils/prisma.js').then((m) =>
      m.prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { organizationId: true },
      }),
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const reports = await reportService.list(user.organizationId, page, perPage, search, sortField, sortDirection);
    const total = await reportService.count(user.organizationId, search);

    res.json({
      success: true,
      data: reports,
      meta: { total, page, perPage },
    });
  } catch (err) {
    next(err);
  }
});

// Get report stats
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const user = await import('../utils/prisma.js').then((m) =>
      m.prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { organizationId: true },
      }),
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const stats = await reportService.stats(user.organizationId);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

// Get available columns for a report type
router.get('/columns/:type', authenticate, async (req, res, next) => {
  try {
    const type = String(req.params.type);
    const columns = reportService.getAvailableColumns(type);
    res.json({ success: true, data: columns });
  } catch (err) {
    next(err);
  }
});

// Preview report data (first 10 rows)
router.post('/preview', authenticate, validate(previewReportSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof previewReportSchema>;
    const data = await reportService.preview(body as CreateReportParams, req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Generate report
router.post('/generate', authenticate, validate(generateReportSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof generateReportSchema>;
    const reportName = generateReportName(body);
    const report = await reportService.generate(
      { ...body, name: reportName } as CreateReportParams,
      req.user!.id,
    );
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

// Get report status
router.get('/:reportId/status', authenticate, async (req, res, next) => {
  try {
    const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
    const report = await reportService.getStatus(reportId, req.user!.id);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

// Download report
router.get('/:reportId/download', authenticate, async (req, res, next) => {
  try {
    const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
    const report = await reportService.getStatus(reportId, req.user!.id);

    if (!report.fileUrl) {
      return res.status(404).json({ success: false, message: 'Report not available for download' });
    }

    const downloadUrl = await reportService.getDownloadUrl(report.fileUrl);
    if (downloadUrl.startsWith('data:')) {
      // For base64 data URLs, decode and send as binary
      const [header, base64] = downloadUrl.split(',');
      const mime = header?.replace('data:', '').replace(';base64', '') || 'application/octet-stream';
      const ext = report.format === 'csv' ? 'csv' : report.format === 'excel' ? 'xlsx' : 'pdf';
      const buffer = Buffer.from(base64, 'base64');
      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Disposition', `attachment; filename="${report.name}.${ext}"`);
      res.send(buffer);
    } else {
      res.redirect(downloadUrl);
    }
  } catch (err) {
    next(err);
  }
});

// Delete report
router.delete('/:reportId', authenticate, async (req, res, next) => {
  try {
    const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
    await reportService.delete(reportId, req.user!.id);
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// ── Report Templates ─────────────────────────────────────────────────────────

// List templates
router.get('/templates', authenticate, async (req, res, next) => {
  try {
    const user = await import('../utils/prisma.js').then((m) =>
      m.prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { organizationId: true },
      }),
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const templates = await reportService.listTemplates(user.organizationId);
    res.json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
});

// Create template
router.post('/templates', authenticate, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(templateSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof templateSchema>;
    const user = await import('../utils/prisma.js').then((m) =>
      m.prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { organizationId: true },
      }),
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const template = await reportService.createTemplate(body, user.organizationId, req.user!.id);
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
});

// Update template
router.put('/templates/:templateId', authenticate, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(templateUpdateSchema), async (req, res, next) => {
  try {
    const templateId = Array.isArray(req.params.templateId) ? req.params.templateId[0] : req.params.templateId;
    const body = req.body as z.infer<typeof templateUpdateSchema>;
    const user = await import('../utils/prisma.js').then((m) =>
      m.prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { organizationId: true },
      }),
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const template = await reportService.updateTemplate(templateId, user.organizationId, body);
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
});

// Delete template
router.delete('/templates/:templateId', authenticate, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), async (req, res, next) => {
  try {
    const templateId = Array.isArray(req.params.templateId) ? req.params.templateId[0] : req.params.templateId;
    const user = await import('../utils/prisma.js').then((m) =>
      m.prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { organizationId: true },
      }),
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await reportService.deleteTemplate(templateId, user.organizationId);
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// ── Report Comparison ────────────────────────────────────────────────────────

// Compare reports
router.post('/compare', authenticate, validate(compareSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof compareSchema>;
    const reports = await reportService.compare(body.reportIds, req.user!.id);
    res.json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
});

export default router;
