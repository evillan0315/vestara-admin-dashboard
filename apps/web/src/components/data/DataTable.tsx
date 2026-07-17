import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Checkbox,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  styled,
  type TableCellProps,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  ChevronLeft,
  ChevronRight,
  FirstPage,
  LastPage,
} from '@mui/icons-material';
import { useState, useCallback, type ReactNode } from 'react';
import { Loading } from '../feedback/Loading';
import { NoSearchResults, EmptyState } from '../feedback/EmptyState';
import { Inbox } from '@mui/icons-material';

// ── Types ─────────────────────────────────────

export interface Column<T> {
  id: string;
  label: string;
  accessor?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: TableCellProps['align'];
  render?: (value: unknown, row: T) => ReactNode;
}

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: string;
  direction: SortDirection;
}

export interface PaginationState {
  page: number;
  perPage: number;
  total: number;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  sortable?: boolean;
  sortState?: SortState;
  onSortChange?: (sort: SortState) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  title?: string;
  actions?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  perPageOptions?: number[];
  rowCount?: number; // total count for server-side
}

// ── Styled Components ─────────────────────────

const TableHeaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: theme.palette.text.secondary,
  backgroundColor:
    theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.background.default,
  borderBottom: `2px solid ${theme.palette.divider}`,
  whiteSpace: 'nowrap',
  padding: theme.spacing(1.5, 2),
}));

const BodyCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  fontSize: '0.875rem',
}));

const TableRowStyled = styled(TableRow, {
  shouldForwardProp: (prop) => prop !== 'clickable',
})<{ clickable?: boolean }>(({ theme, clickable }) => ({
  cursor: clickable ? 'pointer' : 'default',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td': {
    borderBottom: 'none',
  },
}));

const ToolbarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  padding: theme.spacing(2, 2, 1.5, 2),
  flexWrap: 'wrap',
}));

const SearchField = styled(TextField)(({ theme }) => ({
  minWidth: { xs: '100%', sm: 280 },
  maxWidth: { xs: '100%', sm: 400 },
  [theme.breakpoints.down('sm')]: {
    width: '100%',
  },
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    backgroundColor:
      theme.palette.mode === 'light' ? theme.palette.background.paper : theme.palette.grey[900],
  },
  '& .MuiOutlinedInput-input': {
    padding: theme.spacing(1, 1.5),
    fontSize: '0.875rem',
  },
}));

const PaginationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1.5, 2),
  borderTop: `1px solid ${theme.palette.divider}`,
  flexWrap: 'wrap',
  gap: theme.spacing(1),
}));

const PageButton = styled(IconButton)(({ theme }) => ({
  borderRadius: 8,
  padding: theme.spacing(0.75),
  '&.Mui-disabled': {
    opacity: 0.3,
  },
}));

const InfoText = styled(Typography)(({ theme }) => ({
  fontSize: '0.8125rem',
  color: theme.palette.text.secondary,
}));

const TableWrapper = styled(TableContainer)(({ theme }) => ({
  borderRadius: 12,
  border: `1px solid ${theme.palette.divider}`,
  overflow: 'hidden',
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
  '& .MuiTable-root': {
    borderCollapse: 'separate',
    borderSpacing: 0,
    minWidth: 650,
  },
}));

// ── Component ─────────────────────────────────

