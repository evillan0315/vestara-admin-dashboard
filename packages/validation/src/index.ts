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
  organizationId: uuidField.optional(),
});

export const updateUserSchema = z.object({
  firstName: nameField('First name').optional(),
  lastName: nameField('Last name').optional(),
  role: roleField.optional(),
  isActive: z.boolean().optional(),
  organizationId: uuidField.optional(),
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

export const changeEmailSchema = z.object({
  newEmail: emailField,
  currentPassword: z.string().optional(),
});

export const deleteAccountSchema = z.object({
  currentPassword: z.string().optional(),
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: 'Type DELETE to confirm account deletion' }),
  }),
});

// ── Settings ──────────────────────────────────

export const updateSettingSchema = z.object({
  key: z.string().min(1, 'Key is required').max(100),
  value: z.record(z.unknown()),
});

// ── Organization (multi-tenancy) ──────────────

export const slugField = z
  .string()
  .min(2, 'Slug must be at least 2 characters')
  .max(60, 'Slug must be at most 60 characters')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with optional hyphens');

export const createOrganizationSchema = z.object({
  name: nameField('Organization name'),
  slug: slugField,
  logoUrl: z.string().url('Invalid logo URL').optional().or(z.literal('')),
});

export const updateOrganizationSchema = z.object({
  name: nameField('Organization name').optional(),
  logoUrl: z.string().url('Invalid logo URL').optional().or(z.literal('')),
});

export const organizationIdParamSchema = z.object({
  id: uuidField,
});

// ── Onboarding (first-time setup) ──────────────────

export const onboardSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Password must contain at least one uppercase letter').regex(/[a-z]/, 'Password must contain at least one lowercase letter').regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: nameField('First name'),
  lastName: nameField('Last name'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters').max(100, 'Organization name must be at most 100 characters'),
  organizationSlug: z.string().min(2, 'Slug must be at least 2 characters').max(60, 'Slug must be at most 60 characters').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with optional hyphens'),
  organizationLogoUrl: z.string().url('Invalid logo URL').optional().or(z.literal('')),
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

export const bulkStatusSchema = z.object({
  ids: z.array(uuidField).min(1, 'At least one ID is required'),
  status: z.enum(['active', 'inactive']),
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
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
export type IdsBodyInput = z.infer<typeof idsBodySchema>;
export type BulkStatusInput = z.infer<typeof bulkStatusSchema>;
export type BulkActionInput = z.infer<typeof bulkActionSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type OrganizationIdParamInput = z.infer<typeof organizationIdParamSchema>;
export type OnboardInput = z.infer<typeof onboardSchema>;
