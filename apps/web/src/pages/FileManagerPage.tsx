// ──────────────────────────────────────────────
// File Manager Page
// ──────────────────────────────────────────────

import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  LinearProgress,
  Link,
  Paper,
  TextField,
  Tooltip,
  Typography,
  styled,
} from '@mui/material';
import { Breadcrumbs as MuiBreadcrumbs } from '@mui/material';
import {
  Add as AddIcon,
  Upload as UploadIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  DriveFileMove as MoveIcon,
  Cloud as CloudIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  NavigateNext,
} from '@mui/icons-material';
import { useState, useCallback, useRef, useMemo, type ReactElement, type DragEvent } from 'react';
import { DataTable, type Column, type SortState } from '../components/data/DataTable';
import { ConfirmDialog } from '../components/ui/Modal';
import { useToast } from '../components/feedback/Toast';
import { Loading } from '../components/feedback/Loading';
import {
  useFolderContents,
  useUploadFiles,
  useCreateFolder,
  useUpdateFile,
  useDeleteFile,
  useBulkDeleteFiles,
} from '../features/files/hooks';
import type { FileItemDTO, FolderItemDTO } from '../api/files';

// ── Styled ────────────────────────────────────

const PageContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}));

const FolderCard = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 16px',
  borderRadius: 12,
  cursor: 'pointer',
  transition: 'all 0.2s',
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor:
      theme.palette.mode === 'light'
        ? theme.palette.primary.light + '10'
        : theme.palette.primary.dark + '20',
    transform: 'translateY(-1px)',
    boxShadow: theme.shadows[2],
  },
  minWidth: 180,
  flex: '1 1 auto',
  maxWidth: 280,
}));

const DropZone = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isDragActive',
})<{ isDragActive?: boolean }>(({ theme, isDragActive }) => ({
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: 12,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s',
  backgroundColor: isDragActive
    ? theme.palette.primary.light + '15'
    : 'transparent',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light + '10',
  },
}));

const UploadProgress = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledBreadcrumbContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
}));

// ── Helpers ──────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <ImageIcon color="primary" />;
  if (mimeType.startsWith('video/')) return <ImageIcon color="secondary" />;
  if (mimeType.startsWith('text/') || mimeType.includes('pdf')) return <FileIcon />;
  return <FileIcon />;
}

function getFileColor(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '#1976d2';
  if (mimeType.startsWith('video/')) return '#7b1fa2';
  if (mimeType.includes('pdf')) return '#d32f2f';
  if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml'))
    return '#2e7d32';
  return '#757575';
}

function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/') && !mimeType.includes('svg');
}

// ── Component ─────────────────────────────────

interface BreadcrumbItem {
  id: string | null;
  label: string;
}

