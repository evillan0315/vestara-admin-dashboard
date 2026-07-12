import { Box, Typography, Button, Paper, styled, IconButton, Chip, Tooltip } from '@mui/material';
import {
  Settings as SettingsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useState, useCallback, type ReactElement } from 'react';
import { useSettings, useUpsertSetting, useDeleteSetting, useExportSettings } from '../features/settings/hooks';
import { useToast } from '../components/feedback/Toast';
import { Loading } from '../components/feedback/Loading';
import { EmptyState } from '../components/feedback/EmptyState';
import { SettingFormDialog } from '../features/settings/SettingFormDialog';
import { SettingsImportDialog } from '../features/settings/SettingsImportDialog';
import { SettingsAuditHistoryDialog } from '../features/settings/SettingsAuditHistoryDialog';
import { ConfirmDialog } from '../components/ui/Modal';

// ── Styled ──

const PageContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}));

const Card = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  overflow: 'hidden',
}));

const SettingRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:last-child': {
    borderBottom: 'none',
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const KeyLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.875rem',
  fontFamily: 'monospace',
  color: theme.palette.primary.main,
}));

const ValuePreview = styled(Typography)(({ theme }) => ({
  fontSize: '0.8125rem',
  color: theme.palette.text.secondary,
  maxWidth: 400,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const HeaderBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.background.default,
}));

// ── Component ──

export function SettingsPage(): ReactElement {
  const { showSuccess, showError } = useToast();

  const { data, isLoading, isError, error, refetch } = useSettings();
  const upsertMutation = useUpsertSetting();
  const deleteMutation = useDeleteSetting();
  const exportMutation = useExportSettings();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  const settingsMap = data?.data?.settings as Record<string, unknown> | undefined;
  const settingsEntries = settingsMap ? Object.entries(settingsMap) : [];

  const handleCreate = useCallback(() => {
    setEditKey(null);
    setEditValue('');
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((key: string, value: unknown) => {
    setEditKey(key);
    setEditValue(JSON.stringify(value, null, 2));
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setEditKey(null);
    setEditValue('');
  }, []);

  const handleDialogSubmit = useCallback(
    async (key: string, value: string) => {
      try {
        let parsedValue: Record<string, unknown>;
        try {
          parsedValue = JSON.parse(value);
        } catch {
          showError('Value must be valid JSON');
          return;
        }

        await upsertMutation.mutateAsync({ key, value: parsedValue });
        showSuccess(`Setting "${key}" saved successfully`);
        handleDialogClose();
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to save setting');
      }
    },
    [upsertMutation, showSuccess, showError, handleDialogClose],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      showSuccess(`Setting "${deleteTarget}" deleted`);
      setDeleteTarget(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete setting');
    }
  }, [deleteTarget, deleteMutation, showSuccess, showError]);

  const handleExport = useCallback(async () => {
    try {
      await exportMutation.mutateAsync();
      showSuccess('Settings exported successfully');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to export settings');
    }
  }, [exportMutation, showSuccess, showError]);

  if (isLoading) {
    return (
      <PageContainer>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Settings
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Configure your platform preferences and system settings.
          </Typography>
        </Box>
        <Card>
          <Loading variant="inline" message="Loading settings..." />
        </Card>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Settings
          </Typography>
        </Box>
        <Card sx={{ p: 4 }}>
          <EmptyState
            iconComponent={SettingsIcon}
            title="Failed to Load Settings"
            description={error instanceof Error ? error.message : 'An error occurred'}
            action={{ label: 'Retry', onClick: () => refetch() }}
            variant="error"
          />
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Configure your platform preferences and system settings.
        </Typography>
      </Box>

      <Card>
        <HeaderBox>
          <Typography variant="subtitle2" fontWeight={600}>
            System Settings ({settingsEntries.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Change History">
              <IconButton size="small" onClick={() => setAuditOpen(true)}>
                <HistoryIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export Settings">
              <IconButton size="small" onClick={handleExport} disabled={exportMutation.isPending}>
                <ExportIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Import Settings">
              <IconButton size="small" onClick={() => setImportOpen(true)}>
                <ImportIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={() => refetch()}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleCreate}
            >
              Add Setting
            </Button>
          </Box>
        </HeaderBox>

        {settingsEntries.length === 0 ? (
          <Box sx={{ p: 4 }}>
            <EmptyState
              iconComponent={SettingsIcon}
              title="No Settings"
              description="No system settings have been configured yet."
              action={{ label: 'Add Setting', onClick: handleCreate }}
            />
          </Box>
        ) : (
          settingsEntries.map(([key, value]) => (
            <SettingRow key={key}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <KeyLabel>{key}</KeyLabel>
                  <Chip
                    label={typeof value === 'object' && value !== null ? 'JSON' : typeof value}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.6875rem', height: 20 }}
                  />
                </Box>
                <ValuePreview>
                  {typeof value === 'object' && value !== null
                    ? JSON.stringify(value).substring(0, 200)
                    : String(value)}
                </ValuePreview>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, ml: 2, flexShrink: 0 }}>
                <Tooltip title="Edit setting">
                  <IconButton size="small" onClick={() => handleEdit(key, value)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete setting">
                  <IconButton size="small" onClick={() => setDeleteTarget(key)}>
                    <DeleteIcon fontSize="small" color="error" />
                  </IconButton>
                </Tooltip>
              </Box>
            </SettingRow>
          ))
        )}
      </Card>

      {/* Create / Edit Dialog */}
      <SettingFormDialog
        open={dialogOpen}
        editKey={editKey}
        editValue={editValue}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        loading={upsertMutation.isPending}
      />

      {/* Import Dialog */}
      <SettingsImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />

      {/* Audit History Dialog */}
      <SettingsAuditHistoryDialog
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Setting"
        message={
          deleteTarget
            ? `Are you sure you want to delete the setting "${deleteTarget}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </PageContainer>
  );
}

export default SettingsPage;
