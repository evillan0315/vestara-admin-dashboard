import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PictureAsPdfIcon,
  TableChart as TableChartIcon,
  MoreVert as MoreVertIcon,
  HourglassEmpty as HourglassEmptyIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import type { Column } from '../../../components/data/DataTable';
import type { Report } from '../../../api/reports';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusIcon(status: Report['status']) {
  switch (status) {
    case 'pending':
    case 'generating':
      return <HourglassEmptyIcon color="warning" fontSize="small" />;
    case 'completed':
      return <CheckCircleIcon color="success" fontSize="small" />;
    case 'failed':
      return <ErrorIcon color="error" fontSize="small" />;
    default:
      return <HourglassEmptyIcon fontSize="small" />;
  }
}

function getStatusColor(status: Report['status']) {
  switch (status) {
    case 'pending':
    case 'generating':
      return 'warning' as const;
    case 'completed':
      return 'success' as const;
    case 'failed':
      return 'error' as const;
    default:
      return 'default' as const;
  }
}

function getFormatIcon(format: string) {
  switch (format) {
    case 'csv':
      return <TableChartIcon color="action" fontSize="small" />;
    case 'excel':
      return <DescriptionIcon color="success" fontSize="small" />;
    case 'pdf':
      return <PictureAsPdfIcon color="error" fontSize="small" />;
    default:
      return <AssessmentIcon color="action" fontSize="small" />;
  }
}

function getTypeLabel(type: Report['type']) {
  switch (type) {
    case 'audit_logs':
      return 'Audit Logs';
    case 'system_logs':
      return 'System Logs';
    case 'users':
      return 'Users';
    case 'activity':
      return 'Activity';
    default:
      return type;
  }
}

interface CreateReportsColumnsParams {
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, report: Report) => void;
}

export function createReportsColumns({ onMenuOpen }: CreateReportsColumnsParams): Column<Report>[] {
  return [
    {
      id: 'name',
      label: 'Report',
      sortable: true,
      width: 200,
      render: (_value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 1, backgroundColor: 'action.hover' }}>
            {getFormatIcon(row.format)}
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {row.name || 'Unnamed Report'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getTypeLabel(row.type)} &bull; {row.format.toUpperCase()}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      width: 130,
      sortable: true,
      render: (_value, row) => (
        <Chip
          icon={getStatusIcon(row.status)}
          label={row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          color={getStatusColor(row.status)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      id: 'params',
      label: 'Date Range',
      width: 180,
      render: (_value, row) => (
        <Typography variant="body2" color="text.secondary">
          {row.params?.startDate ? formatDate(row.params.startDate as string) : '—'} –{' '}
          {row.params?.endDate ? formatDate(row.params.endDate as string) : '—'}
        </Typography>
      ),
    },
    {
      id: 'fileSize',
      label: 'Size',
      width: 100,
      align: 'right' as const,
      render: (value) => <Typography variant="body2" color="text.secondary">{formatFileSize(value as number)}</Typography>,
    },
    {
      id: 'createdAt',
      label: 'Created',
      width: 160,
      sortable: true,
      render: (value) => <Typography variant="body2" color="text.secondary">{formatDate(value as string)}</Typography>,
    },
    {
      id: 'actions',
      label: '',
      width: 80,
      render: (_value, row) => (
        <Tooltip title="More actions">
          <IconButton size="small" onClick={(e) => onMenuOpen(e, row)}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];
}
