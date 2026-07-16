import { Avatar, Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import {
  Download as DownloadIcon,
  Edit as EditIcon,
  DriveFileMove as MoveIcon,
  Image as ImageIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Cloud as CloudIcon,
} from '@mui/icons-material';
import type { Column } from '../../../components/data/DataTable';
import type { FileItemDTO } from '../../../api/files';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
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
  if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml')) return '#2e7d32';
  return '#757575';
}

function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/') && !mimeType.includes('svg');
}

interface CreateFileManagerColumnsParams {
  onDownload: (file: FileItemDTO) => void;
  onRenameOpen: (item: FileItemDTO) => void;
  onMoveSingle: (file: FileItemDTO) => Promise<void>;
  onPreview: (file: FileItemDTO) => void;
  onDeleteRequest: (item: FileItemDTO) => void;
}

export function createFileManagerColumns({
  onDownload,
  onRenameOpen,
  onMoveSingle,
  onPreview,
  onDeleteRequest,
}: CreateFileManagerColumnsParams): Column<FileItemDTO>[] {
  return [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      render: (_value, row) => (
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: isImageFile(row.mimeType) ? 'pointer' : 'default' }}
          onClick={() => isImageFile(row.mimeType) && onPreview(row)}
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
          {value ? new Date(value as string).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
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
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDownload(row); }}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Rename">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onRenameOpen(row); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Move to folder">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onMoveSingle(row); }}>
              <MoveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {isImageFile(row.mimeType) && (
            <Tooltip title="Preview">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onPreview(row); }}>
                <ImageIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDeleteRequest(row); }}>
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];
}
