// ──────────────────────────────────────────────
// Local Storage Provider
// ──────────────────────────────────────────────

import fs from 'fs/promises';
import path from 'path';
import { BaseStorageProvider } from './base.provider.js';
import type {
  StorageProviderType,
  StorageProviderConfig,
  UploadOptions,
  UploadResult,
  FileMetadata,
  ListOptions,
  ListResult,
  DeleteOptions,
} from './types.js';

export class LocalStorageProvider extends BaseStorageProvider {
  public readonly type: StorageProviderType = 'LOCAL';
  private readonly basePath: string;

  constructor(config: StorageProviderConfig) {
    super(config);
    this.basePath = config.localPath || path.resolve(process.cwd(), 'uploads');
  }

  private async ensureDir(dir: string): Promise<void> {
    await fs.mkdir(dir, { recursive: true });
  }

  private getFullPath(key: string): string {
    return path.join(this.basePath, key);
  }

  private getPublicUrl(key: string): string {
    return `/api/files/${key}`;
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const key = this.generateKey(options.filename, options.folder);
    const fullPath = this.getFullPath(key);

    await this.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, buffer);

    const stats = await fs.stat(fullPath);

    return {
      url: this.getPublicUrl(key),
      key,
      provider: this.type,
      metadata: {
        ...options.metadata,
        size: stats.size,
        contentType: options.contentType,
      },
    };
  }

  async download(key: string): Promise<Buffer> {
    const fullPath = this.getFullPath(key);
    return fs.readFile(fullPath);
  }

  async getMetadata(key: string): Promise<FileMetadata> {
    const fullPath = this.getFullPath(key);
    const stats = await fs.stat(fullPath);

    return {
      key,
      url: this.getPublicUrl(key),
      size: stats.size,
      contentType: 'application/octet-stream',
      lastModified: stats.mtime,
      provider: this.type,
    };
  }

  async list(options: ListOptions = {}): Promise<ListResult> {
    const targetDir = options.folder ? this.getFullPath(options.folder) : this.basePath;

    try {
      await fs.access(targetDir);
    } catch {
      return { files: [], folders: [] };
    }

    const entries = await fs.readdir(targetDir, { withFileTypes: true });
    const files: FileMetadata[] = [];
    const folders: string[] = [];

    for (const entry of entries) {
      const entryPath = path.join(targetDir, entry.name);
      const relativeKey = options.folder ? `${options.folder}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        folders.push(relativeKey);
      } else {
        const stats = await fs.stat(entryPath);
        files.push({
          key: relativeKey,
          url: this.getPublicUrl(relativeKey),
          size: stats.size,
          contentType: 'application/octet-stream',
          lastModified: stats.mtime,
          provider: this.type,
        });
      }
    }

    return { files, folders };
  }

  async delete(options: DeleteOptions): Promise<void> {
    const fullPath = this.getFullPath(options.key);
    await fs.unlink(fullPath);
  }

  async getSignedUrl(key: string, _expiresIn?: number): Promise<string> {
    return this.getPublicUrl(key);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.getFullPath(key));
      return true;
    } catch {
      return false;
    }
  }
}