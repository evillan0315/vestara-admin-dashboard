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
  EMAIL_CHANGE = 'email_change',
  ACCOUNT_DELETION = 'account_deletion',
  SETTINGS_UPDATE = 'settings_update',
  SETTINGS_DELETE = 'settings_delete',
  SETTINGS_IMPORT = 'settings_import',
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

export interface ChangeEmailRequestDTO {
  newEmail: string;
  currentPassword?: string;
}

export interface DeleteAccountRequestDTO {
  currentPassword?: string;
  confirmation: string;
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

export interface SettingsExportDTO {
  version: number;
  exportedAt: string;
  organizationId: string;
  settings: {
    key: string;
    value: Record<string, unknown>;
    updatedAt: string;
    updatedBy?: string;
  }[];
}

export interface SettingsImportRequestDTO {
  settings: Record<string, unknown>;
}

export interface SettingsImportResultDTO {
  imported: number;
  created: number;
  updated: number;
  details: { key: string; action: 'created' | 'updated' }[];
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

// ── Domain: Chat & AI ─────────────────────────

export enum ChatRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export interface ChatMessageDTO {
  id: string;
  conversationId: string;
  role: ChatRole;
  content: string;
  model?: string;
  tokenCount?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ChatConversationDTO {
  id: string;
  title: string;
  userId: string;
  organizationId: string;
  model: string;
  systemPrompt?: string;
  isArchived: boolean;
  messageCount?: number;
  lastMessage?: ChatMessageDTO;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationRequestDTO {
  title: string;
  model?: string;
  systemPrompt?: string;
  firstMessage?: string;
}

export interface SendMessageRequestDTO {
  content: string;
  model?: string;
}

export interface ChatCompletionDTO {
  message: ChatMessageDTO;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ChatModelsDTO {
  models: {
    id: string;
    name: string;
    description: string;
    maxTokens: number;
  }[];
}

// ── Theme (legacy type alias for convenience) ──

export type ThemeModeUnion = 'light' | 'dark' | 'system';

// ── WebSocket (Real-Time) ─────────────────────

/**
 * Client-side connection lifecycle states surfaced to the UI.
 */
export type WebSocketConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

/**
 * Canonical WebSocket event type identifiers exchanged between server and client.
 * Room names use the `org:<organizationId>` convention for org-scoped broadcasts.
 */
export const WS_EVENT = {
  CONNECTION_ESTABLISHED: 'connection:established',
  PRESENCE_UPDATE: 'presence:update',
  AUDIT_CREATED: 'audit:created',
  NOTIFICATION: 'notification',
  PONG: 'pong',
  ERROR: 'error',
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  PING: 'ping',
} as const;

export type WsEventType = (typeof WS_EVENT)[keyof typeof WS_EVENT];

/**
 * Org-scoped room name helper. All real-time broadcasts for a tenant are
 * delivered to subscribers of this room.
 */
export const WS_ROOM = {
  org: (organizationId: string) => `org:${organizationId}`,
} as const;

export interface WsPresenceUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface WsPresencePayload {
  organizationId: string;
  onlineCount: number;
  users: WsPresenceUser[];
}

export interface WsNotificationPayload {
  id: string;
  title: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
}

export interface WsConnectionEstablishedPayload {
  clientId: string;
  userId: string;
  organizationId: string;
}

/**
 * Messages pushed from the server to connected clients.
 */
export type ServerToClientMessage =
  | { type: typeof WS_EVENT.CONNECTION_ESTABLISHED; payload: WsConnectionEstablishedPayload }
  | { type: typeof WS_EVENT.PRESENCE_UPDATE; payload: WsPresencePayload }
  | { type: typeof WS_EVENT.AUDIT_CREATED; payload: AuditLogDTO }
  | { type: typeof WS_EVENT.NOTIFICATION; payload: WsNotificationPayload }
  | { type: typeof WS_EVENT.PONG; payload: { timestamp: number } }
  | { type: typeof WS_EVENT.ERROR; payload: { message: string } };

/**
 * Messages sent from clients to the server.
 */
export type ClientToServerMessage =
  | { type: typeof WS_EVENT.SUBSCRIBE; payload: { room: string } }
  | { type: typeof WS_EVENT.UNSUBSCRIBE; payload: { room: string } }
  | { type: typeof WS_EVENT.PING; payload: { timestamp: number } };


