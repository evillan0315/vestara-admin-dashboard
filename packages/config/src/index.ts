// ──────────────────────────────────────────────
// Shared Configuration
// ──────────────────────────────────────────────

export const appConfig = {
  name: 'Vestara Admin',
  version: '1.0.0',
  description: 'Enterprise administration platform for the Vestara ecosystem',
} as const;

export const paginationDefaults = {
  page: 1,
  perPage: 20,
  maxPerPage: 100,
} as const;

export const apiDefaults = {
  timeout: 30000,
  retryCount: 1,
} as const;
