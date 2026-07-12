import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  styled,
  Chip,
  Pagination,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  History as HistoryIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useState, type ReactElement } from 'react';
import { useSettingsAuditHistory } from './hooks';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Loading } from '../../components/feedback/Loading';

interface SettingsAuditHistoryDialogProps {
  open: boolean;
  onClose: () => void;
}

const StyledDialog = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    borderRadius: 12,
    maxWidth: 720,
    width: '100%',
  },
}));

const LogEntry = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5, 0),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:last-child': {
    borderBottom: 'none',
  },
}));

const ActionIcon = styled(Box)(({ theme: _theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: '50%',
  flexShrink: 0,
}));

const getActionConfig = (action: string) => {
  switch (action) {
    case 'settings_update':
      return { label: 'Updated', icon: EditIcon, color: 'primary' as const, bgColor: 'primary.light' };
    case 'settings_delete':
      return { label: 'Deleted', icon: DeleteIcon, color: 'error' as const, bgColor: 'error.light' };
    case 'settings_import':
      return { label: 'Imported', icon: AddIcon, color: 'success' as const, bgColor: 'success.light' };
    default:
      return { label: action, icon: EditIcon, color: 'info' as const, bgColor: 'grey.300' };
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const renderValuePreview = (metadata: Record<string, unknown> | undefined): ReactElement | null => {
  if (!metadata?.value) return null;
  if (typeof metadata.value !== 'object') return null;

  const valueStr = JSON.stringify(metadata.value as Record<string, unknown>);
  return (
    <Typography
      variant="caption"
      display="block"
      color="text.secondary"
      sx={{ fontFamily: 'monospace', mt: 0.5, wordBreak: 'break-all' }}
    >
      Value: {valueStr.substring(0, 120)}
      {valueStr.length > 120 ? '...' : ''}
    </Typography>
  );
};

export function SettingsAuditHistoryDialog({
  open,
  onClose,
}: SettingsAuditHistoryDialogProps): ReactElement {
  const [page, setPage] = useState(1);
  const perPage = 10;

  const { data, isLoading } = useSettingsAuditHistory({ page, perPage });

  const logs = data?.data?.logs ?? [];
  const pagination = data?.data?.pagination;

  return (
    <StyledDialog open={open} onClose={onClose}>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 700,
          fontSize: '1.125rem',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="primary" />
          Settings Change History
        </Box>
        <Tooltip title="Close">
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {isLoading ? (
          <Box sx={{ p: 3 }}>
            <Loading variant="inline" message="Loading history..." />
          </Box>
        ) : logs.length === 0 ? (
          <Box sx={{ p: 4 }}>
            <EmptyState
              iconComponent={HistoryIcon}
              title="No History"
              description="No settings changes have been recorded yet."
            />
          </Box>
        ) : (
          <Box sx={{ px: 3 }}>
            {logs.map((log) => {
              const config = getActionConfig(log.action);
              const Icon = config.icon;
              const metadata = log.metadata as Record<string, unknown> | undefined;
              const isNew = metadata?.isNew === true;
              const source = metadata?.source as string | undefined;

              return (
                <LogEntry key={log.id}>
                  <ActionIcon sx={{ backgroundColor: `${config.bgColor}20` }}>
                    <Icon fontSize="small" color={config.color} />
                  </ActionIcon>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {log.entityId}
                      </Typography>
                      <Chip
                        label={isNew ? 'Created' : config.label}
                        size="small"
                        color={config.color}
                        variant="outlined"
                        sx={{ fontSize: '0.6875rem', height: 20 }}
                      />
                      {source && (
                        <Chip
                          label={source}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.625rem', height: 18 }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {log.user
                        ? `${log.user.firstName} ${log.user.lastName}`
                        : 'System'}
                      {' · '}
                      {formatDate(log.createdAt)}
                    </Typography>
                    {renderValuePreview(metadata)}
                  </Box>
                </LogEntry>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
        <Typography variant="caption" color="text.secondary">
          {pagination ? `${pagination.total} total changes` : ''}
        </Typography>
        {pagination && pagination.totalPages > 1 && (
          <Pagination
            count={pagination.totalPages}
            page={page}
            onChange={(_e, p) => setPage(p)}
            size="small"
          />
        )}
      </DialogActions>
    </StyledDialog>
  );
}

export default SettingsAuditHistoryDialog;
