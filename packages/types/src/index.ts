// ──────────────────────────────────────────────
// Shared Types — Enums, DTOs, Interfaces
// ──────────────────────────────────────────────

// ── Enums ─────────────────────────────────────

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SUPPORT = 'support',
}

export enum Permission {
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  ROLE_CREATE = 'role:create',
  ROLE_READ = 'role:read',
  ROLE_UPDATE = 'role:update',
  ROLE_DELETE = 'role:delete',
  SYSTEM_SETTINGS = 'system:settings',
  SYSTEM_AUDIT = 'system:audit',
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  SUSPEND = 'suspend',
  ACTIVATE = 'activate',
  PASSWORD_CHANGE = 'password_change',
  SETTINGS_UPDATE = 'settings_update',
  SETTINGS_DELETE = 'settings_delete',
  ERROR = 'error',
}

export enum EntityType {
  USER = 'user',
  ROLE = 'role',
  SETTING = 'setting',
  AUDIT_LOG = 'audit_log',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

// ── API Response ──────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
  meta?: PaginationMeta;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
  sort?: string;
  order?: SortOrder;
}

// ── DTOs: Authentication ──────────────────────

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface RegisterRequestDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole; // Optional for self-registration, required for admin registration
}

export interface AuthResponseDTO {
  user: UserDTO;
  tokens: AuthTokensDTO;
}

export interface AuthTokensDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ForgotPasswordRequestDTO {
  email: string;
}

export interface ResetPasswordRequestDTO {
  token: string;
  password: string;
}

// ── DTOs: User Management ────────────────────

export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  organizationId: string;
  avatarUrl?: string;
  provider?: string;
  providerId?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequestDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId?: string;
}

export interface UpdateUserRequestDTO {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
  organizationId?: string;
}

export interface ChangePasswordRequestDTO {
  currentPassword: string;
  newPassword: string;
}

// ── DTOs: Pagination ─────────────────────────

export interface PaginatedResponseDTO<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface PaginatedRequestDTO {
  page: number;
  perPage: number;
  sort?: string;
  order?: SortOrder;
  search?: string;
}

// ── Domain: Audit ────────────────────────────

export interface AuditLogDTO {
  id: string;
  action: AuditAction;
  entity: EntityType;
  entityId: string;
  userId: string;
  organizationId: string;
  userName?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ── Domain: Settings ─────────────────────────

export interface SystemSettingDTO {
  id: string;
  key: string;
  value: Record<string, unknown>;
  organizationId: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingRequestDTO {
  key: string;
  value: Record<string, unknown>;
}

// ── Domain: Organization (multi-tenancy) ───────

export interface OrganizationDTO {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationRequestDTO {
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface UpdateOrganizationRequestDTO {
  name?: string;
  logoUrl?: string;
}

// ── Navigation ────────────────────────────────

export interface NavItem {
  id: string;
  label: string;
  path?: string;
  icon?: string;
  children?: NavItem[];
  permissions?: Permission[];
}

// ── Theme (legacy type alias for convenience) ──

export type ThemeModeUnion = 'light' | 'dark' | 'system';


