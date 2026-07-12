import { useState, useRef, useCallback, useMemo, type ReactElement } from 'react';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  styled,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Camera as CameraIcon,
} from '@mui/icons-material';
import { DataTable, type Column, type SortState } from '../components/data/DataTable';
import { useOrganizations, useCreateOrganization, useUpdateOrganization } from '../features/organizations/hooks';
import { uploadImage } from '../api/upload';
import { useToast } from '../components/feedback/Toast';
import type { OrganizationDTO } from '@vestara/types';
import type { CreateOrganizationInput } from '@vestara/validation';

// ── Styled ──

const PageContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}));

// ── Helpers ──

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ── Component ──

export function OrganizationsPage(): ReactElement {
  const { showSuccess, showError } = useToast();

  // Sort & search state
  const [sort, setSort] = useState<SortState>({ field: 'name', direction: 'asc' });
  const [search, setSearch] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganizationDTO | null>(null);
  const [formData, setFormData] = useState<CreateOrganizationInput>({ name: '', slug: '', logoUrl: '' });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries & mutations
  const { data: organizations = [], isLoading, isError, error, refetch } = useOrganizations();
  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();

  // Client-side filter & sort
  const displayedOrgs = useMemo(() => {
    let result = organizations;

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (org) => org.name.toLowerCase().includes(q) || org.slug.toLowerCase().includes(q),
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sort.field) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'slug':
          cmp = a.slug.localeCompare(b.slug);
          break;
        case 'userCount':
          cmp = a.userCount - b.userCount;
          break;
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          cmp = 0;
      }
      return sort.direction === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [organizations, search, sort]);

  // Handlers
  const handleSortChange = useCallback((newSort: SortState) => {
    setSort(newSort);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingOrg(null);
    setFormData({ name: '', slug: '', logoUrl: '' });
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((org: OrganizationDTO) => {
    setEditingOrg(org);
    setFormData({ name: org.name, slug: org.slug, logoUrl: org.logoUrl || '' });
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setEditingOrg(null);
  }, []);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      showError('Only JPEG, PNG, WebP, and SVG images are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('File size must be less than 5MB');
      return;
    }

    setUploadingLogo(true);

    try {
      const result = await uploadImage(file);
      if (result.success && result.data) {
        setFormData((prev) => ({ ...prev, logoUrl: result.data!.url }));
      } else {
        showError(result.error || 'Failed to upload logo');
      }
    } catch (err) {
      console.error('Logo upload failed:', err);
      showError('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOrg) {
        await updateMutation.mutateAsync({ id: editingOrg.id, ...formData });
        showSuccess('Organization updated successfully');
      } else {
        await createMutation.mutateAsync(formData);
        showSuccess('Organization created successfully');
      }
      handleDialogClose();
      refetch();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save organization');
    }
  };

  // Columns
  const columns: Column<OrganizationDTO>[] = [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      render: (_value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={row.logoUrl || undefined}
            sx={{
              width: 32,
              height: 32,
              fontSize: '0.8125rem',
              fontWeight: 600,
              bgcolor: 'primary.main',
            }}
          >
            {row.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {row.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.slug}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'slug',
      label: 'Slug',
      width: 180,
      sortable: true,
      render: (value) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          {String(value)}
        </Typography>
      ),
    },
    {
      id: 'userCount',
      label: 'Members',
      width: 100,
      sortable: true,
      render: (_value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon fontSize="small" color="action" />
          <Typography variant="body2">{row.userCount}</Typography>
        </Box>
      ),
    },
    {
      id: 'createdAt',
      label: 'Created',
      width: 140,
      sortable: true,
      render: (value) => formatDate(value as string),
    },
    {
      id: 'actions',
      label: '',
      width: 80,
      render: (_value, row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit organization">
            <IconButton size="small" onClick={() => handleEdit(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <PageContainer>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Organizations
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage organizations and their settings.
        </Typography>
      </Box>

      <DataTable<OrganizationDTO>
        columns={columns}
        rows={displayedOrgs}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        error={isError ? (error instanceof Error ? error.message : 'Failed to load organizations') : null}
        onRetry={() => refetch()}
        sortState={sort}
        onSortChange={handleSortChange}
        searchable
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search organizations by name or slug..."
        title="All Organizations"
        emptyIcon={<BusinessIcon sx={{ fontSize: 48 }} />}
        emptyTitle="No organizations found"
        emptyDescription="No organizations match your search criteria."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            Add Organization
          </Button>
        }
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingOrg ? 'Edit Organization' : 'Create Organization'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ p: 2 }}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Slug"
                  value={formData.slug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({
                      ...prev,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                    }))
                  }
                  required
                  disabled={!!editingOrg}
                  helperText="Lowercase, alphanumeric, hyphens only"
                />
              </Grid>
              <Grid size={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Organization Logo
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                  {/* Logo preview with camera overlay */}
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <Avatar
                      src={formData.logoUrl || undefined}
                      alt="Organization logo"
                      sx={{
                        width: 96,
                        height: 96,
                        bgcolor: 'action.hover',
                        border: '2px dashed',
                        borderColor: 'divider',
                        '& img': { objectFit: 'cover' },
                      }}
                    >
                      {formData.name?.charAt(0)?.toUpperCase() || 'O'}
                    </Avatar>
                    <Box
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: 'primary.main',
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                        '&:hover': { opacity: 0.85 },
                        boxShadow: 1,
                      }}
                    >
                      {uploadingLogo ? (
                        <CircularProgress size={18} sx={{ color: '#fff' }} />
                      ) : (
                        <CameraIcon fontSize="small" sx={{ color: '#fff' }} />
                      )}
                    </Box>
                  </Box>

                  <TextField
                    label="Logo URL"
                    placeholder="Or paste a URL..."
                    size="small"
                    value={formData.logoUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({ ...prev, logoUrl: e.target.value }))
                    }
                    sx={{ flex: '1 1 260px', minWidth: 200 }}
                  />
                </Box>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={handleLogoChange}
                  hidden
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} disabled={createMutation.isPending || updateMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingOrg ? 'Save Changes' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </PageContainer>
  );
}

export default OrganizationsPage;
