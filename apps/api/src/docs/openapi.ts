// ──────────────────────────────────────────────
// Swagger/OpenAPI Documentation
// ──────────────────────────────────────────────

import { extendZodWithOpenApi, OpenApiGeneratorV31, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  UserRole,
  AuditAction,
  EntityType,
} from '@vestara/types';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  updateProfileSchema,
  changeEmailSchema,
  deleteAccountSchema,
  updateSettingSchema,
  importSettingsSchema,
  createOrganizationSchema,
  updateOrganizationSchema,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  onboardSchema,
} from '@vestara/validation';

// Extend Zod with OpenAPI metadata
extendZodWithOpenApi(z);

// Create OpenAPI registry
const registry = new OpenAPIRegistry();

// ─── Security Scheme ──────────────────────────────────────────────────────────

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT access token',
});

// ─── Common Schemas ──────────────────────────────────────────────────────────

const PaginationMeta = z.object({
  page: z.number().int().min(1),
  perPage: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
}).openapi('PaginationMeta', {
  description: 'Pagination metadata',
});

registry.register('PaginationMeta', PaginationMeta);

const ApiError = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
}).openapi('ApiError', {
  description: 'API error response',
});

registry.register('ApiError', ApiError);

// ─── Auth Schemas ────────────────────────────────────────────────────────────

registry.register('LoginRequest', loginSchema);
registry.register('RegisterRequest', registerSchema);
registry.register('ForgotPasswordRequest', forgotPasswordSchema);
registry.register('ResetPasswordRequest', resetPasswordSchema);

const AuthTokens = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int(),
}).openapi('AuthTokens', {
  description: 'Authentication tokens',
});

registry.register('AuthTokens', AuthTokens);

// ─── User DTO ──────────────────────────────────────────────────────────────────

const UserDTO = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.nativeEnum(UserRole),
  isActive: z.boolean(),
  organizationId: z.string().uuid(),
  avatarUrl: z.string().url().nullable(),
  provider: z.string().nullable(),
  providerId: z.string().nullable(),
  lastLoginAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('UserDTO', {
  description: 'User data transfer object',
});

registry.register('UserDTO', UserDTO);

// ─── Auth Response ────────────────────────────────────────────────────────────

const AuthResponse = z.object({
  success: z.boolean(),
  data: z.object({
    user: z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      firstName: z.string(),
      lastName: z.string(),
      role: z.nativeEnum(UserRole),
      isActive: z.boolean(),
      organizationId: z.string().uuid(),
      avatarUrl: z.string().url().nullable(),
      provider: z.string().nullable(),
      providerId: z.string().nullable(),
      lastLoginAt: z.string().datetime().nullable(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    }),
    tokens: z.object({
      accessToken: z.string(),
      refreshToken: z.string(),
      expiresIn: z.number().int(),
    }),
  }),
}).openapi('AuthResponse', {
  description: 'Authentication response with user and tokens',
});

registry.register('AuthResponse', AuthResponse);

// ─── Register Auth Schemas ───────────────────────────────────────────────────

registry.register('LoginRequest', loginSchema);
registry.register('RegisterRequest', registerSchema);
registry.register('ForgotPasswordRequest', z.object({ email: z.string().email() }).openapi('ForgotPasswordRequest'));
registry.register('ResetPasswordRequest', z.object({ token: z.string(), password: z.string().min(8) }).openapi('ResetPasswordRequest'));
registry.register('OnboardRequest', onboardSchema);

// ─── User Schemas ──────────────────────────────────────────────────────────────

registry.register('UserDTO', UserDTO);
registry.register('CreateUserRequest', createUserSchema);
registry.register('UpdateUserRequest', updateUserSchema);
registry.register('ChangePasswordRequest', changePasswordSchema);

// ─── Profile ────────────────────────────────────────────────────────────────────

registry.register('UpdateProfileRequest', updateProfileSchema);
registry.register('ChangeEmailRequest', changeEmailSchema);
registry.register('DeleteAccountRequest', deleteAccountSchema);

// ─── Organization ───────────────────────────────────────────────────────────────

const OrganizationDTO = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().url().nullable(),
  userCount: z.number().int().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('OrganizationDTO', {
  description: 'Organization data transfer object',
});

registry.register('OrganizationDTO', OrganizationDTO);
registry.register('CreateOrganizationRequest', createOrganizationSchema);
registry.register('UpdateOrganizationRequest', updateOrganizationSchema);

// ─── Settings ──────────────────────────────────────────────────────────────────

