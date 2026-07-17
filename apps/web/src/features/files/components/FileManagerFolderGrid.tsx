import { Box, IconButton, Paper, Tooltip, Typography, alpha } from '@mui/material';
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
        sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}
      >
        Folders ({folders.length})
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {folders.map((folder) => (
          <Paper
            key={folder.id}
            onClick={() => onNavigate(folder.id, folder.name)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              p: '6px 10px',
              borderRadius: 1.5,
              cursor: 'pointer',
              transition: 'all 0.15s',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
              },
              minWidth: 100,
              flex: '0 1 auto',
              maxWidth: 220,
            }}
          >
            <FolderIcon sx={{ fontSize: 18, color: 'warning.main' }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                fontWeight={600}
                noWrap
                sx={{ maxWidth: 120, lineHeight: 1.3 }}
              >
                {folder.name}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 0 }}>
              <Tooltip title="Rename">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename(folder);
                  }}
                  sx={{ width: 22, height: 22 }}
                >
                  <EditIcon sx={{ fontSize: 12 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRequest(folder);
                  }}
                  sx={{ width: 22, height: 22 }}
                >
                  <DeleteIcon sx={{ fontSize: 12, color: 'error.main' }} />
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