export function DataTable<T>({
  columns,
  rows,
  keyExtractor,
  loading = false,
  error = null,
  onRetry,
  sortable = true,
  sortState,
  onSortChange,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  pagination,
  onPageChange,
  onPerPageChange,
  searchable = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  title,
  actions,
  filters,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  perPageOptions = [10, 20, 50, 100],
}: DataTableProps<T>) {
  const [localSearch, setLocalSearch] = useState(searchValue);

  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value);
      onSearchChange?.(value);
    },
    [onSearchChange],
  );

  const handleSort = useCallback(
    (field: string) => {
      if (!sortState || !onSortChange) return;
      const isAsc = sortState.field === field && sortState.direction === 'asc';
      onSortChange({ field, direction: isAsc ? 'desc' : 'asc' });
    },
    [sortState, onSortChange],
  );

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (selectedIds.length === rows.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(rows.map(keyExtractor));
    }
  }, [rows, selectedIds, onSelectionChange, keyExtractor]);

  const handleSelectRow = useCallback(
    (id: string) => {
      if (!onSelectionChange) return;
      const newSelected = selectedIds.includes(id)
        ? selectedIds.filter((sid) => sid !== id)
        : [...selectedIds, id];
      onSelectionChange(newSelected);
    },
    [selectedIds, onSelectionChange],
  );

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.perPage) : 1;

  const getPageNumbers = useCallback(() => {
    if (!pagination) return [];
    const pages: number[] = [];
    const current = pagination.page;
    const total = totalPages;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1); // ellipsis
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 2) pages.push(-1); // ellipsis
      pages.push(total);
    }
    return pages;
  }, [pagination, totalPages]);

  const handlePageSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onPerPageChange?.(Number(e.target.value));
    },
    [onPerPageChange],
  );

  // Error state
  if (error) {
    return (
      <TableWrapper>
        <Box sx={{ p: 4 }}>
          <EmptyState
            iconComponent={Inbox}
            title="Error Loading Data"
            description={error}
            action={onRetry ? { label: 'Try Again', onClick: onRetry } : undefined}
            variant="error"
          />
        </Box>
      </TableWrapper>
    );
  }

  return (
    <TableWrapper>
      {/* Toolbar */}
      {(searchable || title || actions || filters) && (
        <ToolbarContainer>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {title && (
              <Typography variant="subtitle1" fontWeight={600}>
                {title}
              </Typography>
            )}
            {searchable && (
              <SearchField
                size="small"
                placeholder={searchPlaceholder}
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: localSearch ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => handleSearchChange('')}>
                        <ClearIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            )}
            {filters && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>{filters}</Box>
            )}
          </Box>
          {actions && <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>{actions}</Box>}
        </ToolbarContainer>
      )}

      {/* Table */}
      <Table sx={{ minWidth: { xs: 650, md: 650 } }}>
        <TableHead>
          <TableRow>
            {selectable && (
              <TableHeaderCell sx={{ width: 48, px: 2 }}>
                <Checkbox
                  size="small"
                  indeterminate={selectedIds.length > 0 && selectedIds.length < rows.length}
                  checked={rows.length > 0 && selectedIds.length === rows.length}
                  onChange={handleSelectAll}
                />
              </TableHeaderCell>
            )}
            {columns.map((col) => (
              <TableHeaderCell key={col.id} sx={{ width: col.width }} align={col.align}>
                {sortable && col.sortable !== false && onSortChange ? (
                  <TableSortLabel
                    active={sortState?.field === col.id}
                    direction={sortState?.field === col.id ? sortState?.direction : 'asc'}
                    onClick={() => handleSort(col.id)}
                  >
                    {col.label}
                  </TableSortLabel>
                ) : (
                  col.label
                )}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (selectable ? 1 : 0)}
                sx={{ border: 'none', p: 4 }}
              >
                <Loading variant="inline" message="Loading data..." />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (selectable ? 1 : 0)}
                sx={{ border: 'none', p: 4 }}
              >
                {searchValue ? (
                  <NoSearchResults query={searchValue} onClear={() => handleSearchChange('')} />
                ) : (
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle || 'No Data'}
                    description={emptyDescription || 'No records found.'}
                  />
                )}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const rowId = keyExtractor(row);
              const isSelected = selectedIds.includes(rowId);
              return (
                <TableRowStyled key={rowId} hover selected={isSelected} clickable={false}>
                  {selectable && (
                    <BodyCell sx={{ width: 48, px: 2 }}>
                      <Checkbox
                        size="small"
                        checked={isSelected}
                        onChange={() => handleSelectRow(rowId)}
                      />
                    </BodyCell>
                  )}
                  {columns.map((col) => {
                    let value: ReactNode;
                    if (col.render) {
                      value = col.render(
                        col.accessor ? col.accessor(row) : (row as Record<string, unknown>)[col.id],
                        row,
                      );
                    } else if (col.accessor) {
                      value = col.accessor(row);
                    } else {
                      value = String((row as Record<string, unknown>)[col.id] ?? '');
                    }
                    return (
                      <BodyCell key={col.id} align={col.align}>
                        {value}
                      </BodyCell>
                    );
                  })}
                </TableRowStyled>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pagination && (
        <PaginationContainer>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoText>
              {pagination.total === 0
                ? 'No results'
                : `${(pagination.page - 1) * pagination.perPage + 1}–${Math.min(
                    pagination.page * pagination.perPage,
                    pagination.total,
                  )} of ${pagination.total}`}
            </InfoText>
            <Box
              component="select"
              sx={{
                ml: 1,
                fontSize: '0.8125rem',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 0.5,
                bgcolor: 'transparent',
                color: 'text.secondary',
                cursor: 'pointer',
              }}
              value={pagination.perPage}
              onChange={handlePageSizeChange}
            >
              {perPageOptions.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PageButton
              size="small"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(1)}
            >
              <FirstPage fontSize="small" />
            </PageButton>
            <PageButton
              size="small"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
            >
              <ChevronLeft fontSize="small" />
            </PageButton>

            {getPageNumbers().map((p, i) =>
              p === -1 ? (
                <Typography
                  key={`ellipsis-${i}`}
                  variant="body2"
                  color="text.disabled"
                  sx={{ px: 0.5 }}
                >
                  ...
                </Typography>
              ) : (
                <PageButton
                  key={p}
                  size="small"
                  onClick={() => onPageChange?.(p)}
                  sx={{
                    fontWeight: pagination.page === p ? 700 : 400,
                    backgroundColor: pagination.page === p ? 'primary.main' : 'transparent',
                    color: pagination.page === p ? 'primary.contrastText' : 'text.secondary',
                    '&:hover': {
                      backgroundColor: pagination.page === p ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  {p}
                </PageButton>
              ),
            )}

            <PageButton
              size="small"
              disabled={pagination.page >= totalPages}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              <ChevronRight fontSize="small" />
            </PageButton>
            <PageButton
              size="small"
              disabled={pagination.page >= totalPages}
              onClick={() => onPageChange?.(totalPages)}
            >
              <LastPage fontSize="small" />
            </PageButton>
          </Box>
        </PaginationContainer>
      )}
    </TableWrapper>
  );
}

export default DataTable;
