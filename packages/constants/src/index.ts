// ──────────────────────────────────────────────
// Global Constants
// ──────────────────────────────────────────────

// ── API ───────────────────────────────────────

export const API_VERSION = 'v1' as const;
export const API_PREFIX = `/api/${API_VERSION}` as const;

// ── HTTP Status Codes ─────────────────────────

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ── Error Codes ──────────────────────────────

export const ERROR_CODES = {
  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',

  // Authorization
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // User
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  PASSWORD_MISMATCH: 'PASSWORD_MISMATCH',
  SAME_PASSWORD: 'SAME_PASSWORD',

  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMITED: 'RATE_LIMITED',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

// ── API Route Paths ──────────────────────────

export const ROUTES = {
  AUTH: {
    BASE: '/auth',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    ME: '/auth/me',
  },
  USERS: {
    BASE: '/users',
    DETAIL: (id: string) => `/users/${id}`,
    CHANGE_PASSWORD: (id: string) => `/users/${id}/change-password`,
  },
  SETTINGS: {
    BASE: '/settings',
    DETAIL: (key: string) => `/settings/${key}`,
  },
  AUDIT: {
    BASE: '/audit-logs',
    DETAIL: (id: string) => `/audit-logs/${id}`,
  },
} as const;

// ── Token ─────────────────────────────────────

export const ACCESS_TOKEN_KEY = 'accessToken' as const;
export const REFRESH_TOKEN_KEY = 'refreshToken' as const;
export const TOKEN_EXPIRY_KEY = 'tokenExpiresAt' as const;

export const TOKEN_TYPE = 'Bearer' as const;

// ── Roles ─────────────────────────────────────

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  SUPPORT: 'support',
} as const;

// ── Permissions ──────────────────────────────

export const PERMISSIONS = {
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  ROLE_CREATE: 'role:create',
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  SYSTEM_SETTINGS: 'system:settings',
  SYSTEM_AUDIT: 'system:audit',
} as const;

// ── Pagination ───────────────────────────────

export const DEFAULT_PAGE_SIZE = 20 as const;
export const MAX_PAGE_SIZE = 100 as const;

// ── Storage Keys ─────────────────────────────

export const STORAGE_KEYS = {
  THEME_MODE: 'vestara-theme-mode',
  SIDEBAR_COLLAPSED: 'vestara-sidebar-collapsed',
} as const;

// ── Date/Time Format Tokens ──────────────────

export const DATE_FORMAT = 'yyyy-MM-dd' as const;
export const DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss" as const;
export const DISPLAY_DATE_FORMAT = 'MMM dd, yyyy' as const;
export const DISPLAY_DATETIME_FORMAT = 'MMM dd, yyyy HH:mm' as const;

// ── Audit ────────────────────────────────────

export const AUDIT_ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
  SUSPEND: 'suspend',
  ACTIVATE: 'activate',
  PASSWORD_CHANGE: 'password_change',
  SETTINGS_UPDATE: 'settings_update',
  SETTINGS_DELETE: 'settings_delete',
} as const;

export const ENTITY_TYPES = {
  USER: 'user',
  ROLE: 'role',
  SETTING: 'setting',
  AUDIT_LOG: 'audit_log',
} as const;

// ── Rate Limiting ────────────────────────────

export const RATE_LIMIT = {
  AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  AUTH_MAX_REQUESTS: 5,
  API_WINDOW_MS: 60 * 1000, // 1 minute
  API_MAX_REQUESTS: 100,
} as const;

// ── Regex ─────────────────────────────────────

export const REGEX = {
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  PHONE: /^\+?[\d\s()-]{7,20}$/,
} as const;
