// ──────────────────────────────────────────────
// Cloudinary Storage Provider
// ──────────────────────────────────────────────

import { v2 as cloudinary } from 'cloudinary';
import { BaseStorageProvider } from './base.provider.js';
import type {
  StorageProviderConfig,
  UploadOptions,
  UploadResult,
  FileMetadata,
  ListOptions,
  ListResult,
  DeleteOptions,
  StorageProviderType,
} from './types.js';

interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  bytes: number;
  format?: string;
  created_at: string;
  width?: number;
  height?: number;
}

interface CloudinaryListResponse {
  resources: CloudinaryResource[];
  next_cursor?: string;
}

interface CloudinaryFoldersResponse {
  folders: Array<{ name: string }>;
}

export class CloudinaryStorageProvider extends BaseStorageProvider {
  public readonly type: StorageProviderType = 'CLOUDINARY';
  public readonly config: StorageProviderConfig;

  constructor(config: StorageProviderConfig) {
    super(config);
    this.config = config;

    if (!config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
      throw new Error('Cloudinary configuration is incomplete. Required: cloudName, apiKey, apiSecret');
    }

    cloudinary.config({
      cloud_name: config.cloudinaryCloudName,
      api_key: config.cloudinaryApiKey,
      api_secret: config.cloudinaryApiSecret,
    });
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const key = this.generateKey(options.filename, options.folder);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: key,
          folder: options.folder,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error || !result) {
            reject(new Error(error?.message || 'Cloudinary upload failed'));
            return;
          }

          resolve({
            url: result.secure_url,
            key: result.public_id,
            provider: this.type,
            metadata: {
              ...options.metadata,
              format: result.format,
              width: result.width,
              height: result.height,
              bytes: result.bytes,
            },
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  async download(_key: string): Promise<Buffer> {
    throw new Error('Direct download not supported for Cloudinary. Use the file URL instead.');
  }

  async getMetadata(key: string): Promise<FileMetadata> {
    try {
      const result = await cloudinary.api.resource(key);

      return {
        key: result.public_id,
        url: result.secure_url,
        size: result.bytes,
        contentType: result.format ? `image/${result.format}` : 'application/octet-stream',
        lastModified: new Date(result.created_at),
        provider: this.type,
        metadata: {
          format: result.format,
          width: result.width,
          height: result.height,
          tags: result.tags,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get Cloudinary metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async list(options: ListOptions = {}): Promise<ListResult> {
    try {
      const folder = options.folder || '';
      const result = (await cloudinary.api.resources({
        type: 'upload',
        prefix: folder ? `${folder}/` : undefined,
        max_results: options.maxKeys || 100,
        next_cursor: options.continuationToken,
      })) as CloudinaryListResponse;

      const files: FileMetadata[] = result.resources.map((resource) => ({
        key: resource.public_id,
        url: resource.secure_url,
        size: resource.bytes,
        contentType: resource.format ? `image/${resource.format}` : 'application/octet-stream',
        lastModified: new Date(resource.created_at),
        provider: this.type,
        metadata: {
          format: resource.format,
          width: resource.width,
          height: resource.height,
        },
      }));

      const foldersResult = (await cloudinary.api.sub_folders(folder)) as CloudinaryFoldersResponse;
      const folders = foldersResult.folders.map((f) => f.name);

      return {
        files,
        folders,
        continuationToken: result.next_cursor,
      };
    } catch (error) {
      throw new Error(`Failed to list Cloudinary resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(options: DeleteOptions): Promise<void> {
    try {
      await cloudinary.uploader.destroy(options.key);
    } catch (error) {
      throw new Error(`Failed to delete Cloudinary resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    const url = cloudinary.url(key, {
      sign_url: true,
      expires_at: expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : undefined,
    });
    return url;
  }

  async exists(key: string): Promise<boolean> {
    try {
      await cloudinary.api.resource(key);
      return true;
    } catch {
      return false;
    }
  }
}