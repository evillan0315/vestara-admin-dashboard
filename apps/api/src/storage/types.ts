// ──────────────────────────────────────────────
// Storage Provider Types
// ──────────────────────────────────────────────

import type { StorageProvider as PrismaStorageProvider } from '../generated/prisma/client.js';

// Prisma uses uppercase: LOCAL, CLOUDINARY, S3, GOOGLE_DRIVE
export type StorageProviderType = PrismaStorageProvider;

// Lowercase versions for config
export type StorageProviderConfigType = 'local' | 'cloudinary' | 's3' | 'google_drive';

export interface StorageProviderConfig {
  provider: StorageProviderConfigType;
  // Local storage config
  localPath?: string;
  // Cloudinary config
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  // S3 config
  s3Region?: string;
  s3Bucket?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  s3Endpoint?: string;
  // Google Drive config
  googleDriveClientId?: string;
  googleDriveClientSecret?: string;
  googleDriveRefreshToken?: string;
  googleDriveFolderId?: string;
  // Allow additional properties
  [key: string]: unknown;
}

export interface UploadOptions {
  filename: string;
  contentType: string;
  folder?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  url: string;
  key: string;
  provider: StorageProviderType;
  metadata?: Record<string, unknown>;
}

export interface FileMetadata {
  key: string;
  url: string;
  size: number;
  contentType: string;
  lastModified: Date;
  provider: StorageProviderType;
  metadata?: Record<string, unknown>;
}

export interface ListOptions {
  folder?: string;
  prefix?: string;
  maxKeys?: number;
  continuationToken?: string;
}

export interface ListResult {
  files: FileMetadata[];
  folders: string[];
  continuationToken?: string;
}

export interface DeleteOptions {
  key: string;
}

export interface StorageProvider {
  readonly type: StorageProviderType;
  readonly config: StorageProviderConfig;

  upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult>;
  download(key: string): Promise<Buffer>;
  getMetadata(key: string): Promise<FileMetadata>;
  list(options: ListOptions): Promise<ListResult>;
  delete(options: DeleteOptions): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  exists(key: string): Promise<boolean>;
}
