// ──────────────────────────────────────────────
// Files API Client
// ──────────────────────────────────────────────

import apiClient from './client';

// ── Types ─────────────────────────────────────

export interface FileItemDTO {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url?: string | null;
  provider: string;
  folderId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface FolderItemDTO {
  id: string;
  name: string;
  folderId?: string | null;
  createdAt: string;
}

export interface FolderContentsDTO {
  files: FileItemDTO[];
  folders: FolderItemDTO[];
}

export interface FileStatsDTO {
  totalFiles: number;
  totalSize: number;
  byProvider: Record<string, number>;
  byMimeType: Record<string, number>;
}

export interface FileListParams {
  folderId?: string | null;
  mimeType?: string;
  search?: string;
  page?: number;
  perPage?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface FileListResponse {
  items: FileItemDTO[];
  total: number;
}

export interface FileUploadResult {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url?: string | null;
  provider: string;
  folderId?: string | null;
  createdAt: string;
}

// ── API Calls ─────────────────────────────────

export const filesApi = {
  /** Get file statistics */
  getStats() {
    return apiClient.get<{ stats: FileStatsDTO }>('/files/stats');
  },

  /** List files with pagination and filters */
  list(params?: FileListParams) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.perPage) searchParams.set('perPage', String(params.perPage));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.order) searchParams.set('order', params.order);
    if (params?.mimeType) searchParams.set('mimeType', params.mimeType);
    if (params?.folderId !== undefined && params?.folderId !== null) {
      searchParams.set('folderId', params.folderId);
    }
    const qs = searchParams.toString();
    return apiClient.get<FileListResponse>(`/files${qs ? `?${qs}` : ''}`);
  },

  /** Get root folder contents */
  getRootContents() {
    return apiClient.get<{ contents: FolderContentsDTO }>('/files/folder');
  },

  /** Get folder contents by folder ID */
  getFolderContents(folderId: string) {
    return apiClient.get<{ contents: FolderContentsDTO }>(`/files/folder/${folderId}`);
  },

  /** Get file by ID */
  getById(id: string) {
    return apiClient.get<{ file: FileItemDTO }>(`/files/${id}`);
  },

  /** Upload files */
  async upload(files: File[], folderId?: string | null, onProgress?: (percent: number) => void) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (folderId) formData.append('folderId', folderId);

    const token = localStorage.getItem('accessToken');
    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

    return new Promise<{ success: boolean; data?: { files: FileUploadResult[] }; error?: string }>(
      (resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}/files/upload`);

        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        };

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({ success: true, data: { files: data.data?.files || [] } });
            } else {
              resolve({
                success: false,
                error: data.error?.message || 'Upload failed',
              });
            }
          } catch {
            resolve({ success: false, error: 'Failed to parse upload response' });
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };

        xhr.send(formData);
      },
    );
  },

  /** Create folder */
  createFolder(data: { name: string; parentFolderId?: string | null }) {
    return apiClient.post<{ folder: FolderItemDTO }>('/files/folder', data);
  },

  /** Update file metadata (rename, move) */
  update(id: string, data: { name?: string; folderId?: string | null }) {
    return apiClient.put<{ file: FileItemDTO }>(`/files/${id}`, data);
  },

  /** Get download URL */
  getDownloadUrl(id: string) {
    return apiClient.get<{ url: string }>(`/files/${id}/download`);
  },

  /** Move files to folder */
  moveFiles(fileIds: string[], folderId: string | null) {
    return apiClient.post<{ moved: number }>('/files/move', { fileIds, folderId });
  },

  /** Delete file */
  delete(id: string) {
    return apiClient.delete<void>(`/files/${id}`);
  },

  /** Bulk delete files */
  bulkDelete(fileIds: string[]) {
    return apiClient.post<{ deleted: number }>('/files/bulk-delete', { fileIds });
  },

  /** Get storage settings */
  getStorageSettings() {
    return apiClient.get<{ settings: { provider: string; config: Record<string, unknown> } }>(
      '/files/storage/settings',
    );
  },

  /** Update storage settings */
  updateStorageSettings(settings: { provider: string; config?: Record<string, unknown> }) {
    return apiClient.put('/files/storage/settings', settings);
  },
};
