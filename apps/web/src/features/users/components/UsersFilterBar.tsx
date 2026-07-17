import {
  TextField,
  InputAdornment,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Button,
  Paper,
  styled,
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import type { UserRole } from '@vestara/types';
import { UserRole as UserRoleEnum } from '@vestara/types';

const FilterBar = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(1.5, 2),
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  flexWrap: 'wrap',
}));

interface UsersFilterBarProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchClear: () => void;
  roleFilter: UserRole | '';
  onRoleFilterChange: (role: string) => void;
  statusFilter: boolean | '';
  onStatusFilterChange: (status: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const ROLE_OPTIONS: { value: UserRole | ''; label: string }[] = [
  { value: '', label: 'All Roles' },
  { value: UserRoleEnum.SUPER_ADMIN, label: 'Super Admin' },
  { value: UserRoleEnum.ADMIN, label: 'Admin' },
  { value: UserRoleEnum.MODERATOR, label: 'Moderator' },
  { value: UserRoleEnum.SUPPORT, label: 'Support' },
];

const STATUS_OPTIONS: { value: boolean | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: true, label: 'Active' },
  { value: false, label: 'Inactive' },
];

export function UsersFilterBar({
  searchTerm,
  onSearchChange,
  onSearchClear,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
  hasActiveFilters,
}: UsersFilterBarProps) {
  return (
    <FilterBar elevation={0}>
      <TextField
        placeholder="Search by name or email"
        value={searchTerm}
        onChange={onSearchChange}
        sx={{ minWidth: 260 }}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="inherit" sx={{ fontSize: 20, color: 'text.secondary' }} />
            </InputAdornment>
          ),
          endAdornment: searchTerm ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={onSearchClear}>
                <ClearIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <Select
          value={roleFilter === '' ? '' : roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          displayEmpty
          renderValue={(v) => {
            const option = ROLE_OPTIONS.find((o) => o.value === v);
            return option?.label || 'All Roles';
          }}
          sx={{ borderRadius: '8px', fontSize: '0.8125rem' }}
        >
          {ROLE_OPTIONS.map((option) => (
            <MenuItem
              key={String(option.value)}
              value={option.value}
              sx={{ fontSize: '0.8125rem' }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <Select
          value={statusFilter === '' ? '' : String(statusFilter)}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          displayEmpty
          renderValue={(v) => {
            if (v === 'true') return 'Active';
            if (v === 'false') return 'Inactive';
            return 'All Statuses';
          }}
          sx={{ borderRadius: '8px', fontSize: '0.8125rem' }}
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem
              key={String(option.value)}
              value={String(option.value)}
              sx={{ fontSize: '0.8125rem' }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {hasActiveFilters && (
        <Button size="small" startIcon={<ClearIcon />} onClick={onClearFilters} sx={{ ml: 'auto' }}>
          Clear filters
        </Button>
      )}
    </FilterBar>
  );
}

export default UsersFilterBar;
