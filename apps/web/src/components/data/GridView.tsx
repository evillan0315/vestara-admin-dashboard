import { Box, Checkbox, Paper, Typography, alpha, useTheme } from '@mui/material';
import { type ReactNode, useCallback } from 'react';
import type { Column } from './DataTable';
import { Loading } from '../feedback/Loading';
import { NoSearchResults, EmptyState } from '../feedback/EmptyState';

export interface GridViewProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onRowClick?: (row: T) => void;
  searchValue?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  cardAvatar?: (row: T) => ReactNode;
  cardTitle?: (row: T) => ReactNode;
  cardSubtitle?: (row: T) => ReactNode;
  cardActions?: (row: T) => ReactNode;
  cardSx?: (row: T) => Record<string, unknown>;
}

export function GridView<T>({
  columns,
  rows,
  keyExtractor,
  loading = false,
  error = null,
  onRetry,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  onRowClick,
  searchValue,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  cardAvatar,
  cardTitle,
  cardSubtitle,
  cardActions,
  cardSx,
}: GridViewProps<T>) {
  const theme = useTheme();

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

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <EmptyState
          title="Error Loading Data"
          description={error}
          action={onRetry ? { label: 'Try Again', onClick: onRetry } : undefined}
          variant="error"
        />
      </Box>
    );
  }

  if (loading) {
    return <Loading variant="inline" message="Loading data..." />;
  }

  if (rows.length === 0) {
    return (
      <Box sx={{ p: 4 }}>
        {searchValue ? (
          <NoSearchResults query={searchValue} onClear={() => undefined} />
        ) : (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle || 'No Data'}
            description={emptyDescription || 'No records found.'}
          />
        )}
      </Box>
    );
  }

  return (
    <Box>
      {selectable && rows.length > 1 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1.5,
            px: 0.5,
          }}
        >
          <Checkbox
            size="small"
            indeterminate={selectedIds.length > 0 && selectedIds.length < rows.length}
            checked={rows.length > 0 && selectedIds.length === rows.length}
            onChange={handleSelectAll}
          />
          <Typography variant="caption" color="text.secondary">
            {selectedIds.length > 0
              ? `${selectedIds.length} selected`
              : 'Select all'}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)',
            xl: 'repeat(5, 1fr)',
          },
          gap: 2,
        }}
      >
        {rows.map((row) => {
          const id = keyExtractor(row);
          const isSelected = selectedIds.includes(id);

          return (
            <Paper
              key={id}
              onClick={() => {
                if (selectable) handleSelectRow(id);
                onRowClick?.(row);
              }}
              sx={{
                p: 2,
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.15s',
                border: '1px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                },
                ...(cardSx?.(row) ?? {}),
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                {selectable && (
                  <Checkbox
                    size="small"
                    checked={isSelected}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => handleSelectRow(id)}
                    sx={{ mt: -0.5, ml: -0.5 }}
                  />
                )}
                {cardAvatar?.(row)}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {cardTitle ? (
                    <Box sx={{ mb: 0.25 }}>{cardTitle(row)}</Box>
                  ) : null}
                  {cardSubtitle ? (
                    <Box sx={{ mb: 1 }}>{cardSubtitle(row)}</Box>
                  ) : null}
                </Box>
                {cardActions ? (
                  <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    {cardActions(row)}
                  </Box>
                ) : null}
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '2px 12px',
                  mt: 0.5,
                }}
              >
                {columns
                  .filter((col) => {
                    const val = col.accessor ? col.accessor(row) : (row as Record<string, unknown>)[col.id];
                    return val != null && val !== '' && col.id !== 'actions';
                  })
                  .map((col) => {
                    const value = col.accessor ? col.accessor(row) : (row as Record<string, unknown>)[col.id];
                    return (
                      <Box key={col.id} sx={{ minWidth: 0 }}>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem', lineHeight: 1 }}>
                          {col.label}
                        </Typography>
                        <Box sx={{ fontSize: '0.75rem', lineHeight: 1.4, mt: 0.25 }}>
                          {col.render ? col.render(value, row) : String(value ?? '—')}
                        </Box>
                      </Box>
                    );
                  })}
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}

export default GridView;
