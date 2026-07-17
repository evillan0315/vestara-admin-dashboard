import { Box, Button, TextField, IconButton, InputAdornment } from '@mui/material';
import {
  Upload as UploadIcon,
  Add as AddIcon,
  DriveFileMove as MoveIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface FileManagerToolbarProps {
  selectedCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  onUploadOpen: () => void;
  onCreateFolderOpen: () => void;
  onMoveOpen: (ids: string[]) => void;
  onBulkDeleteOpen: () => void;
  selectedIds: string[];
}

export function FileManagerToolbar({
  selectedCount,
  search,
  onSearchChange,
  onSearchClear,
  onUploadOpen,
  onCreateFolderOpen,
  onMoveOpen,
  onBulkDeleteOpen,
  selectedIds,
}: FileManagerToolbarProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
      <Button variant="contained" startIcon={<UploadIcon />} onClick={onUploadOpen}>
        Upload
      </Button>
      <Button variant="outlined" startIcon={<AddIcon />} onClick={onCreateFolderOpen}>
        New Folder
      </Button>
      {selectedCount > 0 && (
        <>
          <Button
            variant="outlined"
            startIcon={<MoveIcon />}
            onClick={() => onMoveOpen(selectedIds)}
          >
            Move ({selectedCount})
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={onBulkDeleteOpen}
          >
            Delete ({selectedCount})
          </Button>
        </>
      )}
      <Box sx={{ flex: 1 }} />
      <TextField
        size="small"
        placeholder="Search files..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
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
                    <IconButton size="small" onClick={onSearchClear}>
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
  );
}

export default FileManagerToolbar;
