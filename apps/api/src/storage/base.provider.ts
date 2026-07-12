// ──────────────────────────────────────────────
// Base Storage Provider
// ──────────────────────────────────────────────

import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import type {
  StorageProvider,
  StorageProviderConfig,
  UploadOptions,
  UploadResult,
  FileMetadata,
  ListOptions,
  ListResult,
  DeleteOptions,
  StorageProviderType,
} from './types.js';

export abstract class BaseStorageProvider implements StorageProvider {
  public readonly config: StorageProviderConfig;
  public abstract readonly type: StorageProviderType;

  constructor(config: StorageProviderConfig) {
    this.config = config;
  }

  protected generateKey(filename: string, folder?: string): string {
    const ext = path.extname(filename);
    const baseName = path.basename(filename, ext);
    const uniqueId = uuidv4().slice(0, 8);
    const timestamp = Date.now();
    const key = `${baseName}-${timestamp}-${uniqueId}${ext}`;
    return folder ? `${folder}/${key}` : key;
  }

  abstract upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult>;
  abstract download(key: string): Promise<Buffer>;
  abstract getMetadata(key: string): Promise<FileMetadata>;
  abstract list(options: ListOptions): Promise<ListResult>;
  abstract delete(options: DeleteOptions): Promise<void>;
  abstract getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  abstract exists(key: string): Promise<boolean>;
}