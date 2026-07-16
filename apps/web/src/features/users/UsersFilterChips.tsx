import { Box, Button, Chip, MenuItem, Popover, Typography } from '@mui/material';
import {
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { useRef, useState, type ReactElement } from 'react';
import type { UserRole } from '@vestara/types';
import { UserRole as UserRoleEnum } from '@vestara/types';

interface UsersFilterChipsProps {
  // Removed search: string;
  roleFilter: UserRole | '';
  statusFilter: boolean | '';
  // Removed onSearchChange: (value: string) => void;
  onRoleFilterChange: (role: UserRole | '') => void;
  onStatusFilterChange: (status: boolean | '') => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: UserRoleEnum.SUPER_ADMIN, label: 'Super Admin' },
  { value: UserRoleEnum.ADMIN, label: 'Admin' },
  { value: UserRoleEnum.MODERATOR, label: 'Moderator' },
  { value: UserRoleEnum.SUPPORT, label: 'Support' },
];

const STATUS_OPTIONS = [
  { value: true as const, label: 'Active' },
  { value: false as const, label: 'Inactive' },
];

export function UsersFilterChips({
  // Removed search,
  roleFilter,
  statusFilter,
  // Removed onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onClearFilters,
  hasActiveFilters,
}: UsersFilterChipsProps): ReactElement {
  const filterAnchorRef = useRef<HTMLElement | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const handleFilterClose = () => {
    setFilterOpen(false);
    filterAnchorRef.current = null;
  };

  const handleFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
    filterAnchorRef.current = event.currentTarget;
    setFilterOpen(true);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Filter Button */}
      <Button
        variant={hasActiveFilters ? 'contained' : 'outlined'}
        startIcon={<FilterListIcon />}
        onClick={handleFilterOpen}
        sx={{ minWidth: 'auto' }}
      >
        Filters
      </Button>

      {/* Role Filter Chip */}
      {roleFilter && (
        <Chip
          label={ROLE_OPTIONS.find((r) => r.value === roleFilter)?.label || roleFilter}
          onDelete={() => onRoleFilterChange('')}
          size="small"
          variant="outlined"
          color="primary"
          deleteIcon={<ClearIcon fontSize="small" />}
        />
      )}

      {/* Status Filter Chip */}
      {statusFilter !== '' && (
        <Chip
          label={STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label || String(statusFilter)}
          onDelete={() => onStatusFilterChange('')}
          size="small"
          variant="outlined"
          color={statusFilter ? 'success' : 'warning'}
          deleteIcon={<ClearIcon fontSize="small" />}
        />
      )}

      {/* Removed Search Filter Chip */}
      {/* Removed Search Filter Chip */}
      {/* Removed Search Filter Chip */}

      {/* Clear All Filters */}
      {hasActiveFilters && (
        <Button size="small" onClick={onClearFilters} sx={{ ml: 1 }}>
          Clear all
        </Button>
      )}

      {/* Filter Popover */}
      <Popover
        open={filterOpen}
        anchorEl={filterAnchorRef.current}
        onClose={handleFilterClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { minWidth: 300, p: 2 } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Role Filter */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Role
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <MenuItem
                selected={roleFilter === ''}
                onClick={() => {
                  onRoleFilterChange('');
                  handleFilterClose();
                }}
                sx={{ px: 1, py: 0.75 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label="All Roles"
                    size="small"
                    variant={roleFilter === '' ? 'filled' : 'outlined'}
                    color={roleFilter === '' ? 'primary' : 'default'}
                    sx={{ fontWeight: roleFilter === '' ? 600 : 400 }}
                  />
                </Box>
              </MenuItem>
{ROLE_OPTIONS.map((role) => (
                 <MenuItem
                   key={role.value}
                   selected={roleFilter === role.value}
                   onClick={() => {
                     onRoleFilterChange(role.value);
                     handleFilterClose();
                   }}
                   sx={{ px: 1, py: 0.75 }}
                 >
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     <Chip
                       label={role.label}
                       size="small"
                       variant={roleFilter === role.value ? 'filled' : 'outlined'}
                       color={roleFilter === role.value ? 'primary' : 'default'}
                       sx={{ fontWeight: roleFilter === role.value ? 600 : 400 }}
                     />
                   </Box>
                 </MenuItem>
               ))}
            </Box>
          </Box>

          <Box component="hr" sx={{ my: 1, borderColor: 'divider' }} />

          {/* Status Filter */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Status
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <MenuItem
                selected={statusFilter === ''}
                onClick={() => {
                  onStatusFilterChange('');
                  handleFilterClose();
                }}
                sx={{ px: 1, py: 0.75 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label="All Statuses"
                    size="small"
                    variant={statusFilter === '' ? 'filled' : 'outlined'}
                    color={statusFilter === '' ? 'primary' : 'default'}
                    sx={{ fontWeight: statusFilter === '' ? 600 : 400 }}
                  />
                </Box>
              </MenuItem>
{STATUS_OPTIONS.map((status) => (
                 <MenuItem
                   key={String(status.value)}
                   selected={statusFilter === status.value}
                   onClick={() => {
                     onStatusFilterChange(status.value);
                     handleFilterClose();
                   }}
                   sx={{ px: 1, py: 0.75 }}
                 >
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     <Chip
                       label={status.label}
                       icon={status.value ? <CheckCircleIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                       size="small"
                       variant={statusFilter === status.value ? 'filled' : 'outlined'}
                       color={statusFilter === status.value ? 'primary' : (status.value ? 'success' : 'warning')}
                       sx={{ fontWeight: statusFilter === status.value ? 600 : 400 }}
                     />
                   </Box>
                 </MenuItem>
               ))}
            </Box>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
}