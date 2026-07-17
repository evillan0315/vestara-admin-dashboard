// ──────────────────────────────────────────────
// S3 Storage Provider (Placeholder)
// ──────────────────────────────────────────────

import type {
  StorageProvider,
  StorageProviderConfig,
  UploadOptions,
  UploadResult,
  FileMetadata,
  ListOptions,
  ListResult,
  DeleteOptions,
} from './types.js';

export class S3StorageProvider implements StorageProvider {
  public readonly type = 'S3' as const;
  public readonly config: StorageProviderConfig;

  constructor(config: StorageProviderConfig) {
    this.config = config;

    if (
      !config.s3Region ||
      !config.s3Bucket ||
      !config.s3AccessKeyId ||
      !config.s3SecretAccessKey
    ) {
      throw new Error(
        'S3 configuration is incomplete. Required: region, bucket, accessKeyId, secretAccessKey',
      );
    }

    // TODO: Initialize S3 client
    console.warn('S3 provider is not fully implemented yet');
  }

  async upload(_buffer: Buffer, _options: UploadOptions): Promise<UploadResult> {
    throw new Error('S3 upload not implemented yet');
  }

  async download(_key: string): Promise<Buffer> {
    throw new Error('S3 download not implemented yet');
  }

  async getMetadata(_key: string): Promise<FileMetadata> {
    throw new Error('S3 getMetadata not implemented yet');
  }

  async list(_options: ListOptions): Promise<ListResult> {
    throw new Error('S3 list not implemented yet');
  }

  async delete(_options: DeleteOptions): Promise<void> {
    throw new Error('S3 delete not implemented yet');
  }

  async getSignedUrl(_key: string, _expiresIn?: number): Promise<string> {
    throw new Error('S3 getSignedUrl not implemented yet');
  }

  async exists(_key: string): Promise<boolean> {
    throw new Error('S3 exists not implemented yet');
  }
}
