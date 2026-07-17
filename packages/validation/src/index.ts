import { z, ZodError } from 'zod';
import { PASSWORD_POLICY, COMMON_PASSWORDS } from '@vestara/constants';

// ── Common Field Validators ───────────────────

const emailField = z.string().email('Invalid email address');

/**
 * Score a candidate password from 0–4 based on satisfied character classes
 * (length, lowercase, uppercase, number, symbol). Shared by the API and any
 * server-side strength checks so the rules live in one place.
 */
export function scorePasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= PASSWORD_POLICY.MIN_LENGTH) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const passwordField = z
  .string()
  .min(
    PASSWORD_POLICY.MIN_LENGTH,
    `Password must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters`,
  )
  .max(
    PASSWORD_POLICY.MAX_LENGTH,
    `Password must be at most ${PASSWORD_POLICY.MAX_LENGTH} characters`,
  )
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one symbol (e.g. !@#$%)')
  .refine(
    (pw) => !(PASSWORD_POLICY.BLOCK_COMMON_PASSWORDS && COMMON_PASSWORDS.has(pw.toLowerCase())),
    'Password is too common or has appeared in a known data breach',
  );
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
  firstName: nameField('First name').optional(),
  lastName: nameField('Last name').optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  phone: z.string().max(30, 'Phone must be at most 30 characters').optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional().or(z.literal('')),
  dateOfBirth: z.string().datetime().optional().or(z.literal('')),
  contactEmail: emailField.optional().or(z.literal('')),
  addressLine1: z.string().max(200).optional().or(z.literal('')),
  addressLine2: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  postalCode: z.string().max(20).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  loginAlerts: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  language: z.string().min(2).max(10).optional(),
  timezone: z.string().max(100).optional(),
  dateFormat: z.enum(['mdy', 'dmy', 'ymd']).optional(),
  themeMode: z.enum(['light', 'dark', 'system']).optional(),
  fontFamily: z.enum(['inter', 'plus-jakarta-sans', 'roboto', 'system']).optional(),
  fontSizeScale: z.number().min(0.75).max(1.25).optional(),
  fontWeight: z.enum(['light', 'normal', 'medium', 'semibold', 'bold']).optional(),
  primaryColor: z.enum(['gold', 'blue', 'purple', 'green', 'red', 'indigo', 'teal']).optional(),
  density: z.enum(['compact', 'comfortable', 'spacious']).optional(),
  sidebarVariant: z.enum(['default', 'compact', 'hidden']).optional(),
  borderRadiusScale: z.number().min(0.5).max(2.0).optional(),
  contrastLevel: z.enum(['normal', 'high']).optional(),
  profileVisibility: z.enum(['public', 'organization', 'private']).optional(),
  showEmail: z.boolean().optional(),
  showActivity: z.boolean().optional(),
  searchable: z.boolean().optional(),
});

export const submitKycSchema = z.object({
  documentType: z
    .enum(['passport', 'driver_license', 'proof_of_address', 'selfie', 'other'])
    .optional(),
});

export const addKycDocumentSchema = z.object({
  documentType: z
    .enum(['passport', 'driver_license', 'proof_of_address', 'selfie', 'other'])
    .default('other'),
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

export const importSettingsSchema = z.object({
  settings: z.record(z.unknown()),
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
  id: z.string().min(1, 'Organization ID is required'),
});

// ── Onboarding (first-time setup) ──────────────────

export const onboardSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: nameField('First name'),
  lastName: nameField('Last name'),
  organizationName: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be at most 100 characters'),
  organizationSlug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(60, 'Slug must be at most 60 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase alphanumeric with optional hyphens',
    ),
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
  role: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
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

// ── Integrations: External REST Data Sources ──

const dataSourceAuthConfigSchema = z.record(z.unknown()).optional();

export const createDataSourceSchema = z.object({
  name: nameField('Name').max(100),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  method: z.enum(['GET', 'POST']).default('GET'),
  baseUrl: z.string().url('Base URL must be a valid URL'),
  path: z.string().max(500, 'Path must be at most 500 characters').optional(),
  headers: z.record(z.string()).optional(),
  body: z.record(z.unknown()).optional(),
  authType: z.enum(['none', 'bearer', 'basic', 'apiKey']).default('none'),
  authConfig: dataSourceAuthConfigSchema,
  refreshInterval: z
    .number()
    .int()
    .min(0, 'Refresh interval must be non-negative')
    .max(86400, 'Refresh interval must be at most 86400 seconds')
    .optional(),
});

export const updateDataSourceSchema = createDataSourceSchema.partial();

export const dataSourceIdParamSchema = z.object({
  id: z.string().min(1, 'Data source ID is required'),
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
export type SubmitKycInput = z.infer<typeof submitKycSchema>;
export type AddKycDocumentInput = z.infer<typeof addKycDocumentSchema>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
export type ImportSettingsInput = z.infer<typeof importSettingsSchema>;
export type IdsBodyInput = z.infer<typeof idsBodySchema>;
export type BulkStatusInput = z.infer<typeof bulkStatusSchema>;
export type BulkActionInput = z.infer<typeof bulkActionSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type OrganizationIdParamInput = z.infer<typeof organizationIdParamSchema>;
export type OnboardInput = z.infer<typeof onboardSchema>;
export type CreateDataSourceInput = z.infer<typeof createDataSourceSchema>;
export type UpdateDataSourceInput = z.infer<typeof updateDataSourceSchema>;
