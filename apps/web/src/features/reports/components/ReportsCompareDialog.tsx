import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
} from '@mui/material';
import { CompareArrows as CompareIcon } from '@mui/icons-material';
import { useCompareReports } from '../hooks';
import type { Report } from '../../../api/reports';

interface ReportsCompareDialogProps {
  open: boolean;
  reportIds: string[];
  reports: Report[];
  onClose: () => void;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReportsCompareDialog({
  open,
  reportIds,
  reports,
  onClose,
}: ReportsCompareDialogProps) {
  const compareMutation = useCompareReports();
  const [comparedData, setComparedData] = useState<Report[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    setLoading(true);
    try {
      const result = await compareMutation.mutateAsync(reportIds);
      setComparedData(result as unknown as Report[]);
    } catch {
      // on error, fall back to local data
      setComparedData(reports);
    } finally {
      setLoading(false);
    }
  };

  const displayReports = comparedData ?? reports;

  const rows: { label: string; key: string }[] = [
    { label: 'Name', key: 'name' },
    { label: 'Type', key: 'type' },
    { label: 'Format', key: 'format' },
    { label: 'Status', key: 'status' },
    { label: 'Size', key: 'fileSize' },
    { label: 'Created', key: 'createdAt' },
    { label: 'Completed', key: 'completedAt' },
  ];

  const getValue = (report: Report, key: string): string | number => {
    switch (key) {
      case 'name':
        return report.name;
      case 'type':
        return report.type.replace('_', ' ');
      case 'format':
        return report.format.toUpperCase();
      case 'status':
        return report.status;
      case 'fileSize':
        return formatSize(report.fileSize);
      case 'createdAt':
        return formatDate(report.createdAt);
      case 'completedAt':
        return formatDate(report.completedAt);
      default:
        return '—';
    }
  };

  const getStatusChip = (status: string) => {
    const color = status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'warning';
    return <Chip label={status} color={color} size="small" />;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CompareIcon />
        <span>Compare Reports</span>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Attribute</TableCell>
                  {displayReports.map((report) => (
                    <TableCell key={report.id} sx={{ fontWeight: 600 }}>
                      {report.name || 'Unnamed'}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.key} hover>
                    <TableCell sx={{ fontWeight: 500, color: 'text.secondary' }}>
                      {row.label}
                    </TableCell>
                    {displayReports.map((report) => (
                      <TableCell key={report.id}>
                        {row.key === 'status' ? (
                          getStatusChip(String(getValue(report, row.key)))
                        ) : (
                          <Typography variant="body2">
                            {String(getValue(report, row.key))}
                          </Typography>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {!comparedData && (
          <Button
            variant="contained"
            startIcon={<CompareIcon />}
            onClick={handleCompare}
            disabled={loading || reportIds.length < 2}
          >
            Load Full Comparison
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ReportsCompareDialog;
