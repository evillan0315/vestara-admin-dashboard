import { z, ZodError } from 'zod';

// ── Common Field Validators ───────────────────

const emailField = z.string().email('Invalid email address');

const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const nameField = (field: string) =>
  z.string().min(1, `${field} is required`).max(100, `${field} must be at most 100 characters`);

const uuidField = z.string().uuid('Invalid UUID');

const roleField = z.enum(['super_admin', 'admin', 'moderator', 'support']);

// ── Authentication ────────────────────────────

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailField,
  password: passwordField,
  firstName: nameField('First name'),
  lastName: nameField('Last name'),
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordField,
});

// ── User Management ───────────────────────────

export const createUserSchema = z.object({
  email: emailField,
  password: passwordField,
  firstName: nameField('First name'),
  lastName: nameField('Last name'),
  role: roleField,
});

export const updateUserSchema = z.object({
  firstName: nameField('First name').optional(),
  lastName: nameField('Last name').optional(),
  role: roleField.optional(),
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordField,
});

export const userIdParamSchema = z.object({
  id: uuidField,
});

// ── Profile ───────────────────────────────────

export const updateProfileSchema = z.object({
  firstName: nameField('First name'),
  lastName: nameField('Last name'),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

// ── Settings ──────────────────────────────────

export const updateSettingSchema = z.object({
  key: z.string().min(1, 'Key is required').max(100),
  value: z.record(z.unknown()),
});

// ── Audit ─────────────────────────────────────

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  action: z.string().optional(),
  entity: z.string().optional(),
  userId: uuidField.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ── Pagination ────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
});

// ── Generic ───────────────────────────────────

export const idParamSchema = z.object({
  id: uuidField,
});

export const idsBodySchema = z.object({
  ids: z.array(uuidField).min(1, 'At least one ID is required'),
});

export const bulkActionSchema = z.object({
  ids: z.array(uuidField).min(1),
  action: z.string().min(1),
});

// ── Error Formatting ─────────────────────────

export interface FormattedValidationError {
  field: string;
  message: string;
  code: string;
}

export function formatValidationError(error: ZodError): FormattedValidationError[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}

export function createValidationError(error: ZodError) {
  return {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: formatValidationError(error),
  };
}

// ── Inferred Types ────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
export type BulkActionInput = z.infer<typeof bulkActionSchema>;
