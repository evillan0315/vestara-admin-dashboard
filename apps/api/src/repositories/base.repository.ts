import prisma from '../utils/prisma.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Abstract base repository providing shared Prisma instance and common helpers.
 */
export abstract class BaseRepository {
  protected readonly prisma = prisma;

  /**
   * Throws a NotFoundError if the record is null/undefined.
   */
  protected assertFound<T>(record: T | null, entityName: string, id: string): asserts record is T {
    if (!record) {
      throw new NotFoundError(`${entityName} with id '${id}' not found`);
    }
  }
}
