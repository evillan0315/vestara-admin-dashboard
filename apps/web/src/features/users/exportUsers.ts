import { usersApi, type UserListParams } from '../../api/users';
import type { UserDTO } from '@vestara/types';

interface CsvColumn {
  header: string;
  value: (user: UserDTO) => string | number | boolean;
}

const CSV_COLUMNS: CsvColumn[] = [
  { header: 'ID', value: (u) => u.id },
  { header: 'First Name', value: (u) => u.firstName },
  { header: 'Last Name', value: (u) => u.lastName },
  { header: 'Email', value: (u) => u.email },
  { header: 'Role', value: (u) => u.role },
  { header: 'Status', value: (u) => (u.isActive ? 'active' : 'inactive') },
  { header: 'Created At', value: (u) => u.createdAt },
  { header: 'Last Login', value: (u) => u.lastLoginAt ?? '' },
];

function escapeCsv(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const MAX_PAGES = 50;
const PAGE_SIZE = 100;

async function fetchAllUsers(
  params: Omit<UserListParams, 'page' | 'perPage'>,
): Promise<UserDTO[]> {
  const all: UserDTO[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = await usersApi.list({ ...params, page, perPage: PAGE_SIZE });
    const items = res.data ?? [];
    all.push(...items);
    const total = res.meta?.total ?? 0;
    if (items.length === 0 || all.length >= total) break;
  }
  return all;
}

/**
 * Export the users matching the given filters to a CSV file and trigger a
 * download in the browser. Fetches the full (paginated) result set so the
 * export reflects every matching record, not just the visible page.
 */
export async function exportUsersCsv(
  params: Omit<UserListParams, 'page' | 'perPage'>,
): Promise<void> {
  const users = await fetchAllUsers(params);

  const header = CSV_COLUMNS.map((col) => escapeCsv(col.header)).join(',');
  const rows = users.map((user) =>
    CSV_COLUMNS.map((col) => escapeCsv(col.value(user))).join(','),
  );
  const csv = [header, ...rows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
