// Reports service for Phase 20
import { PrismaClient } from '../generated/prisma';
import { AuditLogDTO } from '@vestara/types';

const prisma = new PrismaClient();

export interface CreateReportParams {
  startDate: Date;
  endDate: Date;
  action?: string;
  entity?: string;
  userId?: string;
  format: 'csv' | 'excel' | 'pdf';
  type: 'audit-logs' | 'system-logs';
}

export interface Report {
  id: string;
  type: 'audit-logs' | 'system-logs';
  status: 'pending' | 'generating' | 'completed' | 'failed';
  params: CreateReportParams;
  organizationId: string;
  createdAt: Date;
  completedAt?: Date;
  fileUrl?: string;
  fileSize?: number;
  error?: string;
}

class ReportsService {
  async generate(params: CreateReportParams, userId: string): Promise<Report> {
    // Verify user has permission to generate this report
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
        type: params.type,
        status: 'pending',
        params,
        organizationId: user.organizationId,
      },
    });

    // In a real implementation, this would trigger an async job
    // For now, we'll simulate report generation
    this.generateReportAsync(report.id, params, user.organizationId);

    return this.mapToDTO(report);
  }

  private async generateReportAsync(reportId: string, params: CreateReportParams, organizationId: string): Promise<void> {
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch data based on report type
      let data: any[] = [];
      let fileUrl: string | undefined;
      let fileSize: number | undefined;

      if (params.type === 'audit-logs') {
        data = await this.fetchAuditLogs(params);
        // Generate CSV/Excel/PDF file
        // fileUrl = await this.generateFile(data, params.format);
        // fileSize = data.length * 1024; // Simulated size
      } else {
        // Handle system logs report
        data = await this.fetchSystemLogs(params);
        // fileUrl = await this.generateFile(data, params.format);
        // fileSize = data.length * 1024;
      }

      // Update report with completed status
      await prisma.report.update({
        where: { id: reportId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          // fileUrl,
          // fileSize,
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

  private async fetchAuditLogs(params: CreateReportParams): Promise<any[]> {
    return await prisma.auditLog.findMany({
      where: {
        organizationId: params.userId ? undefined : undefined, // Organization filtering would need to be added
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private async fetchSystemLogs(params: CreateReportParams): Promise<any[]> {
    // Implement system logs fetching
    return [];
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

  private mapToDTO(report: any): Report {
    return {
      id: report.id,
      type: report.type,
      status: report.status,
      params: report.params,
      organizationId: report.organizationId,
      createdAt: report.createdAt,
      completedAt: report.completedAt,
      fileUrl: report.fileUrl,
      fileSize: report.fileSize,
      error: report.error,
    };
  }
}

export const reportService = new ReportsService();
