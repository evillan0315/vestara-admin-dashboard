export { AuthService } from './auth.service.js';
export { AuditLogService } from './audit-log.service.js';
export { SettingsService } from './settings.service.js';

// Singleton service instances
import { AuthService } from './auth.service.js';
import { AuditLogService } from './audit-log.service.js';
import { SettingsService } from './settings.service.js';

export const authService = new AuthService();
export const auditLogService = new AuditLogService();
export const settingsService = new SettingsService();
