import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export class ReportsRepository {
  async create(data: any) {
    return await prisma.report.create({ data });
  }

  async findById(id: string) {
    return await prisma.report.findUnique({ where: { id } });
  }

  async findMany(organizationId: string, skip: number, take: number) {
    return await prisma.report.findMany({
      where: { organizationId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(organizationId: string) {
    return await prisma.report.count({ where: { organizationId } });
  }

  async update(id: string, data: any) {
    return await prisma.report.update({ where: { id }, data });
  }

  async delete(id: string) {
    return await prisma.report.delete({ where: { id } });
  }
}

export const reportsRepository = new ReportsRepository();
