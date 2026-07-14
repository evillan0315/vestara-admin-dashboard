// ──────────────────────────────────────────────
// File Service
// ──────────────────────────────────────────────

import { AuditAction } from '@vestara/types';
import { StorageProvider } from '../generated/prisma/client.js';
import { fileRepository, auditLogRepository, settingsRepository } from '../repositories/index.js';
import { storageProviderFactory } from '../storage/factory.js';
import type { StorageProviderConfig, StorageProviderConfigType } from '../storage/types.js';

export interface FileUploadResult {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: bigint;
  path: string;
  url?: string | null;
  provider: string;
  folderId?: string | null;
  createdAt: Date;
}

export interface FolderResult {
  id: string;
  name: string;
  folderId?: string | null;
  createdAt: Date;
}

export interface FileListResult {
  items: Array<{
    id: string;
    name: string;
    originalName: string;
    mimeType: string;
    size: bigint;
    path: string;
    url?: string | null;
    provider: string;
    folderId?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  total: number;
}

export interface FolderContentsResult {
  files: Array<{
    id: string;
    name: string;
    originalName: string;
    mimeType: string;
    size: bigint;
    path: string;
    url?: string | null;
    provider: string;
    createdAt: Date;
  }>;
  folders: Array<{
    id: string;
    name: string;
    folderId?: string | null;
    createdAt: Date;
  }>;
}

export interface FileStats {
  totalFiles: number;
  totalSize: bigint;
  byProvider: Record<string, number>;
  byMimeType: Record<string, number>;
}

export interface StorageSettings {
  provider: string;
  config: Record<string, unknown>;
}

export class FileService {
  /**
   * Get storage settings for an organization
   */
  async getStorageSettings(organizationId: string): Promise<StorageSettings> {
    const setting = await settingsRepository.findByKey('storage', organizationId).catch(() => null);

    if (setting?.value) {
      return setting.value as unknown as StorageSettings;
    }

    // Default to local storage
    return {
      provider: 'LOCAL',
      config: {},
    };
  }

  /**
   * Update storage settings for an organization
   */
  async updateStorageSettings(
    organizationId: string,
    settings: StorageSettings,
    updatedBy: string
  ): Promise<StorageSettings> {
    await settingsRepository.upsert(
      'storage',
      settings as unknown as Record<string, unknown>,
      updatedBy,
      organizationId
    );

    // Clear factory cache to force new provider instance
    storageProviderFactory.clearCache();

    return settings;
  }

  /**
   * Get the storage provider instance for an organization
   */
  private async getProvider(organizationId: string) {
    const settings = await this.getStorageSettings(organizationId);
    const config = this.buildProviderConfig(settings);
    return storageProviderFactory.create(config);
  }

  /**
   * Build provider config from settings
   */
  private buildProviderConfig(settings: StorageSettings): StorageProviderConfig {
    const providerMap: Record<string, StorageProviderConfigType> = {
      'LOCAL': 'local',
      'CLOUDINARY': 'cloudinary',
      'S3': 's3',
      'GOOGLE_DRIVE': 'google_drive',
    };

    const baseConfig: StorageProviderConfig = {
      provider: (providerMap[settings.provider] || 'local') as StorageProviderConfigType,
      ...settings.config,
    } as StorageProviderConfig;

    // Add environment variable fallbacks
    if (settings.provider === 'LOCAL') {
      baseConfig.localPath = baseConfig.localPath || process.env.UPLOAD_PATH || './uploads';
    } else if (settings.provider === 'CLOUDINARY') {
      baseConfig.cloudinaryCloudName = baseConfig.cloudinaryCloudName || process.env.CLOUDINARY_CLOUD_NAME;
      baseConfig.cloudinaryApiKey = baseConfig.cloudinaryApiKey || process.env.CLOUDINARY_API_KEY;
      baseConfig.cloudinaryApiSecret = baseConfig.cloudinaryApiSecret || process.env.CLOUDINARY_API_SECRET;
    } else if (settings.provider === 'S3') {
      baseConfig.s3Bucket = baseConfig.s3Bucket || process.env.S3_BUCKET;
      baseConfig.s3Region = baseConfig.s3Region || process.env.S3_REGION;
      baseConfig.s3AccessKeyId = baseConfig.s3AccessKeyId || process.env.S3_ACCESS_KEY_ID;
      baseConfig.s3SecretAccessKey = baseConfig.s3SecretAccessKey || process.env.S3_SECRET_ACCESS_KEY;
      baseConfig.s3Endpoint = baseConfig.s3Endpoint || process.env.S3_ENDPOINT;
    }

    return baseConfig;
  }

