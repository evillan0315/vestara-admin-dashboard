import { useState, useRef } from 'react';
import { Plus, Camera } from 'lucide-react';
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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useOrganizations, useCreateOrganization, useUpdateOrganization } from '../features/organizations/hooks';
import { uploadImage } from '../api/upload';
import { useToast } from '../components/feedback/Toast';

import type { OrganizationDTO } from '@vestara/types';
import type { CreateOrganizationInput } from '@vestara/validation';

export function OrganizationsPage() {
  const { data: organizations = [], isLoading, refetch } = useOrganizations();
  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganizationDTO | null>(null);
  const [formData, setFormData] = useState<CreateOrganizationInput>({ name: '', slug: '', logoUrl: '' });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleOpenCreate = () => {
    setEditingOrg(null);
    setFormData({ name: '', slug: '', logoUrl: '' });
    setOpen(true);
  };

  const handleOpenEdit = (org: OrganizationDTO) => {
    setEditingOrg(org);
    setFormData({ name: org.name, slug: org.slug, logoUrl: org.logoUrl || '' });
    setOpen(true);
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.showError('Only JPEG, PNG, WebP, and SVG images are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.showError('File size must be less than 5MB');
      return;
    }

    setUploadingLogo(true);

    try {
      const result = await uploadImage(file);
      if (result.success && result.data) {
        setFormData(prev => ({ ...prev, logoUrl: result.data!.url }));
      } else {
        toast.showError(result.error || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Logo upload failed:', error);
      toast.showError('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOrg) {
        await updateMutation.mutateAsync({ id: editingOrg.id, ...formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      handleClose();
      refetch();
    } catch (error) {
      toast.showError(error instanceof Error ? error.message : 'Failed to save organization');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingOrg(null);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" component="h1">Organizations</Typography>
        <Button variant="contained" startIcon={<Plus />} onClick={handleOpenCreate}>
          Add Organization
        </Button>
      </Box>

      <Paper elevation={1} variant="outlined">
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell align="right">Members</TableCell>
                <TableCell align="right" style={{ width: 120 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    Loading...
                  </TableCell>
                </TableRow>
              ) : organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    No organizations found.
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => (
                  <TableRow key={org.id} hover>
                    <TableCell>{org.name}</TableCell>
                    <TableCell>{org.slug}</TableCell>
                    <TableCell align="right">{org.userCount}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenEdit(org)} aria-label="Edit">
                        <Typography variant="body2" sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'underline' }}>
                          Edit
                        </Typography>
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {organizations.length === 0 && !isLoading && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No organizations found. Create your first organization.
        </Typography>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingOrg ? 'Edit Organization' : 'Create Organization'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ p: 2 }}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  disabled={editingOrg !== null && editingOrg.slug === formData.slug}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Slug"
                  value={formData.slug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  required
                  disabled={!!editingOrg}
                  helperText="Lowercase, alphanumeric, hyphens only"
                />
              </Grid>
              <Grid size={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Organization Logo</Typography>
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
                        <Camera size={16} color="#fff" />
                      )}
                    </Box>
                  </Box>

                  <TextField
                    label="Logo URL"
                    placeholder="Or paste a URL..."
                    size="small"
                    value={formData.logoUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, logoUrl: e.target.value }))}
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
            <Button onClick={handleClose} disabled={createMutation.isPending || updateMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingOrg ? 'Save Changes' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}