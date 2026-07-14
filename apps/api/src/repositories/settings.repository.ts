import { Prisma } from '../generated/prisma/client.js';
import { BaseRepository } from './base.repository.js';

export class SettingsRepository extends BaseRepository {
  /**
   * Find a setting by key within an organization.
   */
  async findByKey(key: string, organizationId: string) {
    return this.prisma.systemSetting.findUnique({ where: { organizationId_key: { organizationId, key } } });
  }

  /**
   * Find a setting by key or throw.
   */
  async findByKeyOrThrow(key: string, organizationId: string) {
    const setting = await this.findByKey(key, organizationId);
    this.assertFound(setting, 'System setting', key);
    return setting;
  }

  /**
   * Get all settings as full records within an organization.
   */
  async getAll(organizationId: string) {
    return this.prisma.systemSetting.findMany({
      where: { organizationId },
      orderBy: { key: 'asc' },
    });
  }

  /**
   * Get all settings as a key-value map within an organization.
   */
  async getAllAsMap(organizationId: string): Promise<Record<string, unknown>> {
    const settings = await this.prisma.systemSetting.findMany({ where: { organizationId } });
    return settings.reduce<Record<string, unknown>>(
      (acc: Record<string, unknown>, s: { key: string; value: unknown }) => {
        acc[s.key] = s.value as Record<string, unknown>;
        return acc;
      },
      {},
    );
  }

  /**
   * Upsert a setting (create or update) within an organization.
   */
  async upsert(key: string, value: Record<string, unknown>, updatedBy: string | undefined, organizationId: string) {
    return this.prisma.systemSetting.upsert({
      where: { organizationId_key: { organizationId, key } },
      create: { key, value: value as Prisma.InputJsonValue, updatedBy, organizationId },
      update: { value: value as Prisma.InputJsonValue, updatedBy },
    });
  }

  /**
   * Delete a setting by key within an organization.
   */
  async delete(key: string, organizationId: string) {
    await this.prisma.systemSetting.delete({ where: { organizationId_key: { organizationId, key } } });
  }
}
