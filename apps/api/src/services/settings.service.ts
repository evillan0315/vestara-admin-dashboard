import { AuditAction } from '@vestara/types';
import { settingsRepository, auditLogRepository } from '../repositories/index.js';

export class SettingsService {
  /**
   * Get a setting by key (returns null when not found).
   */
  async findByKey(key: string, organizationId: string) {
    return settingsRepository.findByKey(key, organizationId);
  }

  /**
   * Get a setting by key or throw (404 when not found).
   */
  async findByKeyOrThrow(key: string, organizationId: string) {
    return settingsRepository.findByKeyOrThrow(key, organizationId);
  }

  /**
   * Get all settings as key-value pairs.
   */
  async getAllAsMap(organizationId: string): Promise<Record<string, unknown>> {
    return settingsRepository.getAllAsMap(organizationId);
  }

  /**
   * Get all settings as full records (with metadata).
   */
  async getAll(organizationId: string) {
    return settingsRepository.getAll(organizationId);
  }

  /**
   * Create or update a setting with audit logging and previous value tracking.
   */
  async upsert(
    key: string,
    value: Record<string, unknown>,
    updatedBy: string | undefined,
    organizationId: string,
    action: AuditAction = AuditAction.SETTINGS_UPDATE,
  ) {
    // Fetch existing setting to capture previous value for versioning
    const existing = await settingsRepository.findByKey(key, organizationId);

    const setting = await settingsRepository.upsert(key, value, updatedBy, organizationId);

    await this.logAudit(action, 'setting', key, organizationId, {
      value,
      previousValue: existing?.value ?? null,
      updatedBy,
      isNew: !existing,
    });

    return setting;
  }

  /**
   * Bulk upsert settings (for import) with audit logging.
   */
  async importSettings(
    settings: Record<string, unknown>,
    updatedBy: string | undefined,
    organizationId: string,
  ) {
    const results: { key: string; action: 'created' | 'updated' }[] = [];

    for (const [key, value] of Object.entries(settings)) {
      if (typeof value !== 'object' || value === null) {
        continue; // Skip non-object values
      }

      const existing = await settingsRepository.findByKey(key, organizationId);
      await settingsRepository.upsert(key, value as Record<string, unknown>, updatedBy, organizationId);

      await this.logAudit(AuditAction.SETTINGS_UPDATE, 'setting', key, organizationId, {
        value,
        previousValue: existing?.value ?? null,
        updatedBy,
        isNew: !existing,
        source: 'import',
      });

      results.push({ key, action: existing ? 'updated' : 'created' });
    }

    return results;
  }

  /**
   * Delete a setting.
   */
  async delete(key: string, organizationId: string, updatedBy?: string) {
    const setting = await this.findByKeyOrThrow(key, organizationId);

    await settingsRepository.delete(key, organizationId);

    await this.logAudit(AuditAction.SETTINGS_DELETE, 'setting', key, organizationId, {
      previousValue: setting.value,
      updatedBy,
    });

    return { success: true };
  }

  /**
   * Get audit history for settings.
   */
  async getAuditHistory(
    organizationId: string,
    params?: {
      page?: number;
      perPage?: number;
      startDate?: string;
      endDate?: string;
      sort?: string;
      order?: 'asc' | 'desc';
    },
  ) {
    return auditLogRepository.findAll({
      ...params,
      entity: 'setting',
      organizationId,
    });
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