const SystemSettingDTO = z.object({
  id: z.string().uuid(),
  key: z.string(),
  value: z.record(z.unknown()),
  updatedBy: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('SystemSettingDTO', {
  description: 'System setting data transfer object',
});

registry.register('SystemSettingDTO', SystemSettingDTO);
registry.register('UpdateSettingRequest', updateSettingSchema);
registry.register('ImportSettingsRequest', importSettingsSchema);

// ─── Audit Log ──────────────────────────────────────────────────────────────────

const AuditLogDTO = z.object({
  id: z.string().uuid(),
  action: z.nativeEnum(AuditAction),
  entity: z.nativeEnum(EntityType),
  entityId: z.string(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  userName: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.string().datetime(),
}).openapi('AuditLogDTO', {
  description: 'Audit log entry',
});

registry.register('AuditLogDTO', AuditLogDTO);

// ─── Chat ───────────────────────────────────────────────────────────────────────

const ChatMessageDTO = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  model: z.string().nullable(),
  tokenCount: z.number().int().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.string().datetime(),
}).openapi('ChatMessageDTO', {
  description: 'Chat message',
});

registry.register('ChatMessageDTO', ChatMessageDTO);

const ChatConversationDTO = z.object({
  id: z.string().uuid(),
  title: z.string(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  model: z.string(),
  systemPrompt: z.string().nullable(),
  isArchived: z.boolean(),
  messageCount: z.number().int().nullable(),
  lastMessage: z.object({
    id: z.string().uuid(),
    conversationId: z.string().uuid(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    model: z.string().nullable(),
    tokenCount: z.number().int().nullable(),
    metadata: z.record(z.unknown()).nullable(),
    createdAt: z.string().datetime(),
  }).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('ChatConversationDTO', {
  description: 'Chat conversation',
});

registry.register('ChatConversationDTO', ChatConversationDTO);

registry.register('CreateConversationRequest', z.object({
  title: z.string().min(1).max(200),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  firstMessage: z.string().optional(),
}).openapi('CreateConversationRequest'));

registry.register('SendMessageRequest', z.object({
  content: z.string().min(1),
  model: z.string().optional(),
}).openapi('SendMessageRequest'));

const ChatCompletion = z.object({
  userMessage: z.object({
    id: z.string().uuid(),
    conversationId: z.string().uuid(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    model: z.string().nullable(),
    tokenCount: z.number().int().nullable(),
    metadata: z.record(z.unknown()).nullable(),
    createdAt: z.string().datetime(),
  }),
  assistantMessage: z.object({
    id: z.string().uuid(),
    conversationId: z.string().uuid(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    model: z.string(),
    tokenCount: z.number().int(),
    metadata: z.record(z.unknown()).nullable(),
    createdAt: z.string().datetime(),
  }),
  usage: z.object({
    promptTokens: z.number().int(),
    completionTokens: z.number().int(),
    totalTokens: z.number().int(),
  }),
}).openapi('ChatCompletion', {
  description: 'Chat completion response with user message, AI response, and token usage',
});

registry.register('ChatCompletion', ChatCompletion);

registry.register('ChatModelsResponse', z.object({
  success: z.boolean(),
  data: z.object({
    models: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      maxTokens: z.number().int(),
      provider: z.string(),
    })),
  }),
}).openapi('ChatModelsResponse'));

registry.register('ChatStatsDTO', z.object({
  totalConversations: z.number().int(),
  totalMessages: z.number().int(),
  activeConversations: z.number().int(),
}).openapi('ChatStatsDTO'));

// ─── File ────────────────────────────────────────────────────────────────────────

const FileDTO = z.object({
  id: z.string().uuid(),
  name: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.bigint(),
  path: z.string(),
  url: z.string().url().nullable(),
  provider: z.enum(['LOCAL', 'CLOUDINARY', 'S3', 'GOOGLE_DRIVE']),
  providerId: z.string().nullable(),
  folderId: z.string().uuid().nullable(),
  uploadedBy: z.string().uuid(),
  organizationId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('FileDTO', {
  description: 'File data transfer object',
});

registry.register('FileDTO', FileDTO);

const FileStatsDTO = z.object({
  totalFiles: z.number().int(),
  totalSize: z.bigint(),
  byProvider: z.record(z.number().int()),
  byMimeType: z.record(z.number().int()),
}).openapi('FileStatsDTO', {
  description: 'File storage statistics',
});

registry.register('FileStatsDTO', FileStatsDTO);

// ─── Health ──────────────────────────────────────────────────────────────────────

const HealthResponse = z.object({
  status: z.literal('healthy'),
  timestamp: z.string().datetime(),
  uptime: z.number(),
  environment: z.string(),
}).openapi('HealthResponse', {
  description: 'Health check response',
});

registry.register('HealthResponse', HealthResponse);

// ─── Onboarding ──────────────────────────────────────────────────────────────────

registry.register('OnboardRequest', onboardSchema);

// ─── Register Other Schemas ────────────────────────────────────────────────────

registry.register('PaginationMeta', PaginationMeta);
registry.register('ApiError', z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
}).openapi('ApiError'));

// ─── Generate OpenAPI Document ─────────────────────────────────────────────────

const generator = new OpenApiGeneratorV31(registry.definitions);

export const openApiDocument = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'Vestara Admin API',
    version: '1.0.0',
    description: 'Vestara Admin Dashboard API - Multi-tenant enterprise administration platform',
    contact: {
      name: 'Vestara Team',
      url: 'https://vestara.com',
      email: 'support@vestara.com',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    { url: '/api/v1', description: 'Current API version' },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'OAuth', description: 'OAuth 2.0 providers (Google, GitHub)' },
    { name: 'Users', description: 'User management (requires admin role)' },
    { name: 'Profile', description: 'Current user profile management' },
    { name: 'Organizations', description: 'Organization management (super admin)' },
    { name: 'Settings', description: 'Application settings per organization' },
    { name: 'Audit Logs', description: 'Audit trail and system logs' },
    { name: 'Files', description: 'File management and uploads' },
    { name: 'Chat', description: 'AI Assistant chat conversations' },
    { name: 'Health', description: 'Health check endpoint' },
  ],
  security: [{ bearerAuth: [] }],
});

export { registry };