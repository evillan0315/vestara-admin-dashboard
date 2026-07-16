import { Avatar, Box, IconButton, Tooltip, Typography } from '@mui/material';
import { Edit as EditIcon, People as PeopleIcon } from '@mui/icons-material';
import type { Column } from '../../../components/data/DataTable';
import type { OrganizationDTO } from '@vestara/types';

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface CreateOrganizationsColumnsParams {
  onEdit: (org: OrganizationDTO) => void;
}

export function createOrganizationsColumns({
  onEdit,
}: CreateOrganizationsColumnsParams): Column<OrganizationDTO>[] {
  return [
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
            <IconButton size="small" onClick={() => onEdit(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];
}
