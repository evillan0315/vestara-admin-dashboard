import type { Prisma, UserRole } from '../../generated/prisma/client.js';
import bcrypt from 'bcryptjs';
import { BaseRepository } from './base.repository.js';

export class UserRepository extends BaseRepository {
  /**
   * Find all users with optional filtering and pagination.
   */
  async findAll(params?: {
    page?: number;
    perPage?: number;
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const page = params?.page ?? 1;
    const perPage = params?.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const where: Prisma.UserWhereInput = {};

    if (params?.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params?.role) {
      where.role = params.role;
    }

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (params?.sort) {
      (orderBy as Record<string, string>)[params.sort] = params.order ?? 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          avatarUrl: true,
          provider: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  /**
   * Find user by email.
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * Find user by ID with full details (including password hash).
   */
  async findByIdWithPassword(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Find user by ID (public fields only).
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        provider: true,
        providerId: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  /**
   * Find user by ID or throw.
   */
  async findByIdOrThrow(id: string) {
    const user = await this.findById(id);
    this.assertFound(user, 'User', id);
    return user;
  }

  /**
   * Find user by provider and provider ID (OAuth).
   */
  async findByProvider(provider: string, providerId: string) {
    return this.prisma.user.findUnique({
      where: { provider_providerId: { provider, providerId } },
    });
  }

  /**
   * Create a new user.
   */
  async create(data: {
    email: string;
    passwordHash?: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    provider?: string;
    providerId?: string;
    avatarUrl?: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        ...(data.passwordHash && { passwordHash: data.passwordHash }),
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        ...(data.provider && { provider: data.provider }),
        ...(data.providerId && { providerId: data.providerId }),
        ...(data.avatarUrl && { avatarUrl: data.avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        provider: true,
        providerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Update a user by ID.
   */
  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      role?: UserRole;
      isActive?: boolean;
      avatarUrl?: string;
    },
  ) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        provider: true,
        providerId: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  /**
   * Update the last login timestamp.
   */
  async updateLastLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * Update user password.
   */
  async updatePassword(id: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  /**
   * Delete a user by ID.
   */
  async delete(id: string) {
    await this.prisma.user.delete({ where: { id } });
  }

  /**
   * Delete multiple users by ID (used for bulk operations).
   * Returns the number of deleted records.
   */
  async deleteMany(ids: string[]) {
    if (ids.length === 0) return 0;
    const result = await this.prisma.user.deleteMany({
      where: { id: { in: ids } },
    });
    return result.count;
  }

  /**
   * Update the `isActive` flag for multiple users (used for bulk operations).
   * Returns the number of updated records.
   */
  async updateManyStatus(ids: string[], isActive: boolean) {
    if (ids.length === 0) return 0;
    const result = await this.prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { isActive },
    });
    return result.count;
  }

  /**
   * Count total users.
   */
  async count(where?: { isActive?: boolean; role?: UserRole }) {
    return this.prisma.user.count({ where: where as Prisma.UserCountArgs['where'] });
  }

  /**
   * Create a test user for development.
   */
  async createTestUser() {
    const email = `test-${Date.now()}@example.com`;
    const passwordHash = await bcrypt.hash('Password123', 12);

    return this.create({
      email,
      passwordHash,
      firstName: 'Test',
      lastName: 'User',
      role: 'admin' as UserRole,
    });
  }
}
