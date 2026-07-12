// ──────────────────────────────────────────────
// Storage Provider Factory
// ──────────────────────────────────────────────

import { LocalStorageProvider } from './local.provider.js';
import { CloudinaryStorageProvider } from './cloudinary.provider.js';
import type { StorageProvider, StorageProviderConfig } from './types.js';

class StorageProviderFactory {
  private cache: Map<string, StorageProvider> = new Map();

  private getCacheKey(config: StorageProviderConfig): string {
    return `${config.provider}:${JSON.stringify(config)}`;
  }

  create(config: StorageProviderConfig): StorageProvider {
    const cacheKey = this.getCacheKey(config);

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let provider: StorageProvider;

    switch (config.provider) {
      case 'local':
        provider = new LocalStorageProvider({ ...config, localPath: config.localPath });
        break;
      case 'cloudinary':
        provider = new CloudinaryStorageProvider({
          provider: 'cloudinary',
          cloudinaryCloudName: config.cloudinaryCloudName!,
          cloudinaryApiKey: config.cloudinaryApiKey!,
          cloudinaryApiSecret: config.cloudinaryApiSecret!,
        });
        break;
      case 's3':
        throw new Error('S3 storage provider not yet implemented');
      case 'google_drive':
        throw new Error('Google Drive storage provider not yet implemented');
      default:
        throw new Error(`Unknown storage provider: ${config.provider}`);
    }

    this.cache.set(cacheKey, provider);
    return provider;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCached(config: StorageProviderConfig): StorageProvider | undefined {
    return this.cache.get(this.getCacheKey(config));
  }
}

export const storageProviderFactory = new StorageProviderFactory();