import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from '@mui/material';
import { Assessment as AssessmentIcon } from '@mui/icons-material';
import type { ReportParams } from '../../../api/reports';

interface GenerateReportDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (params: ReportParams, type: 'audit_logs' | 'system_logs' | 'users' | 'activity') => void;
  generating: boolean;
}

export function GenerateReportDialog({ open, onClose, onGenerate, generating }: GenerateReportDialogProps) {
  const [formData, setFormData] = useState<ReportParams & { type: 'audit_logs' | 'system_logs' | 'users' | 'activity'; name: string }>({
    startDate: '',
    endDate: '',
    type: 'audit_logs',
    format: 'csv',
    name: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { type, ...params } = formData;
    onGenerate(params as ReportParams, type);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Generate Report</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ pt: 1 }}>
            <Grid size={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Report Configuration
              </Typography>
            </Grid>
            <Grid size={12}>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <Typography variant="body2" fontWeight={500}>
                  Report Name
                </Typography>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Monthly Audit Report"
                  required
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--mui-palette-divider)',
                    backgroundColor: 'var(--mui-palette-background-paper)',
                    color: 'var(--mui-palette-text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </label>
            </Grid>
            <Grid size={6}>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <Typography variant="body2" fontWeight={500}>
                  Report Type
                </Typography>
                <select
                  value={formData.type}
                   onChange={(e) => setFormData({ ...formData, type: e.target.value as 'audit_logs' | 'system_logs' | 'users' | 'activity' })}
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--mui-palette-divider)',
                    backgroundColor: 'var(--mui-palette-background-paper)',
                    color: 'var(--mui-palette-text-primary)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="audit_logs">Audit Logs</option>
                  <option value="system_logs">System Logs</option>
                  <option value="users">Users</option>
                  <option value="activity">Activity</option>
                </select>
              </label>
            </Grid>
            <Grid size={6}>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <Typography variant="body2" fontWeight={500}>
                  Format
                </Typography>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value as 'csv' | 'excel' | 'pdf' })}
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--mui-palette-divider)',
                    backgroundColor: 'var(--mui-palette-background-paper)',
                    color: 'var(--mui-palette-text-primary)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="csv">CSV</option>
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="pdf">PDF</option>
                </select>
              </label>
            </Grid>
            <Grid size={6}>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <Typography variant="body2" fontWeight={500}>
                  Start Date
                </Typography>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--mui-palette-divider)',
                    backgroundColor: 'var(--mui-palette-background-paper)',
                    color: 'var(--mui-palette-text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </label>
            </Grid>
            <Grid size={6}>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <Typography variant="body2" fontWeight={500}>
                  End Date
                </Typography>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    marginTop: 4,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--mui-palette-divider)',
                    backgroundColor: 'var(--mui-palette-background-paper)',
                    color: 'var(--mui-palette-text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </label>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ gap: 2 }}>
          <Button onClick={onClose} disabled={generating}>Cancel</Button>
          <Button type="submit" variant="contained" startIcon={<AssessmentIcon />} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Report'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default GenerateReportDialog;