  /**
   * Generate a unique filename for storage
   */
  private generateStorageKey(originalName: string, folderId?: string | null): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const extension = originalName.split('.').pop() || '';
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 100);
    const folderPrefix = folderId ? `folders/${folderId}/` : 'files/';
    return `${folderPrefix}${timestamp}-${randomSuffix}-${sanitizedName}.${extension}`;
  }

  /**
   * Upload a file
   */
  async uploadFile(
    organizationId: string,
    userId: string,
    file: Buffer,
    originalName: string,
    mimeType: string,
    folderId?: string | null
  ): Promise<FileUploadResult> {
    const provider = await this.getProvider(organizationId);
    const storageKey = this.generateStorageKey(originalName, folderId);

    const uploadResult = await provider.upload(file, {
      filename: storageKey,
      contentType: mimeType,
      folder: folderId ? `folders/${folderId}` : 'files',
      metadata: {
        originalName,
        uploadedBy: userId,
        organizationId,
      },
    });

    // Save file record to database
    const fileRecord = await fileRepository.create({
      name: storageKey,
      originalName,
      mimeType,
      size: BigInt(file.length),
      path: uploadResult.key,
      url: uploadResult.url,
      provider: uploadResult.provider,
      providerId: uploadResult.key,
      folderId,
      uploadedBy: userId,
      organizationId,
    });

    // Audit log
    await auditLogRepository.create({
      action: AuditAction.CREATE,
      entity: 'file',
      entityId: fileRecord.id,
      userId,
      organizationId,
      metadata: {
        originalName,
        mimeType,
        size: file.length,
        provider: uploadResult.provider,
        folderId,
      },
      ipAddress: undefined,
      userAgent: undefined,
    });

    return {
      id: fileRecord.id,
      name: fileRecord.name,
      originalName: fileRecord.originalName,
      mimeType: fileRecord.mimeType,
      size: fileRecord.size,
      path: fileRecord.path,
      url: fileRecord.url,
      provider: fileRecord.provider,
      folderId: fileRecord.folderId,
      createdAt: fileRecord.createdAt,
    };
  }

  /**
   * Create a folder
   */
  async createFolder(organizationId: string, userId: string, name: string, parentFolderId?: string | null): Promise<FolderResult> {
    // Validate parent folder exists if provided
    if (parentFolderId) {
      const parentFolder = await fileRepository.findById(parentFolderId, organizationId);
      if (!parentFolder || parentFolder.mimeType !== 'folder') {
        throw new Error('PARENT_FOLDER_NOT_FOUND');
      }
    }

    // Check if folder with same name exists in parent
    const existing = await fileRepository.findMany({
      organizationId,
      folderId: parentFolderId,
      mimeType: 'folder',
    });

    if (existing.items.some((f: { name: string }) => f.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('FOLDER_EXISTS');
    }

    const folderRecord = await fileRepository.create({
      name,
      originalName: name,
      mimeType: 'folder',
      size: BigInt(0),
      path: '',
      url: null,
      provider: StorageProvider.LOCAL,
      providerId: null,
      folderId: parentFolderId,
      uploadedBy: userId,
      organizationId,
    });

    // Audit log
    await auditLogRepository.create({
      action: AuditAction.CREATE,
      entity: 'folder',
      entityId: folderRecord.id,
      userId,
      organizationId,
      metadata: {
        name,
        parentFolderId,
      },
      ipAddress: undefined,
      userAgent: undefined,
    });

    return {
      id: folderRecord.id,
      name: folderRecord.name,
      folderId: folderRecord.folderId || undefined,
      createdAt: folderRecord.createdAt,
    };
  }

  /**
   * Get file by ID
   */
  async getFile(organizationId: string, fileId: string) {
    return fileRepository.findByIdOrThrow(fileId, organizationId);
  }

  /**
   * List files with pagination
   */
  async listFiles(organizationId: string, params: {
    folderId?: string | null;
    mimeType?: string;
    search?: string;
    page?: number;
    perPage?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }): Promise<FileListResult> {
    const { items, total } = await fileRepository.findMany({ organizationId, ...params });

    return {
      items: items.map((file: { id: string; name: string; originalName: string; mimeType: string; size: bigint; path: string; url: string | null; provider: string; folderId: string | null; createdAt: Date; updatedAt: Date }) => ({
        id: file.id,
        name: file.name,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        path: file.path,
        url: file.url,
        provider: file.provider,
        folderId: file.folderId || undefined,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      })),
      total,
    };
  }

  /**
   * Get folder contents (files + subfolders)
   */
  async getFolderContents(organizationId: string, folderId: string | null): Promise<FolderContentsResult> {
    return fileRepository.getFolderContents(organizationId, folderId);
  }

  /**
   * Update file metadata
   */
  async updateFile(organizationId: string, fileId: string, userId: string, data: { name?: string; folderId?: string | null }) {
    // If moving to a folder, validate it exists
    if (data.folderId !== undefined && data.folderId !== null) {
      const folder = await fileRepository.findById(data.folderId, organizationId);
      if (!folder || folder.mimeType !== 'folder') {
        throw new Error('TARGET_FOLDER_NOT_FOUND');
      }
    }

    const updated = await fileRepository.update(fileId, organizationId, data);

    // Audit log
    await auditLogRepository.create({
      action: AuditAction.UPDATE,
      entity: 'file',
      entityId: fileId,
      userId,
      organizationId,
      metadata: {
        changes: data,
      },
      ipAddress: undefined,
      userAgent: undefined,
    });

    return {
      id: updated.id,
      name: updated.name,
      originalName: updated.originalName,
      mimeType: updated.mimeType,
      size: updated.size,
      path: updated.path,
      url: updated.url,
      provider: updated.provider,
      folderId: updated.folderId || undefined,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Delete a file
   */
  async deleteFile(organizationId: string, fileId: string, userId: string): Promise<void> {
    const file = await fileRepository.findByIdOrThrow(fileId, organizationId);

    // Get storage provider
    const provider = await this.getProvider(organizationId);

    // Delete from storage if it's a file (not folder)
    if (file.mimeType !== 'folder' && file.path) {
      try {
        await provider.delete({ key: file.path });
      } catch (error) {
        console.error('Failed to delete from storage:', error);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    await fileRepository.delete(fileId, organizationId);

    // Audit log
    await auditLogRepository.create({
      action: AuditAction.DELETE,
      entity: file.mimeType === 'folder' ? 'folder' : 'file',
      entityId: fileId,
      userId,
      organizationId,
      metadata: {
        originalName: file.originalName,
        provider: file.provider,
      },
      ipAddress: undefined,
      userAgent: undefined,
    });
  }

  /**
   * Bulk delete files
   */
  async bulkDeleteFiles(organizationId: string, fileIds: string[], userId: string) {
    let deletedCount = 0;

    for (const fileId of fileIds) {
      try {
        await this.deleteFile(organizationId, fileId, userId);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete file ${fileId}:`, error);
      }
    }

    return { count: deletedCount };
  }

  /**
   * Move files to folder
   */
  async moveFiles(organizationId: string, fileIds: string[], folderId: string | null, userId: string) {
    // Validate target folder exists if provided
    if (folderId) {
      const folder = await fileRepository.findById(folderId, organizationId);
      if (!folder || folder.mimeType !== 'folder') {
        throw new Error('TARGET_FOLDER_NOT_FOUND');
      }
    }

    const result = await fileRepository.moveToFolder(fileIds, organizationId, folderId);

    // Audit log
    await auditLogRepository.create({
      action: AuditAction.UPDATE,
      entity: 'file',
      entityId: 'bulk_move',
      userId,
      organizationId,
      metadata: {
        movedFiles: fileIds,
        targetFolderId: folderId,
      },
      ipAddress: undefined,
      userAgent: undefined,
    });

    return result;
  }

  /**
   * Get file statistics
   */
  async getStats(organizationId: string): Promise<FileStats> {
    return fileRepository.getStats(organizationId);
  }
}

export const fileService = new FileService();