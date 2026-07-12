// ──────────────────────────────────────────────
// Files — TanStack Query Hooks
// ──────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesApi, type FileListParams } from '../../api/files';

export const fileKeys = {
  all: ['files'] as const,
  stats: () => ['files', 'stats'] as const,
  list: (params?: FileListParams) => ['files', 'list', params] as const,
  folderContents: (folderId: string | null) => ['files', 'folder', folderId] as const,
  detail: (id: string) => ['files', id] as const,
  storageSettings: () => ['files', 'storage', 'settings'] as const,
};

/** Get file statistics */
export function useFileStats() {
  return useQuery({
    queryKey: fileKeys.stats(),
    queryFn: async () => {
      const res = await filesApi.getStats();
      return res.data?.stats;
    },
  });
}

/** List files with pagination */
export function useFiles(params?: FileListParams) {
  return useQuery({
    queryKey: fileKeys.list(params),
    queryFn: () => filesApi.list(params),
  });
}

/** Get folder contents (files + subfolders) */
export function useFolderContents(folderId: string | null) {
  return useQuery({
    queryKey: fileKeys.folderContents(folderId),
    queryFn: async () => {
      if (folderId) {
        const res = await filesApi.getFolderContents(folderId);
        return res.data?.contents;
      }
      const res = await filesApi.getRootContents();
      return res.data?.contents;
    },
  });
}

/** Get file by ID */
export function useFile(id: string) {
  return useQuery({
    queryKey: fileKeys.detail(id),
    queryFn: async () => {
      const res = await filesApi.getById(id);
      return res.data?.file;
    },
    enabled: !!id,
  });
}

/** Upload files */
export function useUploadFiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      files,
      folderId,
      onProgress,
    }: {
      files: File[];
      folderId?: string | null;
      onProgress?: (percent: number) => void;
    }) => {
      const res = await filesApi.upload(files, folderId, onProgress);
      if (!res.success) {
        throw new Error(res.error || 'Upload failed');
      }
      return res.data?.files || [];
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: fileKeys.folderContents(variables.folderId ?? null) });
      queryClient.invalidateQueries({ queryKey: fileKeys.stats() });
    },
  });
}

/** Create folder */
export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      parentFolderId,
    }: {
      name: string;
      parentFolderId?: string | null;
    }) => {
      const res = await filesApi.createFolder({ name, parentFolderId });
      return res.data?.folder;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: fileKeys.folderContents(variables.parentFolderId ?? null),
      });
    },
  });
}

/** Update file (rename/move) */
export function useUpdateFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; folderId?: string | null };
      currentFolderId?: string | null;
    }) => {
      const res = await filesApi.update(id, data);
      return res.data?.file;
    },
    onSuccess: (_data, variables) => {
      // Invalidate both source and destination folders
      queryClient.invalidateQueries({ queryKey: fileKeys.folderContents(variables.currentFolderId ?? null) });
      if (variables.data.folderId !== undefined) {
        queryClient.invalidateQueries({
          queryKey: fileKeys.folderContents(variables.data.folderId),
        });
      }
    },
  });
}

/** Move files to folder */
export function useMoveFiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      fileIds,
      folderId,
    }: {
      fileIds: string[];
      folderId: string | null;
      sourceFolderId?: string | null;
    }) => {
      const res = await filesApi.moveFiles(fileIds, folderId);
      return res.data?.moved;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: fileKeys.folderContents(variables.sourceFolderId ?? null),
      });
      queryClient.invalidateQueries({ queryKey: fileKeys.folderContents(variables.folderId) });
      queryClient.invalidateQueries({ queryKey: fileKeys.stats() });
    },
  });
}

/** Delete file */
export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; currentFolderId?: string | null }) => {
      await filesApi.delete(id);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: fileKeys.folderContents(variables.currentFolderId ?? null),
      });
      queryClient.invalidateQueries({ queryKey: fileKeys.stats() });
    },
  });
}

/** Bulk delete files */
export function useBulkDeleteFiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      fileIds,
    }: {
      fileIds: string[];
      currentFolderId?: string | null;
    }) => {
      const res = await filesApi.bulkDelete(fileIds);
      return res.data?.deleted;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: fileKeys.folderContents(variables.currentFolderId ?? null),
      });
      queryClient.invalidateQueries({ queryKey: fileKeys.stats() });
    },
  });
}