export function FileManagerPage(): ReactElement {
  const { showSuccess, showError } = useToast();

  // Navigation state — track folder hierarchy
  const [folderStack, setFolderStack] = useState<BreadcrumbItem[]>([
    { id: null, label: 'Files' },
  ]);
  const currentFolderId = folderStack[folderStack.length - 1]?.id ?? null;

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Sort & search
  const [sort, setSort] = useState<SortState>({ field: 'createdAt', direction: 'desc' });
  const [search, setSearch] = useState('');

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create folder state
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Rename state
  const [renameTarget, setRenameTarget] = useState<FileItemDTO | FolderItemDTO | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Move state
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveTargetIds, setMoveTargetIds] = useState<string[]>([]);
  const [availableFolders, setAvailableFolders] = useState<FolderItemDTO[]>([]);
  const [selectedMoveFolderId, setSelectedMoveFolderId] = useState<string | null>(null);
  const [loadingFolders, setLoadingFolders] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<FileItemDTO | FolderItemDTO | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Preview state
  const [previewFile, setPreviewFile] = useState<FileItemDTO | null>(null);

  // Queries
  const {
    data: contents,
    isLoading,
    isError,
    error,
    refetch,
  } = useFolderContents(currentFolderId);

  // Mutations
  const uploadMutation = useUploadFiles();
  const createFolderMutation = useCreateFolder();
  const updateFileMutation = useUpdateFile();
  const deleteFileMutation = useDeleteFile();
  const bulkDeleteMutation = useBulkDeleteFiles();

  // Combined files + folders
  const files = contents?.files ?? [];
  const folders = contents?.folders ?? [];

  // Filter files by search
  const filteredFiles = useMemo(() => {
    if (!search) return files;
    const q = search.toLowerCase();
    return files.filter(
      (f) =>
        f.originalName.toLowerCase().includes(q) || f.name.toLowerCase().includes(q) || f.mimeType.toLowerCase().includes(q),
    );
  }, [files, search]);

  // ── Navigation Handlers ──

  const navigateToFolder = useCallback(
    (folderId: string, folderName: string) => {
      setFolderStack((prev) => [...prev, { id: folderId, label: folderName }]);
      setSelectedIds([]);
      setSearch('');
    },
    [],
  );

  const navigateToBreadcrumb = useCallback((index: number) => {
    setFolderStack((prev) => prev.slice(0, index + 1));
    setSelectedIds([]);
    setSearch('');
  }, []);

  // ── Upload Handlers ──

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
    const fileArray = Array.from(selectedFiles);
    setUploadFiles((prev) => [...prev, ...fileArray]);
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
      const isFolder = 'mimeType' in renameTarget && renameTarget.mimeType === 'folder';
      if (!isFolder) {
        await updateFileMutation.mutateAsync({
          id: renameTarget.id,
          data: { name: renameValue.trim() },
          currentFolderId,
        });
      } else {
        // Folders are also stored as File records — use update endpoint
        await updateFileMutation.mutateAsync({
          id: renameTarget.id,
          data: { name: renameValue.trim() },
          currentFolderId,
        });
      }
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

      // Fetch available folders (root level for simplicity)
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
      // Use moveFiles API
      const { filesApi } = await import('../api/files');
      await filesApi.moveFiles(moveTargetIds, selectedMoveFolderId);
      showSuccess(`Moved ${moveTargetIds.length} item${moveTargetIds.length === 1 ? '' : 's'}`);
      setMoveDialogOpen(false);
      refetch();
      // Also invalidate target folder if set
      if (selectedMoveFolderId) {
        // The refetch above handles the source folder
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to move files');
    }
  }, [moveTargetIds, selectedMoveFolderId, showSuccess, showError, refetch]);

  // ── Delete ──

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      const isFolder =
        'mimeType' in deleteTarget && deleteTarget.mimeType === 'folder';
      // Check if it's a FileItemDTO (has mimeType) vs FolderItemDTO
      if ('mimeType' in deleteTarget) {
        await deleteFileMutation.mutateAsync({
          id: deleteTarget.id,
          currentFolderId,
        });
      } else {
        await deleteFileMutation.mutateAsync({
          id: deleteTarget.id,
          currentFolderId,
        });
      }
      showSuccess(`${isFolder ? 'Folder' : 'File'} deleted successfully`);
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
        const { filesApi } = await import('../api/files');
        // Try to get a download URL; if file has a direct URL, open it
        if (file.url) {
          window.open(file.url, '_blank');
        } else {
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
    if (isImageFile(file.mimeType)) {
      setPreviewFile(file);
    }
  }, []);

  // ── Drag & Drop ──

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        setUploadFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
        setUploadDialogOpen(true);
      }
    },
    [],
  );

  // ── Columns ──

  const columns: Column<FileItemDTO>[] = [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      render: (_value, row) => (
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: isImageFile(row.mimeType) ? 'pointer' : 'default' }}
          onClick={() => isImageFile(row.mimeType) && handlePreview(row)}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: getFileColor(row.mimeType) + '20',
              color: getFileColor(row.mimeType),
              borderRadius: 1.5,
            }}
          >
            {getFileIcon(row.mimeType)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {row.originalName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.mimeType}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'size',
      label: 'Size',
      width: 100,
      sortable: true,
      render: (value) => (
        <Typography variant="body2" color="text.secondary">
          {formatFileSize(value as number)}
        </Typography>
      ),
    },
    {
      id: 'provider',
      label: 'Storage',
      width: 100,
      sortable: true,
      render: (value) => (
        <Chip
          icon={<CloudIcon />}
          label={String(value)}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.75rem' }}
        />
      ),
    },
    {
      id: 'createdAt',
      label: 'Uploaded',
      width: 140,
      sortable: true,
      render: (value) => (
        <Typography variant="body2" color="text.secondary">
          {formatDate(value as string)}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: '',
      width: 160,
      render: (_value, row) => (
        <Box sx={{ display: 'flex', gap: 0.25 }}>
          <Tooltip title="Download">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDownload(row); }}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Rename">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRenameOpen(row); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Move to folder">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMoveSingle(row); }}>
              <MoveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {isImageFile(row.mimeType) && (
            <Tooltip title="Preview">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handlePreview(row); }}>
                <ImageIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
            >
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Sort folders
  const sortedFolders = useMemo(() => {
    return [...folders].sort((a, b) => {
      let cmp = a.name.localeCompare(b.name);
      if (sort.field === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sort.field === 'createdAt') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [folders, sort]);

  // ── Render ──

  return (
    <PageContainer
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <Box>
        <Typography variant="h4" fontWeight={700}>
          File Manager
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Upload, organize, and manage your files and folders.
        </Typography>
      </Box>

      {/* Breadcrumb */}
      <StyledBreadcrumbContainer>
        <MuiBreadcrumbs
          separator={<NavigateNext fontSize="small" />}
          sx={{ flex: 1 }}
        >
          {folderStack.map((item, index) => {
            const isLast = index === folderStack.length - 1;
            return isLast ? (
              <Typography
                key={item.label}
                color="text.primary"
                sx={{ fontWeight: 500, fontSize: '0.875rem' }}
              >
                {item.label}
              </Typography>
            ) : (
              <Link
                key={item.label}
                component="button"
                underline="hover"
                onClick={() => navigateToBreadcrumb(index)}
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  color: 'text.secondary',
                  cursor: 'pointer',
                  '&:hover': { color: 'primary.main' },
                  bgcolor: 'transparent',
                  border: 'none',
                  fontFamily: 'inherit',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </MuiBreadcrumbs>
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Tooltip title={viewMode === 'list' ? 'Grid view' : 'List view'}>
            <IconButton size="small" onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
              {viewMode === 'list' ? <GridViewIcon /> : <ViewListIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </StyledBreadcrumbContainer>

      {/* Action Bar */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={handleUploadOpen}
        >
          Upload
        </Button>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleCreateFolderOpen}
        >
          New Folder
        </Button>
        {selectedIds.length > 0 && (
          <>
            <Button
              variant="outlined"
              startIcon={<MoveIcon />}
              onClick={() => handleMoveOpen(selectedIds)}
            >
              Move ({selectedIds.length})
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setBulkDeleteOpen(true)}
            >
              Delete ({selectedIds.length})
            </Button>
          </>
        )}
        <Box sx={{ flex: 1 }} />
        <TextField
          size="small"
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              </InputAdornment>
            ),
            ...(search
              ? {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch('')}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              : {}),
          }}
          sx={{ minWidth: 260, maxWidth: 360 }}
        />
      </Box>

      {/* Loading state */}
      {isLoading && <Loading variant="inline" message="Loading files..." />}

      {/* Error state */}
      {isError && !isLoading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error" gutterBottom>
            {error instanceof Error ? error.message : 'Failed to load files'}
          </Typography>
          <Button variant="outlined" onClick={() => refetch()}>
            Retry
          </Button>
        </Paper>
      )}

      {!isLoading && !isError && (
        <>
          {/* Folders Section */}
          {sortedFolders.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                Folders ({sortedFolders.length})
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  flexWrap: 'wrap',
                }}
              >
                {sortedFolders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    onClick={() => navigateToFolder(folder.id, folder.name)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      // For now, just offer rename/delete via the existing dialogs
                      setDeleteTarget(folder);
                    }}
                  >
                    <FolderIcon sx={{ fontSize: 32, color: 'warning.main' }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        noWrap
                        sx={{ maxWidth: 160 }}
                      >
                        {folder.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(folder.createdAt)}
                      </Typography>
                    </Box>
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 0.25 }}>
                      <Tooltip title="Rename">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameOpen(folder);
                          }}
                          sx={{ width: 28, height: 28 }}
                        >
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(folder);
                          }}
                          sx={{ width: 28, height: 28 }}
                        >
                          <DeleteIcon sx={{ fontSize: 16, color: 'error.main' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </FolderCard>
                ))}
              </Box>
            </Box>
          )}

          {/* Files DataTable */}
          <DataTable<FileItemDTO>
            columns={columns}
            rows={filteredFiles}
            keyExtractor={(row) => row.id}
            loading={false}
            sortState={sort}
            onSortChange={setSort}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            searchable={false}
            title={filteredFiles.length > 0 ? `Files (${filteredFiles.length})` : 'Files'}
            emptyIcon={<CloudUploadIcon sx={{ fontSize: 48 }} />}
            emptyTitle={search ? 'No files match your search' : 'No files in this folder'}
            emptyDescription={
              search
                ? 'Try a different search term.'
                : 'Upload files or create a folder to get started.'
            }
            actions={
              filteredFiles.length > 0 && !search ? undefined : undefined
            }
          />
        </>
      )}

      {/* ── Upload Dialog ── */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleUploadClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Upload Files
          <IconButton
            onClick={handleUploadClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {/* Drop zone */}
          <DropZone
            isDragActive={isDragActive}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{ mb: 2 }}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body1" fontWeight={600}>
              Drag & drop files here
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              or click to browse — up to 100MB per file
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  handleFilesSelected(e.target.files);
                  e.target.value = '';
                }
              }}
              hidden
            />
          </DropZone>

          {/* Selected files list */}
          {uploadFiles.length > 0 && (
            <Box sx={{ maxHeight: 240, overflow: 'auto' }}>
              {uploadFiles.map((file, index) => (
                <Box
                  key={`${file.name}-${index}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 0.75,
                    px: 1,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <FileIcon fontSize="small" color="action" />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(file.size)}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveUploadFile(index)}
                    disabled={uploadProgress !== null}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          {/* Upload Progress */}
          {uploadProgress !== null && (
            <UploadProgress>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                Uploading... {uploadProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </UploadProgress>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadClose} disabled={uploadMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={handleUploadSubmit}
            disabled={uploadFiles.length === 0 || uploadMutation.isPending}
          >
            Upload {uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Create Folder Dialog ── */}
      <Dialog
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Create Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolderSubmit();
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFolderOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateFolderSubmit}
            disabled={!newFolderName.trim() || createFolderMutation.isPending}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Rename Dialog ── */}
      <Dialog
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Rename</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="New name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleRenameSubmit}
            disabled={!renameValue.trim() || updateFileMutation.isPending}
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Move Dialog ── */}
      <Dialog
        open={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Move {moveTargetIds.length} item{moveTargetIds.length === 1 ? '' : 's'}
        </DialogTitle>
        <DialogContent>
          {loadingFolders ? (
            <Loading variant="inline" message="Loading folders..." />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  borderColor: selectedMoveFolderId === null ? 'primary.main' : 'divider',
                  bgcolor: selectedMoveFolderId === null ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => setSelectedMoveFolderId(null)}
              >
                <FolderIcon color="warning" />
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Root folder
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Move to the top level
                  </Typography>
                </Box>
                {selectedMoveFolderId === null && (
                  <CheckCircleIcon fontSize="small" color="primary" sx={{ ml: 'auto' }} />
                )}
              </Paper>

              {availableFolders
                .filter((f) => !moveTargetIds.includes(f.id))
                .map((folder) => (
                  <Paper
                    key={folder.id}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      borderColor:
                        selectedMoveFolderId === folder.id ? 'primary.main' : 'divider',
                      bgcolor:
                        selectedMoveFolderId === folder.id ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => setSelectedMoveFolderId(folder.id)}
                  >
                    <FolderIcon color="warning" />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {folder.name}
                      </Typography>
                    </Box>
                    {selectedMoveFolderId === folder.id && (
                      <CheckCircleIcon fontSize="small" color="primary" sx={{ ml: 'auto' }} />
                    )}
                  </Paper>
                ))}

              {availableFolders.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No other folders available in this directory.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleMoveSubmit}
            disabled={moveTargetIds.length === 0}
          >
            Move Here
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={
          deleteTarget && 'mimeType' in (deleteTarget ?? {}) && (deleteTarget as FileItemDTO).mimeType === 'folder'
            ? 'Delete Folder'
            : 'Delete File'
        }
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        loading={deleteFileMutation.isPending}
      />

      {/* ── Bulk Delete Confirmation ── */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Delete Files"
        message={`Are you sure you want to delete ${selectedIds.length} selected file${selectedIds.length === 1 ? '' : 's'}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleBulkDelete}
        onClose={() => setBulkDeleteOpen(false)}
        loading={bulkDeleteMutation.isPending}
      />

      {/* ── Image Preview Dialog ── */}
      <Dialog
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.default',
            borderRadius: 2,
          },
        }}
      >
        {previewFile && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ImageIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
                {previewFile.originalName}
              </Typography>
              <IconButton onClick={() => setPreviewFile(null)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Box
                component="img"
                src={previewFile.url || undefined}
                alt={previewFile.originalName}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '65vh',
                  objectFit: 'contain',
                  borderRadius: 1,
                }}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = '';
                  e.currentTarget.alt = 'Failed to load image';
                }}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(previewFile.size)} &middot; {previewFile.mimeType}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload(previewFile)}
              >
                Download
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </PageContainer>
  );
}

export default FileManagerPage;
