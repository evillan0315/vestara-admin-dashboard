// Reports service for Phase 20 - Report Generation with CSV/Excel/PDF export
import { prisma } from '../utils/prisma.js';
import { ReportType, ReportFormat, ReportStatus } from '../../generated/prisma/enums.js';
import { Prisma } from '../../generated/prisma/client.js';
import { AuditAction } from '@vestara/types';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

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

interface ReportDataRow {
  [key: string]: unknown;
}

class ReportsService {
  async generate(params: CreateReportParams, userId: string): Promise<Report> {
    // Verify user exists and get organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create report record
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

    // Trigger async report generation
    this.generateReportAsync(report.id, params, user.organizationId, userId);

    return this.mapToDTO(report);
  }

  private async generateReportAsync(
    reportId: string,
    params: CreateReportParams,
    organizationId: string,
    _userId: string
  ): Promise<void> {
    try {
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'generating' },
      });

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

      // Generate file based on format
      const fileBuffer = await this.generateFile(data, params.format, params.name);
      
      // Store as base64 data URL (in production, upload to S3/Blob storage)
      const mimeType = this.getMimeType(params.format);
      const fileUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
      const fileSize = BigInt(fileBuffer.length);

      // Update report with completed status and file info
      await prisma.report.update({
        where: { id: reportId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          fileUrl,
          fileSize,
        },
      });
    } catch (error) {
      await prisma.report.update({
        where: { id: reportId },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  private async fetchAuditLogs(params: CreateReportParams, organizationId: string): Promise<ReportDataRow[]> {
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
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
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

  private async fetchUsers(params: CreateReportParams, organizationId: string): Promise<ReportDataRow[]> {
    const users = await prisma.user.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
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
      orderBy: {
        createdAt: 'desc',
      },
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

  private async fetchActivity(params: CreateReportParams, organizationId: string): Promise<ReportDataRow[]> {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
        ...(params.action && { action: params.action }),
        ...(params.entity && { entity: params.entity }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
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

  private async fetchSystemLogs(params: CreateReportParams, organizationId: string): Promise<ReportDataRow[]> {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
        OR: [
          { action: 'error' },
          { entity: 'api' },
          { entity: 'system' },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
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

  private async generateFile(data: ReportDataRow[], format: ReportFormat, fileName: string): Promise<Buffer> {
    switch (format) {
      case 'csv':
        return this.generateCSV(data);
      case 'excel':
        return this.generateExcel(data, fileName);
      case 'pdf':
        return this.generatePDF(data, fileName);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private generateCSV(data: ReportDataRow[]): Buffer {
    if (data.length === 0) {
      return Buffer.from('No data available');
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.map((h) => this.formatHeader(h)).join(','),
      ...data.map((row) =>
        headers.map((h) => {
          const value = row[h];
          if (value === null || value === undefined) return '';
          const str = String(value);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
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
      
      // Add header row
      worksheet.addRow(headers.map((h) => this.formatHeader(h)));
      
      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'D4A843' }, // Gold color
      };
      headerRow.alignment = { horizontal: 'center' };

      // Add data rows
      for (const row of data) {
        worksheet.addRow(headers.map((h) => row[h] ?? ''));
      }

      // Auto-fit columns
      // @ts-ignore - ExcelJS types issue with eachCell callback
      worksheet.columns.forEach((column) => {
        let maxLength = 10;
        // @ts-ignore - ExcelJS types issue with eachCell callback
        column.eachCell({ includeEmpty: true }, (cell) => {
          const val = cell.value;
          if (val !== undefined && val !== null) {
            const cellValue = String(val);
            maxLength = Math.max(maxLength, cellValue.length);
          }
        });
        column.width = Math.min(maxLength + 2, 50);
      });

      // Add filter
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: data.length + 1, column: headers.length },
      };
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private async generatePDF(data: ReportDataRow[], fileName: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(20).fillColor('#D4A843').text(fileName, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).fillColor('#666').text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);

      if (data.length === 0) {
        doc.fontSize(12).fillColor('#999').text('No data available', { align: 'center' });
        doc.end();
        return;
      }

      const headers = Object.keys(data[0]);
      const colWidth = (doc.page.width - 80) / headers.length;

      // Draw header row
      let x = 40;
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF');
      for (const header of headers) {
        doc.rect(x, doc.y, colWidth, 20).fill('#D4A843');
        doc.fillColor('#FFFFFF').text(this.formatHeader(header), x + 2, doc.y + 5, {
          width: colWidth - 4,
          align: 'center',
          ellipsis: true,
        });
        doc.fillColor('#000000');
        x += colWidth;
      }
      doc.moveDown();

      // Draw data rows
      doc.font('Helvetica').fontSize(7).fillColor('#333333');
      let rowIndex = 0;
      for (const row of data) {
        if (doc.y > doc.page.height - 60) {
          doc.addPage();
          // Redraw headers on new page
          x = 40;
          doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF');
          for (const header of headers) {
            doc.rect(x, doc.y, colWidth, 20).fill('#D4A843');
            doc.fillColor('#FFFFFF').text(this.formatHeader(header), x + 2, doc.y + 5, {
              width: colWidth - 4,
              align: 'center',
              ellipsis: true,
            });
            doc.fillColor('#000000');
            x += colWidth;
          }
          doc.moveDown();
          doc.font('Helvetica').fontSize(7).fillColor('#333333');
        }

        // Alternate row colors
        if (rowIndex % 2 === 0) {
          x = 40;
          for (let i = 0; i < headers.length; i++) {
            doc.rect(x, doc.y, colWidth, 18).fill('#FAFAFA');
            x += colWidth;
          }
          doc.y -= 18;
        }

        x = 40;
        for (const header of headers) {
          const value = row[header] ?? '';
          const str = String(value);
          doc.text(str, x + 2, doc.y + 3, {
            width: colWidth - 4,
            align: 'left',
            ellipsis: true,
          });
          x += colWidth;
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
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    // Verify user has permission to access this report
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });

    if (!user || report.organizationId !== user.organizationId) {
      throw new Error('Access denied');
    }

    return this.mapToDTO(report);
  }

  async list(organizationId: string, page: number, perPage: number): Promise<Report[]> {
    const skip = (page - 1) * perPage;

    const reports = await prisma.report.findMany({
      where: { organizationId },
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return reports.map(this.mapToDTO);
  }

  async count(organizationId: string): Promise<number> {
    return await prisma.report.count({
      where: { organizationId },
    });
  }

  async delete(reportId: string, userId: string): Promise<void> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    // Verify user has permission
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });

    if (!user || report.organizationId !== user.organizationId) {
      throw new Error('Access denied');
    }

    await prisma.report.delete({
      where: { id: reportId },
    });
  }

  async getDownloadUrl(fileUrl: string): Promise<string> {
    // In a real implementation, this would generate a signed URL for temporary access
    // For now, return the file URL as-is
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