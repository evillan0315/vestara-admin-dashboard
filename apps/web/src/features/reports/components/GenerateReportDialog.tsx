import { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  Grid,
  Typography,
  Chip,
  Box,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAvailableColumns } from '../hooks';
import type { Report, ReportParams } from '../../../api/reports';

interface GenerateReportDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (params: ReportParams, type: Report['type']) => void;
  generating: boolean;
}

const REPORT_TYPES: { value: Report['type']; label: string }[] = [
  { value: 'audit_logs', label: 'Audit Logs' },
  { value: 'system_logs', label: 'System Logs' },
  { value: 'users', label: 'Users' },
  { value: 'activity', label: 'Activity' },
];

const FORMATS: { value: Report['format']; label: string }[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel (.xlsx)' },
  { value: 'pdf', label: 'PDF' },
];

const PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'This Week', days: 7 },
  { label: 'This Month', days: 30 },
  { label: 'Last Month', days: 60 },
  { label: 'Last 90 Days', days: 90 },
];

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function GenerateReportDialog({ open, onClose, onGenerate, generating }: GenerateReportDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Report['type']>('audit_logs');
  const [format, setFormat] = useState<Report['format']>('csv');
  const [preset, setPreset] = useState(30);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [schedule, setSchedule] = useState('');
  const [emailTo, setEmailTo] = useState('');

  const { data: columnsData } = useAvailableColumns(type);
  type ColumnDef = { id: string; label: string };
  const availableColumns: ColumnDef[] = (columnsData as { data?: ColumnDef[] } | undefined)?.data ?? [];

  // Initialize columns on type change
  useEffect(() => {
    if (availableColumns.length > 0 && selectedColumns.length === 0) {
      setSelectedColumns(availableColumns.map((c) => c.id));
    }
  }, [type, availableColumns.length]);

  const toggleColumn = (colId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(colId) ? prev.filter((c) => c !== colId) : [...prev, colId],
    );
  };

  const selectAllColumns = () => {
    setSelectedColumns(availableColumns.map((c) => c.id));
  };

  const handlePresetClick = (days: number) => {
    setPreset(days);
    setShowCustom(false);
  };

  const getDateRange = (): { startDate: string; endDate: string } => {
    if (showCustom && customStart && customEnd) {
      return { startDate: customStart, endDate: customEnd };
    }
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - preset);
    return { startDate: formatDate(start), endDate: formatDate(end) };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const range = getDateRange();
    onGenerate(
      {
        name: name || undefined,
        description: description || undefined,
        ...range,
        format,
        selectedColumns: selectedColumns.length < availableColumns.length ? selectedColumns : undefined,
        schedule: schedule || undefined,
        emailTo: emailTo || undefined,
      },
      type,
    );
  };

  const canSubmit = generating || (!showCustom && true) || (showCustom && !!customStart && !!customEnd);

  return (
    <Dialog open={open} onClose={generating ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={700}>
          Generate Report
        </Typography>
        <IconButton size="small" onClick={onClose} disabled={generating}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Basic Info */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Report Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Monthly Audit Report"
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                select
                label="Type"
                value={type}
                onChange={(e) => setType(e.target.value as Report['type'])}
                fullWidth
                size="small"
              >
                {REPORT_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                select
                label="Format"
                value={format}
                onChange={(e) => setFormat(e.target.value as Report['format'])}
                fullWidth
                size="small"
              >
                {FORMATS.map((f) => (
                  <MenuItem key={f.value} value={f.value}>
                    {f.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Date Range */}
            <Grid size={12}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Date Range
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                {PRESETS.map((p) => (
                  <Chip
                    key={p.days}
                    label={p.label}
                    onClick={() => handlePresetClick(p.days)}
                    color={!showCustom && preset === p.days ? 'primary' : 'default'}
                    variant={!showCustom && preset === p.days ? 'filled' : 'outlined'}
                    size="small"
                  />
                ))}
                <Chip
                  label="Custom"
                  onClick={() => setShowCustom(true)}
                  color={showCustom ? 'primary' : 'default'}
                  variant={showCustom ? 'filled' : 'outlined'}
                  size="small"
                />
              </Box>
              {showCustom && (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      type="date"
                      label="Start Date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      type="date"
                      label="End Date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              )}
            </Grid>

            {/* Column Selection */}
            <Grid size={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" fontWeight={600}>
                  Columns ({selectedColumns.length}/{availableColumns.length})
                </Typography>
                <Button size="small" onClick={selectAllColumns} sx={{ textTransform: 'none', fontSize: 12 }}>
                  Select All
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {availableColumns.map((col) => (
                  <Chip
                    key={col.id}
                    label={col.label}
                    onClick={() => toggleColumn(col.id)}
                    color={selectedColumns.includes(col.id) ? 'primary' : 'default'}
                    variant={selectedColumns.includes(col.id) ? 'filled' : 'outlined'}
                    size="small"
                    icon={selectedColumns.includes(col.id) ? undefined : undefined}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                  />
                ))}
              </Box>
            </Grid>

            {/* Scheduling */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Schedule (cron expression)"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="e.g., 0 8 * * 1 (every Monday 8AM)"
                fullWidth
                size="small"
                helperText="Leave empty for one-time report"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Email Delivery"
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="admin@example.com"
                fullWidth
                size="small"
                helperText="Send report via email when completed"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ gap: 2, px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={generating}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" startIcon={generating ? <CircularProgress size={16} /> : <AssessmentIcon />} disabled={!canSubmit}>
            {generating ? 'Generating...' : 'Generate Report'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default GenerateReportDialog;
