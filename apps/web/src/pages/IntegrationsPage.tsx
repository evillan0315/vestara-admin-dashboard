import { useCallback, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Explore as ExploreIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { DataTable, type Column } from '../components/data/DataTable';
import { ConfirmDialog } from '../components/ui/Modal';
import { useToast } from '../components/feedback/Toast';
import {
  useDataSources,
  useDeleteDataSource,
} from '../features/integrations/hooks';
import DataSourceFormDialog from '../features/integrations/DataSourceFormDialog';
import type { DataSourceDTO } from '@vestara/types';

const AUTH_LABELS: Record<string, string> = {
  none: 'None',
  bearer: 'Bearer',
  basic: 'Basic',
  apiKey: 'API Key',
};

export default function IntegrationsPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { data, isLoading, refetch } = useDataSources();
  const deleteMut = useDeleteDataSource();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DataSourceDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DataSourceDTO | null>(null);

  const sources: DataSourceDTO[] = data ?? [];

  const handleCreate = useCallback(() => {
    setEditing(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((ds: DataSourceDTO) => {
    setEditing(ds);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      showSuccess('Data source deleted');
    } catch {
      showError('Failed to delete data source');
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteMut, deleteTarget, showSuccess, showError]);

  const columns: Column<DataSourceDTO>[] = [
    { id: 'name', label: 'Name', sortable: true, render: (_, row) => <strong>{row.name}</strong> },
    {
      id: 'method',
      label: 'Method',
      sortable: true,
      render: (_, row) => (
        <Chip size="small" label={row.method} color={row.method === 'POST' ? 'secondary' : 'default'} />
      ),
    },
    { id: 'baseUrl', label: 'Base URL', sortable: true, render: (_, row) => <code>{row.baseUrl}{row.path}</code> },
    {
      id: 'authType',
      label: 'Auth',
      sortable: true,
      render: (_, row) => <Chip size="small" variant="outlined" label={AUTH_LABELS[row.authType] ?? row.authType} />,
    },
    {
      id: 'lastFetchedAt',
      label: 'Last Fetched',
      sortable: false,
      render: (_, row) => (row.lastFetchedAt ? new Date(row.lastFetchedAt).toLocaleString() : '—'),
    },
    {
      id: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" startIcon={<ExploreIcon />} onClick={() => navigate(`/integrations/${row.id}`)}>
            Explore
          </Button>
          {tryEdit(row)}
        </Stack>
      ),
    },
  ];

  function tryEdit(row: DataSourceDTO) {
    return (
      <>
        <Button size="small" startIcon={<EditIcon />} onClick={() => handleEdit(row)}>
          Edit
        </Button>
        <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteTarget(row)}>
          Delete
        </Button>
      </>
    );
  }


  const actions: ReactNode = (
    <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
      New Data Source
    </Button>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Integrations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Connect external REST APIs and visualize their data with AI-assisted charts.
          </Typography>
        </Box>
      </Stack>

      <DataTable<DataSourceDTO>
        columns={columns}
        rows={sources}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        onRetry={() => refetch()}
        searchable
        searchPlaceholder="Search data sources..."
        actions={actions}
        title="Connected Sources"
        emptyTitle="No data sources yet"
        emptyDescription="Create a data source to connect an external REST API."
        rowCount={sources.length}
        pagination={{ page: 1, perPage: sources.length || 1, total: sources.length }}
      />

      <DataSourceFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} dataSource={editing} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Data Source"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
}
