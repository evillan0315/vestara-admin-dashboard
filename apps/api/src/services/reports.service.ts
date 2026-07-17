// Reports service for Phase 20 - Report Generation with CSV/Excel/PDF export
import { prisma } from '../utils/prisma.js';
import { ReportType, ReportFormat, ReportStatus } from '../generated/prisma/enums.js';
import { Prisma } from '../generated/prisma/client.js';
import { AuditAction, type WsReportStatusPayload } from '@vestara/types';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { getWebSocketManager } from '../websocket/socketio-manager.js';

export interface CreateReportParams {
  name: string;
  description?: string;
  type: ReportType;
  format: ReportFormat;
  startDate: Date;
  endDate: Date;
  action?: AuditAction;
  entity?: string;
  userId?: string;
  /** Optional columns to include (if omitted, all columns are included). */
  selectedColumns?: string[];
  /** Optional cron expression for scheduled reports. */
  schedule?: string;
  /** Optional email address for delivery. */
  emailTo?: string;
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  params: Record<string, unknown>;
  organizationId: string;
  createdBy: string;
  fileUrl?: string;
  fileSize?: bigint;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}

export interface ReportStats {
  total: number;
  completed: number;
  generating: number;
  failed: number;
}

interface ReportDataRow {
  [key: string]: unknown;
}

/** Column definitions keyed by report type. */
const COLUMN_DEFS: Record<string, { id: string; label: string }[]> = {
  audit_logs: [
    { id: 'id', label: 'ID' },
    { id: 'action', label: 'Action' },
    { id: 'entity', label: 'Entity' },
    { id: 'entityId', label: 'Entity ID' },
    { id: 'userName', label: 'User Name' },
    { id: 'userEmail', label: 'User Email' },
    { id: 'ipAddress', label: 'IP Address' },
    { id: 'userAgent', label: 'User Agent' },
    { id: 'createdAt', label: 'Date' },
  ],
  users: [
    { id: 'id', label: 'ID' },
    { id: 'email', label: 'Email' },
    { id: 'firstName', label: 'First Name' },
    { id: 'lastName', label: 'Last Name' },
    { id: 'fullName', label: 'Full Name' },
    { id: 'role', label: 'Role' },
    { id: 'isActive', label: 'Active' },
    { id: 'lastLoginAt', label: 'Last Login' },
    { id: 'createdAt', label: 'Created' },
  ],
  activity: [
    { id: 'id', label: 'ID' },
    { id: 'action', label: 'Action' },
    { id: 'entity', label: 'Entity' },
    { id: 'userName', label: 'User Name' },
    { id: 'userEmail', label: 'User Email' },
    { id: 'userRole', label: 'User Role' },
    { id: 'ipAddress', label: 'IP Address' },
    { id: 'createdAt', label: 'Date' },
  ],
  system_logs: [
    { id: 'id', label: 'ID' },
    { id: 'action', label: 'Action' },
    { id: 'entity', label: 'Entity' },
    { id: 'userName', label: 'User Name' },
    { id: 'userEmail', label: 'User Email' },
    { id: 'ipAddress', label: 'IP Address' },
    { id: 'createdAt', label: 'Date' },
  ],
};

class ReportsService {
  async generate(params: CreateReportParams, userId: string): Promise<Report> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const report = await prisma.report.create({
      data: {
        name: params.name,
        description: params.description,
        type: params.type,
        format: params.format,
        status: 'pending',
        params: params as unknown as Prisma.InputJsonValue,
        organizationId: user.organizationId,
        createdBy: userId,
      },
    });

    // Broadcast initial pending status
    this.broadcastStatus(user.organizationId, report.id, report.name, 'pending');

    // Trigger async report generation
    this.generateReportAsync(report.id, params, user.organizationId, userId).catch((err) => {
      console.error('[ReportsService] async generation error:', err);
    });

