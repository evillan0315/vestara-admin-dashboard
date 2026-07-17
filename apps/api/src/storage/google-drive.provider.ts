// ──────────────────────────────────────────────
// Google Drive Storage Provider (Placeholder)
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

export class GoogleDriveStorageProvider implements StorageProvider {
  public readonly type = 'GOOGLE_DRIVE' as const;
  public readonly config: StorageProviderConfig;

  constructor(config: StorageProviderConfig) {
    this.config = config;

    if (
      !config.googleDriveClientId ||
      !config.googleDriveClientSecret ||
      !config.googleDriveRefreshToken
    ) {
      throw new Error(
        'Google Drive configuration is incomplete. Required: clientId, clientSecret, refreshToken',
      );
    }

    // TODO: Initialize Google Drive API client
    console.warn('Google Drive provider is not fully implemented yet');
  }

  async upload(_buffer: Buffer, _options: UploadOptions): Promise<UploadResult> {
    throw new Error('Google Drive upload not implemented yet');
  }

  async download(_key: string): Promise<Buffer> {
    throw new Error('Google Drive download not implemented yet');
  }

  async getMetadata(_key: string): Promise<FileMetadata> {
    throw new Error('Google Drive getMetadata not implemented yet');
  }

  async list(_options: ListOptions): Promise<ListResult> {
    throw new Error('Google Drive list not implemented yet');
  }

  async delete(_options: DeleteOptions): Promise<void> {
    throw new Error('Google Drive delete not implemented yet');
  }

  async getSignedUrl(_key: string, _expiresIn?: number): Promise<string> {
    throw new Error('Google Drive getSignedUrl not implemented yet');
  }

  async exists(_key: string): Promise<boolean> {
    throw new Error('Google Drive exists not implemented yet');
  }
}
