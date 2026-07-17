// ──────────────────────────────────────────────
// File Repository
// ──────────────────────────────────────────────

import prisma from '../utils/prisma.js';
import { BaseRepository } from './base.repository.js';
import type { Prisma, StorageProvider } from '../generated/prisma/client.js';

type GroupByProvider = { provider: StorageProvider; _count: { id: number } };
type GroupByMimeType = { mimeType: string; _count: { id: number } };

export class FileRepository extends BaseRepository {
  private model = prisma.file;

  async create(data: {
    name: string;
    originalName: string;
    mimeType: string;
    size: bigint;
    path: string;
    url?: string | null;
    provider: StorageProvider;
    providerId?: string | null;
    folderId?: string | null;
    uploadedBy: string;
    organizationId: string;
  }) {
    return this.model.create({
      data: {
        ...data,
        size: data.size,
      },
    });
  }

  async findById(id: string, organizationId: string) {
    return this.model.findFirst({
      where: { id, organizationId },
    });
  }

  async findByIdOrThrow(id: string, organizationId: string) {
    const file = await this.findById(id, organizationId);
    if (!file) {
      throw new Error('FILE_NOT_FOUND');
    }
    return file;
  }

  async findMany(params: {
    organizationId: string;
    folderId?: string | null;
    mimeType?: string;
    search?: string;
    page?: number;
    perPage?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const {
      organizationId,
      folderId,
      mimeType,
      search,
      page = 1,
      perPage = 20,
      sort = 'createdAt',
      order = 'desc',
    } = params;

    const where: Prisma.FileWhereInput = {
      organizationId,
      ...(folderId !== undefined && { folderId }),
      ...(mimeType && { mimeType: { startsWith: mimeType } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { originalName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.model.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { [sort]: order },
      }),
      this.model.count({ where }),
    ]);

    return { items, total };
  }

  async getFolderContents(organizationId: string, folderId: string | null) {
    const where: Prisma.FileWhereInput = {
      organizationId,
      folderId,
    };

    const [files, folders] = await Promise.all([
      this.model.findMany({
        where: { ...where, mimeType: { not: 'folder' } },
        orderBy: { createdAt: 'desc' },
      }),
      this.model.findMany({
        where: { ...where, mimeType: 'folder' },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      files: files.map((f) => ({
        id: f.id,
        name: f.name,
        originalName: f.originalName,
        mimeType: f.mimeType,
        size: f.size,
        path: f.path,
        url: f.url,
        provider: f.provider,
        createdAt: f.createdAt,
      })),
      folders: folders.map((f) => ({
        id: f.id,
        name: f.name,
        folderId: f.folderId || undefined,
        createdAt: f.createdAt,
      })),
    };
  }

  async update(
    id: string,
    organizationId: string,
    data: { name?: string; folderId?: string | null },
  ) {
    return this.model.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    return this.model.delete({
      where: { id, organizationId },
    });
  }

  async deleteMany(ids: string[], organizationId: string) {
    return this.model.deleteMany({
      where: { id: { in: ids }, organizationId },
    });
  }

  async moveToFolder(ids: string[], organizationId: string, folderId: string | null) {
    return this.model.updateMany({
      where: { id: { in: ids }, organizationId },
      data: { folderId },
    });
  }

  async getStats(organizationId: string) {
    const [totalFiles, totalSize, byProvider, byMimeType] = await Promise.all([
      this.model.count({ where: { organizationId, mimeType: { not: 'folder' } } }),
      this.model.aggregate({
        where: { organizationId, mimeType: { not: 'folder' } },
        _sum: { size: true },
      }),
      this.model.groupBy({
        by: ['provider'],
        where: { organizationId, mimeType: { not: 'folder' } },
        _count: { id: true },
      }),
      this.model.groupBy({
        by: ['mimeType'],
        where: { organizationId, mimeType: { not: 'folder' } },
        _count: { id: true },
      }),
    ]);

    return {
      totalFiles,
      totalSize: totalSize._sum.size || BigInt(0),
      byProvider: byProvider.reduce((acc: Record<string, number>, p: GroupByProvider) => {
        acc[p.provider] = p._count.id;
        return acc;
      }, {}),
      byMimeType: byMimeType.reduce((acc: Record<string, number>, m: GroupByMimeType) => {
        acc[m.mimeType] = m._count.id;
        return acc;
      }, {}),
    };
  }
}
