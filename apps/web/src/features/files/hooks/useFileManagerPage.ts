import { useState, useCallback, useRef, useMemo } from 'react';
import type { SortState } from '../../../components/data/DataTable';
import { useToast } from '../../../components/feedback/Toast';
import {
  useFolderContents,
  useUploadFiles,
  useCreateFolder,
  useUpdateFile,
  useDeleteFile,
  useBulkDeleteFiles,
} from '../hooks';
import type { FileItemDTO, FolderItemDTO } from '../../../api/files';

interface BreadcrumbItem {
  id: string | null;
  label: string;
}

export function useFileManagerPage() {
  const { showSuccess, showError } = useToast();

  const [folderStack, setFolderStack] = useState<BreadcrumbItem[]>([{ id: null, label: 'Files' }]);
  const currentFolderId = folderStack[folderStack.length - 1]?.id ?? null;

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sort, setSort] = useState<SortState>({ field: 'createdAt', direction: 'desc' });
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [renameTarget, setRenameTarget] = useState<FileItemDTO | FolderItemDTO | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveTargetIds, setMoveTargetIds] = useState<string[]>([]);
  const [availableFolders, setAvailableFolders] = useState<FolderItemDTO[]>([]);
  const [selectedMoveFolderId, setSelectedMoveFolderId] = useState<string | null>(null);
  const [loadingFolders, setLoadingFolders] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<FileItemDTO | FolderItemDTO | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const [previewFile, setPreviewFile] = useState<FileItemDTO | null>(null);

  const { data: contents, isLoading, isError, error, refetch } = useFolderContents(currentFolderId);

  const uploadMutation = useUploadFiles();
  const createFolderMutation = useCreateFolder();
  const updateFileMutation = useUpdateFile();
  const deleteFileMutation = useDeleteFile();
  const bulkDeleteMutation = useBulkDeleteFiles();

  const files = contents?.files ?? [];
  const folders = contents?.folders ?? [];

  const filteredFiles = useMemo(() => {
    if (!search) return files;
    const q = search.toLowerCase();
    return files.filter(
      (f) =>
        f.originalName.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        f.mimeType.toLowerCase().includes(q),
    );
  }, [files, search]);

  const sortedFolders = useMemo(() => {
    return [...folders].sort((a, b) => {
      let cmp = a.name.localeCompare(b.name);
      if (sort.field === 'createdAt') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [folders, sort]);

  // ── Navigation ──

  const navigateToFolder = useCallback((folderId: string, folderName: string) => {
    setFolderStack((prev) => [...prev, { id: folderId, label: folderName }]);
    setSelectedIds([]);
    setSearch('');
  }, []);

  const navigateToBreadcrumb = useCallback((index: number) => {
    setFolderStack((prev) => prev.slice(0, index + 1));
    setSelectedIds([]);
    setSearch('');
  }, []);

  // ── Upload ──

  const handleUploadOpen = useCallback(() => {
    setUploadFiles([]);
    setUploadProgress(null);
    setUploadDialogOpen(true);
  }, []);

  const handleUploadClose = useCallback(() => {
    setUploadDialogOpen(false);
    setUploadFiles([]);
    setUploadProgress(null);
  }, []);

  const handleFilesSelected = useCallback((selectedFiles: FileList | File[]) => {
    setUploadFiles((prev) => [...prev, ...Array.from(selectedFiles)]);
  }, []);

  const handleRemoveUploadFile = useCallback((index: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUploadSubmit = useCallback(async () => {
    if (uploadFiles.length === 0) return;
    try {
      await uploadMutation.mutateAsync({
        files: uploadFiles,
        folderId: currentFolderId,
        onProgress: setUploadProgress,
      });
      showSuccess(`Uploaded ${uploadFiles.length} file${uploadFiles.length === 1 ? '' : 's'}`);
      handleUploadClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Upload failed');
    }
  }, [uploadFiles, currentFolderId, uploadMutation, showSuccess, showError, handleUploadClose]);

  // ── Create Folder ──

  const handleCreateFolderOpen = useCallback(() => {
    setNewFolderName('');
    setCreateFolderOpen(true);
  }, []);

  const handleCreateFolderSubmit = useCallback(async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolderMutation.mutateAsync({
        name: newFolderName.trim(),
        parentFolderId: currentFolderId,
      });
      showSuccess('Folder created successfully');
      setCreateFolderOpen(false);
      setNewFolderName('');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create folder');
    }
  }, [newFolderName, currentFolderId, createFolderMutation, showSuccess, showError]);

  // ── Rename ──

  const handleRenameOpen = useCallback((item: FileItemDTO | FolderItemDTO) => {
    setRenameTarget(item);
    setRenameValue(item.name);
  }, []);

  const handleRenameSubmit = useCallback(async () => {
    if (!renameTarget || !renameValue.trim()) return;
    try {
      await updateFileMutation.mutateAsync({
        id: renameTarget.id,
        data: { name: renameValue.trim() },
        currentFolderId,
      });
      showSuccess('Renamed successfully');
      setRenameTarget(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to rename');
    }
  }, [renameTarget, renameValue, currentFolderId, updateFileMutation, showSuccess, showError]);

  // ── Move ──

  const handleMoveOpen = useCallback(
    async (ids: string[]) => {
      setMoveTargetIds(ids);
      setSelectedMoveFolderId(null);
      setMoveDialogOpen(true);
      setLoadingFolders(true);
      try {
        const rootContents = await refetch();
        const allFolders = rootContents.data?.folders ?? [];
        setAvailableFolders(allFolders);
      } catch {
        setAvailableFolders([]);
      } finally {
        setLoadingFolders(false);
      }
    },
    [refetch],
  );

  const handleMoveSingle = useCallback(
    async (file: FileItemDTO) => {
      await handleMoveOpen([file.id]);
    },
    [handleMoveOpen],
  );

  const handleMoveSubmit = useCallback(async () => {
    if (moveTargetIds.length === 0) return;
    try {
      const { filesApi } = await import('../../../api/files');
      await filesApi.moveFiles(moveTargetIds, selectedMoveFolderId);
      showSuccess(`Moved ${moveTargetIds.length} item${moveTargetIds.length === 1 ? '' : 's'}`);
      setMoveDialogOpen(false);
      refetch();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to move files');
    }
  }, [moveTargetIds, selectedMoveFolderId, showSuccess, showError, refetch]);

  // ── Delete ──

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteFileMutation.mutateAsync({
        id: deleteTarget.id,
        currentFolderId,
      });
      showSuccess('Deleted successfully');
      setDeleteTarget(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Delete failed');
    }
  }, [deleteTarget, currentFolderId, deleteFileMutation, showSuccess, showError]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;
    try {
      await bulkDeleteMutation.mutateAsync({
        fileIds: selectedIds,
        currentFolderId,
      });
      showSuccess(`Deleted ${selectedIds.length} item${selectedIds.length === 1 ? '' : 's'}`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Bulk delete failed');
    }
  }, [selectedIds, currentFolderId, bulkDeleteMutation, showSuccess, showError]);

  // ── Download ──

  const handleDownload = useCallback(
    async (file: FileItemDTO) => {
      try {
        if (file.url) {
          window.open(file.url, '_blank');
        } else {
          const { filesApi } = await import('../../../api/files');
          const res = await filesApi.getDownloadUrl(file.id);
          if (res.data?.url) {
            window.open(res.data.url, '_blank');
          }
        }
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Download failed');
      }
    },
    [showError],
  );

  // ── Preview ──

  const handlePreview = useCallback((file: FileItemDTO) => {
    if (file.mimeType.startsWith('image/') && !file.mimeType.includes('svg')) {
      setPreviewFile(file);
    }
  }, []);

  // ── Drag & Drop ──

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
      setUploadDialogOpen(true);
    }
  }, []);

  return {
    folderStack,
    currentFolderId,
    viewMode,
    sort,
    search,
    selectedIds,
    uploadDialogOpen,
    uploadFiles,
    uploadProgress,
    isDragActive,
    fileInputRef,
    createFolderOpen,
    newFolderName,
    renameTarget,
    renameValue,
    moveDialogOpen,
    moveTargetIds,
    availableFolders,
    selectedMoveFolderId,
    loadingFolders,
    deleteTarget,
    bulkDeleteOpen,
    previewFile,
    files,
    folders,
    filteredFiles,
    sortedFolders,
    isLoading,
    isError,
    error,
    refetch,
    uploadMutation,
    createFolderMutation,
    updateFileMutation,
    deleteFileMutation,
    bulkDeleteMutation,
    navigateToFolder,
    navigateToBreadcrumb,
    handleUploadOpen,
    handleUploadClose,
    handleFilesSelected,
    handleRemoveUploadFile,
    handleUploadSubmit,
    handleCreateFolderOpen,
    handleCreateFolderSubmit,
    handleRenameOpen,
    handleRenameSubmit,
    handleMoveOpen,
    handleMoveSingle,
    handleMoveSubmit,
    handleDelete,
    handleBulkDelete,
    handleDownload,
    handlePreview,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    setSort,
    setSearch,
    setViewMode,
    setSelectedIds,
    setDeleteTarget,
    setNewFolderName,
    setCreateFolderOpen,
    setRenameTarget,
    setRenameValue,
    setMoveDialogOpen,
    setSelectedMoveFolderId,
    setBulkDeleteOpen,
    setPreviewFile,
    setMoveTargetIds,
  };
}
