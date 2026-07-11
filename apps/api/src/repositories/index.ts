export { UserRepository } from './user.repository.js';
export { SessionRepository } from './session.repository.js';
export { AuditLogRepository } from './audit-log.repository.js';
export { SettingsRepository } from './settings.repository.js';
export { RefreshTokenRepository } from './refresh-token.repository.js';
export { OrganizationRepository } from './organization.repository.js';

// Singleton repository instances
import { UserRepository } from './user.repository.js';
import { SessionRepository } from './session.repository.js';
import { AuditLogRepository } from './audit-log.repository.js';
import { SettingsRepository } from './settings.repository.js';
import { RefreshTokenRepository } from './refresh-token.repository.js';
import { OrganizationRepository } from './organization.repository.js';

export const userRepository = new UserRepository();
export const sessionRepository = new SessionRepository();
export const auditLogRepository = new AuditLogRepository();
export const settingsRepository = new SettingsRepository();
export const refreshTokenRepository = new RefreshTokenRepository();
export const organizationRepository = new OrganizationRepository();
