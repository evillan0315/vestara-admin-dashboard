import { useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Paper,
  TextField,
  Typography,
  styled,
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { ConfirmDialog } from '../../../components/ui/Modal';
import { Loading } from '../../../components/feedback/Loading';
import type { FileItemDTO, FolderItemDTO } from '../../../api/files';

const DropZone = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isDragActive',
})<{ isDragActive?: boolean }>(({ theme, isDragActive }) => ({
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: 12,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s',
  backgroundColor: isDragActive ? theme.palette.primary.light + '15' : 'transparent',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light + '10',
  },
}));

const UploadProgress = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

// ── Upload Dialog ──

interface UploadDialogProps {
  open: boolean;
  uploadFiles: File[];
  uploadProgress: number | null;
  isDragActive: boolean;
  uploading: boolean;
  onClose: () => void;
  onFilesSelected: (files: FileList | File[]) => void;
  onRemoveFile: (index: number) => void;
  onSubmit: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export function UploadDialog({
  open,
  uploadFiles,
  uploadProgress,
  isDragActive,
  uploading,
  onClose,
  onFilesSelected,
  onRemoveFile,
  onSubmit,
  onDragOver,
  onDragLeave,
  onDrop,
}: UploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Upload Files
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <DropZone
          isDragActive={isDragActive}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          sx={{ mb: 2 }}
        >
          <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body1" fontWeight={600}>
            Drag & drop files here
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            or click to browse &mdash; up to 100MB per file
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                onFilesSelected(e.target.files);
                e.target.value = '';
              }
            }}
            hidden
          />
        </DropZone>

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
                  onClick={() => onRemoveFile(index)}
                  disabled={uploadProgress !== null}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

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
        <Button onClick={onClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={onSubmit}
          disabled={uploadFiles.length === 0 || uploading}
        >
          Upload {uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Create Folder Dialog ──

interface CreateFolderDialogProps {
  open: boolean;
  folderName: string;
  loading: boolean;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
}

export function CreateFolderDialog({
  open,
  folderName,
  loading,
  onClose,
  onNameChange,
  onSubmit,
}: CreateFolderDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Create Folder</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="Folder name"
          value={folderName}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit();
          }}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSubmit} disabled={!folderName.trim() || loading}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Rename Dialog ──

interface RenameDialogProps {
  open: boolean;
  value: string;
  loading: boolean;
  onClose: () => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function RenameDialog({
  open,
  value,
  loading,
  onClose,
  onChange,
  onSubmit,
}: RenameDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Rename</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="New name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit();
          }}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSubmit} disabled={!value.trim() || loading}>
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Move Dialog ──

interface MoveDialogProps {
  open: boolean;
  targetCount: number;
  availableFolders: FolderItemDTO[];
  selectedFolderId: string | null;
  loading: boolean;
  moveTargetIds: string[];
  onClose: () => void;
  onSelect: (folderId: string | null) => void;
  onSubmit: () => void;
}

export function MoveDialog({
  open,
  targetCount,
  availableFolders,
  selectedFolderId,
  loading,
  moveTargetIds,
  onClose,
  onSelect,
  onSubmit,
}: MoveDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Move {targetCount} item{targetCount === 1 ? '' : 's'}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Loading variant="inline" message="Loading folders..." />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
            <Paper
              variant="outlined"
              onClick={() => onSelect(null)}
              sx={{
                p: 1.5,
                borderRadius: 2,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                borderColor: selectedFolderId === null ? 'primary.main' : 'divider',
                bgcolor: selectedFolderId === null ? 'action.selected' : 'transparent',
                '&:hover': { bgcolor: 'action.hover' },
              }}
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
              {selectedFolderId === null && (
                <CheckCircleIcon fontSize="small" color="primary" sx={{ ml: 'auto' }} />
              )}
            </Paper>

            {availableFolders
              .filter((f) => !moveTargetIds.includes(f.id))
              .map((folder) => (
                <Paper
                  key={folder.id}
                  variant="outlined"
                  onClick={() => onSelect(folder.id)}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    borderColor: selectedFolderId === folder.id ? 'primary.main' : 'divider',
                    bgcolor: selectedFolderId === folder.id ? 'action.selected' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <FolderIcon color="warning" />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {folder.name}
                    </Typography>
                  </Box>
                  {selectedFolderId === folder.id && (
                    <CheckCircleIcon fontSize="small" color="primary" sx={{ ml: 'auto' }} />
                  )}
                </Paper>
              ))}

            {availableFolders.length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ py: 2, textAlign: 'center' }}
              >
                No other folders available in this directory.
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSubmit} disabled={moveTargetIds.length === 0}>
          Move Here
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Delete Confirmation Dialog ──

interface DeleteConfirmDialogProps {
  open: boolean;
  itemName: string;
  isFolder: boolean;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmDialog({
  open,
  itemName,
  isFolder,
  loading,
  onConfirm,
  onClose,
}: DeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title={isFolder ? 'Delete Folder' : 'Delete File'}
      message={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      confirmText="Delete"
      variant="danger"
      onConfirm={onConfirm}
      onClose={onClose}
      loading={loading}
    />
  );
}

// ── Bulk Delete Confirmation Dialog ──

interface BulkDeleteConfirmDialogProps {
  open: boolean;
  count: number;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function BulkDeleteConfirmDialog({
  open,
  count,
  loading,
  onConfirm,
  onClose,
}: BulkDeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Delete Files"
      message={`Are you sure you want to delete ${count} selected file${count === 1 ? '' : 's'}? This action cannot be undone.`}
      confirmText="Delete"
      variant="danger"
      onConfirm={onConfirm}
      onClose={onClose}
      loading={loading}
    />
  );
}

// ── Image Preview Dialog ──

interface PreviewDialogProps {
  file: FileItemDTO | null;
  onClose: () => void;
  onDownload: (file: FileItemDTO) => void;
}

export function PreviewDialog({ file, onClose, onDownload }: PreviewDialogProps) {
  if (!file) return null;

  return (
    <Dialog
      open={!!file}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { bgcolor: 'background.default', borderRadius: 2 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <ImageIcon color="primary" />
        <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
          {file.originalName}
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <Box
          component="img"
          src={file.url || undefined}
          alt={file.originalName}
          sx={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 1 }}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.src = '';
            e.currentTarget.alt = 'Failed to load image';
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {formatFileSize(file.size)} &middot; {file.mimeType}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => onDownload(file)}>
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
}
