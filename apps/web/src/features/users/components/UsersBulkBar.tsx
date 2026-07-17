import { Box, Button, Typography, Paper, styled, alpha } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const BulkBar = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  padding: theme.spacing(1.25, 2),
  borderRadius: 12,
  border: `1px solid ${theme.palette.primary.main}`,
  backgroundColor: alpha(theme.palette.primary.main, 0.06),
  flexWrap: 'wrap',
}));

interface UsersBulkBarProps {
  selectedCount: number;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
}

export function UsersBulkBar({
  selectedCount,
  onActivate,
  onDeactivate,
  onDelete,
}: UsersBulkBarProps) {
  if (selectedCount === 0) return null;

  return (
    <BulkBar elevation={0}>
      <Typography variant="body2" fontWeight={600}>
        {selectedCount} selected
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          color="success"
          startIcon={<CheckCircleIcon />}
          onClick={onActivate}
        >
          Activate
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<BlockIcon />}
          onClick={onDeactivate}
        >
          Deactivate
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={onDelete}
        >
          Delete
        </Button>
      </Box>
    </BulkBar>
  );
}

export default UsersBulkBar;
