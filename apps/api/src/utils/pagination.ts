import type { PaginationMeta } from '@vestara/types';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@vestara/constants';

interface ParsedPagination {
  page: number;
  perPage: number;
  sort?: string;
  order: 'asc' | 'desc';
}

/**
 * Parse and validate pagination parameters from query string.
 */
export function parsePaginationParams(query: Record<string, unknown>): ParsedPagination {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const perPage = Math.min(
    MAX_PAGE_SIZE,
    Math.max(
      1,
      parseInt(String(query.perPage ?? String(DEFAULT_PAGE_SIZE)), 10) || DEFAULT_PAGE_SIZE,
    ),
  );
  const sort = typeof query.sort === 'string' ? query.sort : undefined;
  const order = query.order === 'asc' || query.order === 'desc' ? query.order : 'asc';

  return { page, perPage, sort, order };
}

/**
 * Build pagination metadata.
 */
export function buildPaginationMeta(page: number, perPage: number, total: number): PaginationMeta {
  return {
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage) || 1,
  };
}

/**
 * Build Prisma skip/take for paginated queries.
 */
export function buildPrismaPagination(
  page: number,
  perPage: number,
): { skip: number; take: number } {
  return {
    skip: (page - 1) * perPage,
    take: perPage,
  };
}

export interface PaginatedResult {
  data: unknown[];
  page: number;
  perPage: number;
  total: number;
}
