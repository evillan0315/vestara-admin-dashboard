import { Prisma } from '../../generated/prisma/client';
import { BaseRepository } from './base.repository.js';

export class SettingsRepository extends BaseRepository {
  /**
   * Find a setting by key.
   */
  async findByKey(key: string) {
    return this.prisma.systemSetting.findUnique({ where: { key } });
  }

  /**
   * Find a setting by key or throw.
   */
  async findByKeyOrThrow(key: string) {
    const setting = await this.findByKey(key);
    this.assertFound(setting, 'System setting', key);
    return setting;
  }

  /**
   * Get all settings as a key-value map.
   */
  async getAllAsMap(): Promise<Record<string, unknown>> {
    const settings = await this.prisma.systemSetting.findMany();
    return settings.reduce<Record<string, unknown>>(
      (acc, s) => {
        acc[s.key] = s.value as Record<string, unknown>;
        return acc;
      },
      {},
    );
  }

  /**
   * Upsert a setting (create or update).
   */
  async upsert(key: string, value: Record<string, unknown>, updatedBy?: string) {
    return this.prisma.systemSetting.upsert({
      where: { key },
      create: { key, value: value as Prisma.InputJsonValue, updatedBy },
      update: { value: value as Prisma.InputJsonValue, updatedBy },
    });
  }

  /**
   * Delete a setting by key.
   */
  async delete(key: string) {
    await this.prisma.systemSetting.delete({ where: { key } });
  }
}
