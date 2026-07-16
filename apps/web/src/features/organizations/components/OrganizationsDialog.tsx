import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import type { OrganizationDTO } from '@vestara/types';
import type { CreateOrganizationInput } from '@vestara/validation';
import AvatarUpload from '../../../components/common/AvatarUpload';

interface OrganizationsDialogProps {
  open: boolean;
  editingOrg: OrganizationDTO | null;
  formData: CreateOrganizationInput;
  uploadingLogo: boolean;
  loading: boolean;
  onClose: () => void;
  onFormChange: (field: keyof CreateOrganizationInput, value: string) => void;
  onLogoUpload: (file: File) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function OrganizationsDialog({
  open,
  editingOrg,
  formData,
  uploadingLogo,
  loading,
  onClose,
  onFormChange,
  onLogoUpload,
  onSubmit,
}: OrganizationsDialogProps) {
  const handleLogoUpload = (file: File) => {
    onLogoUpload(file);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editingOrg ? 'Edit Organization' : 'Create Organization'}</DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent>
          <Grid container spacing={2} sx={{ p: 2 }}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onFormChange('name', e.target.value)
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
                  onFormChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
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
                <AvatarUpload
                  src={formData.logoUrl || undefined}
                  alt="Organization logo"
                  size="large"
                  editable
                  loading={uploadingLogo}
                  initials={formData.name?.charAt(0)?.toUpperCase() || 'O'}
                  onUpload={handleLogoUpload}
                />

                <TextField
                  label="Logo URL"
                  placeholder="Or paste a URL..."
                  size="small"
                  value={formData.logoUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onFormChange('logoUrl', e.target.value)
                  }
                  sx={{ flex: '1 1 260px', minWidth: 200 }}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {editingOrg ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default OrganizationsDialog;