    return this.mapToDTO(report);
  }

  private broadcastStatus(
    organizationId: string,
    reportId: string,
    name: string,
    status: 'pending' | 'generating' | 'completed' | 'failed',
    error?: string,
    fileUrl?: string,
    fileSize?: number,
    completedAt?: string,
  ): void {
    const payload: WsReportStatusPayload = {
      reportId,
      name,
      status,
      error,
      fileUrl,
      fileSize,
      completedAt,
    };
    getWebSocketManager().broadcastReportStatus(organizationId, payload);
  }

  private async generateReportAsync(
    reportId: string,
    params: CreateReportParams,
    organizationId: string,
    _userId: string,
  ): Promise<void> {
    try {
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'generating' },
      });
      this.broadcastStatus(organizationId, reportId, params.name, 'generating');

      // Fetch data based on report type
      let data: ReportDataRow[] = [];

      switch (params.type) {
        case 'audit_logs':
          data = await this.fetchAuditLogs(params, organizationId);
          break;
        case 'users':
          data = await this.fetchUsers(params, organizationId);
          break;
        case 'activity':
          data = await this.fetchActivity(params, organizationId);
          break;
        case 'system_logs':
          data = await this.fetchSystemLogs(params, organizationId);
          break;
      }

      // Filter columns if specified
      if (params.selectedColumns && params.selectedColumns.length > 0) {
        data = data.map((row) => {
          const filtered: ReportDataRow = {};
          for (const col of params.selectedColumns!) {
            if (col in row) filtered[col] = row[col];
          }
          return filtered;
        });
      }

      // Generate file based on format
      const fileBuffer = await this.generateFile(data, params.format, params.name);

      // Store as base64 data URL (in production, upload to S3/Blob storage)
      const mimeType = this.getMimeType(params.format);
      const fileUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
      const fileSize = BigInt(fileBuffer.length);
      const completedAt = new Date();

      await prisma.report.update({
        where: { id: reportId },
        data: {
          status: 'completed',
          completedAt,
          fileUrl,
          fileSize,
        },
      });
      this.broadcastStatus(
        organizationId,
        reportId,
        params.name,
        'completed',
        undefined,
        fileUrl,
        Number(fileSize),
        completedAt.toISOString(),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await prisma.report.update({
        where: { id: reportId },
        data: {
          status: 'failed',
          error: message,
        },
      });
      this.broadcastStatus(organizationId, reportId, params.name, 'failed', message);
    }
  }

  /** Fetch a preview (limited rows) of what a report would contain. */
  async preview(params: CreateReportParams, userId: string): Promise<ReportDataRow[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    if (!user) throw new Error('User not found');

    let data: ReportDataRow[] = [];
    switch (params.type) {
      case 'audit_logs':
        data = await this.fetchAuditLogs(params, user.organizationId);
        break;
      case 'users':
        data = await this.fetchUsers(params, user.organizationId);
        break;
      case 'activity':
        data = await this.fetchActivity(params, user.organizationId);
        break;
      case 'system_logs':
        data = await this.fetchSystemLogs(params, user.organizationId);
        break;
    }

    // Filter columns if specified
    if (params.selectedColumns && params.selectedColumns.length > 0) {
      data = data.slice(0, 10).map((row) => {
        const filtered: ReportDataRow = {};
        for (const col of params.selectedColumns!) {
          if (col in row) filtered[col] = row[col];
        }
        return filtered;
      });
      return data;
    }

    return data.slice(0, 10);
  }

  /** Get column definitions for a report type. */
  getAvailableColumns(type: string): { id: string; label: string }[] {
    return COLUMN_DEFS[type] ?? [];
  }

  private async fetchAuditLogs(
    params: CreateReportParams,
    organizationId: string,
  ): Promise<ReportDataRow[]> {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
        ...(params.action && { action: params.action }),
        ...(params.entity && { entity: params.entity }),
        ...(params.userId && { userId: params.userId }),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      userId: log.userId,
      userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Unknown',
      userEmail: log.user?.email ?? 'Unknown',
      metadata: log.metadata ? JSON.stringify(log.metadata) : '',
      ipAddress: log.ipAddress ?? '',
      userAgent: log.userAgent ?? '',
      createdAt: log.createdAt.toISOString(),
    }));
  }

  private async fetchUsers(
    params: CreateReportParams,
    organizationId: string,
  ): Promise<ReportDataRow[]> {
    const users = await prisma.user.findMany({
      where: {
        organizationId,
        createdAt: { gte: params.startDate, lte: params.endDate },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        provider: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      isActive: user.isActive,
      avatarUrl: user.avatarUrl ?? '',
      provider: user.provider ?? 'email/password',
      lastLoginAt: user.lastLoginAt?.toISOString() ?? 'Never',
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));
  }

  private async fetchActivity(
    params: CreateReportParams,
    organizationId: string,
  ): Promise<ReportDataRow[]> {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        organizationId,
        createdAt: { gte: params.startDate, lte: params.endDate },
        ...(params.action && { action: params.action }),
        ...(params.entity && { entity: params.entity }),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      userId: log.userId,
      userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Unknown',
      userEmail: log.user?.email ?? 'Unknown',
      userRole: log.user?.role ?? 'Unknown',
      metadata: log.metadata ? JSON.stringify(log.metadata) : '',
      ipAddress: log.ipAddress ?? '',
      userAgent: log.userAgent ?? '',
      createdAt: log.createdAt.toISOString(),
    }));
  }

  private async fetchSystemLogs(
    params: CreateReportParams,
    organizationId: string,
  ): Promise<ReportDataRow[]> {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        organizationId,
        createdAt: { gte: params.startDate, lte: params.endDate },
        OR: [{ action: 'error' }, { entity: 'api' }, { entity: 'system' }],
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      userId: log.userId,
      userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
      userEmail: log.user?.email ?? 'System',
      metadata: log.metadata ? JSON.stringify(log.metadata) : '',
      ipAddress: log.ipAddress ?? '',
      userAgent: log.userAgent ?? '',
      createdAt: log.createdAt.toISOString(),
    }));
  }

  private async generateFile(
    data: ReportDataRow[],
    format: ReportFormat,
    fileName: string,
  ): Promise<Buffer> {
    switch (format) {
      case 'csv':
        return this.generateCSV(data);
      case 'excel':
        return this.generateExcel(data, fileName);
      case 'pdf':
        return this.generatePDF(data, fileName, '');
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private generateCSV(data: ReportDataRow[]): Buffer {
    if (data.length === 0) return Buffer.from('No data available');

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.map((h) => this.formatHeader(h)).join(','),
      ...data.map((row) =>
        headers
          .map((h) => {
            const value = row[h];
            if (value === null || value === undefined) return '';
            const str = String(value);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(','),
      ),
    ];
    return Buffer.from(csvRows.join('\n'));
  }

  private async generateExcel(data: ReportDataRow[], _fileName: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Vestara Admin';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Report');

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers.map((h) => this.formatHeader(h)));

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D4A843' } };
      headerRow.alignment = { horizontal: 'center' };

      for (const row of data) {
        worksheet.addRow(headers.map((h) => row[h] ?? ''));
      }

      (
        worksheet.columns as Array<{
          eachCell: (
            opts: { includeEmpty: boolean },
            cb: (cell: { value: unknown }) => void,
          ) => void;
          width: number;
        }>
      ).forEach((column) => {
        let maxLength = 10;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const val = cell.value;
          if (val !== undefined && val !== null) {
            maxLength = Math.max(maxLength, String(val).length);
          }
        });
        column.width = Math.min(maxLength + 2, 50);
      });

      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: data.length + 1, column: headers.length },
      };
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async generatePDF(data: ReportDataRow[], fileName: string, orgLogoUrl?: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Try to embed org logo if provided
      if (orgLogoUrl && orgLogoUrl.startsWith('data:')) {
        try {
          const base64 = orgLogoUrl.split(',')[1];
          if (base64) {
            doc.image(Buffer.from(base64, 'base64'), 40, 20, { fit: [80, 80] });
          }
        } catch {
          // Logo embedding is best-effort
        }
      }

      // Title
      doc.fontSize(20).fillColor('#D4A843').text(fileName, { align: 'center' });
      doc.moveDown();
      doc
        .fontSize(10)
        .fillColor('#666')
        .text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);

      if (data.length === 0) {
        doc.fontSize(12).fillColor('#999').text('No data available', { align: 'center' });
        doc.end();
        return;
      }

      const headers = Object.keys(data[0]);
      const colWidth = (doc.page.width - 80) / headers.length;
      const goldColor = '#D4A843';

      const drawHeaderRow = () => {
        let xPos = 40;
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF');
        for (const header of headers) {
          doc.rect(xPos, doc.y, colWidth, 20).fill(goldColor);
          doc.fillColor('#FFFFFF').text(this.formatHeader(header), xPos + 2, doc.y + 5, {
            width: colWidth - 4,
            align: 'center',
            ellipsis: true,
          });
          doc.fillColor('#000000');
          xPos += colWidth;
        }
        doc.moveDown();
      };

      drawHeaderRow();

      doc.font('Helvetica').fontSize(7).fillColor('#333333');
      let rowIndex = 0;
      for (const row of data) {
        if (doc.y > doc.page.height - 60) {
          doc.addPage();
          drawHeaderRow();
        }

        if (rowIndex % 2 === 0) {
          let xPos = 40;
          for (let i = 0; i < headers.length; i++) {
            doc.rect(xPos, doc.y, colWidth, 18).fill('#FAFAFA');
            xPos += colWidth;
          }
          doc.y -= 18;
        }

        let xPos = 40;
        for (const header of headers) {
          const value = row[header] ?? '';
          doc.text(String(value), xPos + 2, doc.y + 3, {
            width: colWidth - 4,
            align: 'left',
            ellipsis: true,
          });
          xPos += colWidth;
        }
        doc.moveDown(0.5);
        rowIndex++;
      }

      doc.end();
    });
  }

  private formatHeader(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/_/g, ' ')
      .trim();
  }

  private getMimeType(format: ReportFormat): string {
    switch (format) {
      case 'csv':
        return 'text/csv';
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }

  async getStatus(reportId: string, userId: string): Promise<Report> {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error('Report not found');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });
    if (!user || report.organizationId !== user.organizationId) throw new Error('Access denied');

    return this.mapToDTO(report);
  }

  async list(
    organizationId: string,
    page: number,
    perPage: number,
    search?: string,
    sortField?: string,
    sortDirection?: 'asc' | 'desc',
  ): Promise<Report[]> {
    const skip = (page - 1) * perPage;

    const where: Prisma.ReportWhereInput = { organizationId };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const orderBy: Prisma.ReportOrderByWithRelationInput = {};
    if (sortField === 'name') orderBy.name = sortDirection ?? 'asc';
    else if (sortField === 'status') orderBy.status = sortDirection ?? 'asc';
    else if (sortField === 'createdAt') orderBy.createdAt = sortDirection ?? 'desc';
    else orderBy.createdAt = 'desc';

    const reports = await prisma.report.findMany({
      where,
      skip,
      take: perPage,
      orderBy,
    });

    return reports.map(this.mapToDTO);
  }

  async count(organizationId: string, search?: string): Promise<number> {
    const where: Prisma.ReportWhereInput = { organizationId };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    return await prisma.report.count({ where });
  }

  async stats(organizationId: string): Promise<ReportStats> {
    const where = { organizationId };
    const [total, completed, generating, failed] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.count({ where: { ...where, status: 'completed' } }),
      prisma.report.count({ where: { ...where, status: { in: ['pending', 'generating'] } } }),
      prisma.report.count({ where: { ...where, status: 'failed' } }),
    ]);
    return { total, completed, generating, failed };
  }

  async delete(reportId: string, userId: string): Promise<void> {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error('Report not found');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });
    if (!user || report.organizationId !== user.organizationId) throw new Error('Access denied');

    await prisma.report.delete({ where: { id: reportId } });
  }

  // ── Report Templates ────────────────────────────────────────────────────

  async listTemplates(organizationId: string) {
    return await prisma.reportTemplate.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async createTemplate(
    data: {
      name: string;
      description?: string;
      type: string;
      format: string;
      config: Record<string, unknown>;
    },
    organizationId: string,
    createdBy: string,
  ) {
    return await prisma.reportTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type as ReportType,
        format: data.format as ReportFormat,
        config: data.config as Prisma.InputJsonValue,
        organizationId,
        createdBy,
      },
    });
  }

  async updateTemplate(
    id: string,
    organizationId: string,
    data: {
      name?: string;
      description?: string;
      type?: string;
      format?: string;
      config?: Record<string, unknown>;
    },
  ) {
    const template = await prisma.reportTemplate.findUnique({ where: { id } });
    if (!template || template.organizationId !== organizationId)
      throw new Error('Template not found');

    return await prisma.reportTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type as ReportType }),
        ...(data.format !== undefined && { format: data.format as ReportFormat }),
        ...(data.config !== undefined && { config: data.config as Prisma.InputJsonValue }),
      },
    });
  }

  async deleteTemplate(id: string, organizationId: string) {
    const template = await prisma.reportTemplate.findUnique({ where: { id } });
    if (!template || template.organizationId !== organizationId)
      throw new Error('Template not found');
    await prisma.reportTemplate.delete({ where: { id } });
  }

  // ── Comparison ──────────────────────────────────────────────────────────

  async compare(reportIds: string[], userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    if (!user) throw new Error('User not found');

    const reports = await prisma.report.findMany({
      where: {
        id: { in: reportIds },
        organizationId: user.organizationId,
      },
    });

    if (reports.length !== reportIds.length) throw new Error('One or more reports not found');

    // Parse the params back into CreateReportParams
    return reports.map((r) => ({
      ...this.mapToDTO(r),
      // Try to extract data counts from params metadata or fileUrl
    }));
  }

  // ── Helper ──────────────────────────────────────────────────────────────

  async getDownloadUrl(fileUrl: string): Promise<string> {
    return fileUrl;
  }

  private mapToDTO(report: {
    id: string;
    name: string;
    description?: string | null;
    type: ReportType;
    format: ReportFormat;
    status: ReportStatus;
    params: unknown;
    organizationId: string;
    createdBy: string;
    fileUrl?: string | null;
    fileSize?: bigint | null;
    error?: string | null;
    createdAt: Date;
    completedAt?: Date | null;
    updatedAt: Date;
  }): Report {
    return {
      id: report.id,
      name: report.name,
      description: report.description ?? undefined,
      type: report.type,
      format: report.format,
      status: report.status,
      params: (report.params as Record<string, unknown>) ?? {},
      organizationId: report.organizationId,
      createdBy: report.createdBy,
      fileUrl: report.fileUrl ?? undefined,
      fileSize: report.fileSize ?? undefined,
      error: report.error ?? undefined,
      createdAt: report.createdAt,
      completedAt: report.completedAt ?? undefined,
      updatedAt: report.updatedAt,
    };
  }
}

export const reportService = new ReportsService();
