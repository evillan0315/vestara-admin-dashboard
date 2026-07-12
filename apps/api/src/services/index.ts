export { AuthService } from './auth.service.js';
export { AuditLogService } from './audit-log.service.js';
export { SettingsService } from './settings.service.js';
export { OnboardingService } from './onboarding.service.js';
export { FileService } from './file.service.js';

// Singleton service instances
import { AuthService } from './auth.service.js';
import { AuditLogService } from './audit-log.service.js';
import { SettingsService } from './settings.service.js';
import { OnboardingService } from './onboarding.service.js';
import { FileService } from './file.service.js';

export const authService = new AuthService();
export const auditLogService = new AuditLogService();
export const settingsService = new SettingsService();
export const onboardingService = new OnboardingService();
export const fileService = new FileService();
