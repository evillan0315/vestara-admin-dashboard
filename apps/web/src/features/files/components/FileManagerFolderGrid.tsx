import { Box, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import { Folder as FolderIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { FolderItemDTO, FileItemDTO } from '../../../api/files';

interface FileManagerFolderGridProps {
  folders: FolderItemDTO[];
  onNavigate: (folderId: string, folderName: string) => void;
  onRename: (item: FileItemDTO | FolderItemDTO) => void;
  onDeleteRequest: (item: FileItemDTO | FolderItemDTO) => void;
}

export function FileManagerFolderGrid({
  folders,
  onNavigate,
  onRename,
  onDeleteRequest,
}: FileManagerFolderGridProps) {
  if (folders.length === 0) return null;

  return (
    <Box>
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}
      >
        Folders ({folders.length})
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {folders.map((folder) => (
          <Paper
            key={folder.id}
            onClick={() => onNavigate(folder.id, folder.name)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              p: '12px 16px',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: (t) =>
                  t.palette.mode === 'light'
                    ? t.palette.primary.light + '10'
                    : t.palette.primary.dark + '20',
                transform: 'translateY(-1px)',
                boxShadow: 2,
              },
              minWidth: 180,
              flex: '1 1 auto',
              maxWidth: 280,
            }}
          >
            <FolderIcon sx={{ fontSize: 32, color: 'warning.main' }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 160 }}>
                {folder.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {folder.createdAt
                  ? new Date(folder.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—'}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 0.25 }}>
              <Tooltip title="Rename">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename(folder);
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
                    onDeleteRequest(folder);
                  }}
                  sx={{ width: 28, height: 28 }}
                >
                  <DeleteIcon sx={{ fontSize: 16, color: 'error.main' }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

export default FileManagerFolderGrid;
