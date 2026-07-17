import { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AutoAwesome as TemplateIcon,
} from '@mui/icons-material';
import {
  useReportTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from '../hooks';
import { useToast } from '../../../components/feedback/Toast';
import { useConfirm } from '../../../hooks/useConfirm';
import type { ReportTemplate } from '../../../api/reports';

const REPORT_TYPES = [
  { value: 'audit_logs', label: 'Audit Logs' },
  { value: 'system_logs', label: 'System Logs' },
  { value: 'users', label: 'Users' },
  { value: 'activity', label: 'Activity' },
];

const FORMATS = [
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel (.xlsx)' },
  { value: 'pdf', label: 'PDF' },
];

interface FormState {
  name: string;
  description: string;
  type: ReportTemplate['type'];
  format: ReportTemplate['format'];
}

const emptyForm: FormState = { name: '', description: '', type: 'audit_logs', format: 'csv' };

export function ReportsTemplatesPanel() {
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirm();
  const { data: templatesData, isLoading, refetch } = useReportTemplates();
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();

  const templates: ReportTemplate[] =
    (templatesData as { data?: ReportTemplate[] } | undefined)?.data ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ReportTemplate | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((template: ReportTemplate) => {
    setEditing(template);
    setForm({
      name: template.name,
      description: template.description ?? '',
      type: template.type,
      format: template.format,
    });
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: form });
        showSuccess('Template updated');
      } else {
        await createMutation.mutateAsync(form);
        showSuccess('Template created');
      }
      setDialogOpen(false);
      refetch();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  }, [form, editing, createMutation, updateMutation, showSuccess, showError, refetch]);

  const handleDelete = useCallback(
    async (template: ReportTemplate) => {
      const confirmed = await confirm({
        title: 'Delete Template',
        message: `Delete "${template.name}"? This cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger',
      });
      if (!confirmed) return;
      try {
        await deleteMutation.mutateAsync(template.id);
        showSuccess('Template deleted');
        refetch();
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to delete template');
      }
    },
    [deleteMutation, showSuccess, showError, refetch, confirm],
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Report Templates
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} size="small">
          Create Template
        </Button>
      </Box>

      {templates.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <TemplateIcon sx={{ fontSize: 48, mb: 2, opacity: 0.4 }} />
          <Typography variant="h6" fontWeight={600}>
            No templates yet
          </Typography>
          <Typography variant="body2">
            Create reusable report templates for faster report generation.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate} sx={{ mt: 2 }}>
            Create Your First Template
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {templates.map((template) => (
            <Grid key={template.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {template.name}
                  </Typography>
                  {template.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {template.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={
                        REPORT_TYPES.find((t) => t.value === template.type)?.label ?? template.type
                      }
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={template.format.toUpperCase()}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', gap: 0 }}>
                  <IconButton size="small" onClick={() => openEdit(template)} title="Edit">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(template)}
                    title="Delete"
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Template' : 'Create Template'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Template Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
            size="small"
            required
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            fullWidth
            size="small"
            multiline
            rows={2}
          />
          <TextField
            select
            label="Report Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as ReportTemplate['type'] })}
            fullWidth
            size="small"
          >
            {REPORT_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Format"
            value={form.format}
            onChange={(e) =>
              setForm({ ...form, format: e.target.value as ReportTemplate['format'] })
            }
            fullWidth
            size="small"
          >
            {FORMATS.map((f) => (
              <MenuItem key={f.value} value={f.value}>
                {f.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name.trim() || saving}>
            {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ReportsTemplatesPanel;
