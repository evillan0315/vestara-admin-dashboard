import { AuditAction } from '@vestara/types';
import { settingsRepository, auditLogRepository } from '../repositories/index.js';

export class SettingsService {
  /**
   * Get a setting by key.
   */
  async findByKey(key: string, organizationId: string) {
    return settingsRepository.findByKeyOrThrow(key, organizationId);
  }

  /**
   * Get all settings as key-value pairs.
   */
  async getAllAsMap(organizationId: string): Promise<Record<string, unknown>> {
    return settingsRepository.getAllAsMap(organizationId);
  }

  /**
   * Create or update a setting.
   */
  async upsert(
    key: string,
    value: Record<string, unknown>,
    updatedBy: string | undefined,
    organizationId: string,
    action: AuditAction = AuditAction.SETTINGS_UPDATE,
  ) {
    const setting = await settingsRepository.upsert(key, value, updatedBy, organizationId);

    await this.logAudit(action, 'setting', key, organizationId, {
      value,
      updatedBy,
    });

    return setting;
  }

  /**
   * Delete a setting.
   */
  async delete(key: string, organizationId: string, updatedBy?: string) {
    const setting = await this.findByKey(key, organizationId);

    await settingsRepository.delete(key, organizationId);

    await this.logAudit(AuditAction.SETTINGS_DELETE, 'setting', key, organizationId, {
      previousValue: setting.value,
      updatedBy,
    });

    return { success: true };
  }

  /**
   * Log settings-related audit entries.
   */
  private async logAudit(
    action: AuditAction,
    entity: string,
    entityId: string,
    organizationId: string,
    metadata?: Record<string, unknown>,
  ) {
    const userId: string = typeof metadata?.updatedBy === 'string' ? metadata.updatedBy : 'system';

    await auditLogRepository.create({
      action,
      entity,
      entityId,
      userId,
      organizationId,
      metadata,
      ipAddress: undefined,
      userAgent: undefined,
    });
  }
}
