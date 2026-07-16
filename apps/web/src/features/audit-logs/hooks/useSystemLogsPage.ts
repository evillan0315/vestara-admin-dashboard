import { useState, useCallback, useMemo } from 'react';
import type { SortState, PaginationState } from '../../../components/data/DataTable';
import { useAuditLogs } from '../hooks';

export function useSystemLogsPage() {
  const [sort, setSort] = useState<SortState>({ field: 'createdAt', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useAuditLogs({
    page,
    perPage,
    sort: sort.field,
    order: sort.direction,
  });

  const logs = data?.data ?? [];

  const paginationState: PaginationState | undefined = useMemo(() => {
    const meta = data?.meta;
    if (!meta) return undefined;
    return { page: meta.page, perPage: meta.perPage, total: meta.total };
  }, [data?.meta]);

  const handleSortChange = useCallback((newSort: SortState) => {
    setSort(newSort);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return {
    sort,
    page,
    perPage,
    search,
    logs,
    paginationState,
    isLoading,
    isError,
    error,
    refetch,
    handleSortChange,
    handleSearchChange,
    handlePageChange,
    setPerPage,
  };
}
