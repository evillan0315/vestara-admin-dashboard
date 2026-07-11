import { BaseRepository } from './base.repository.js';

export class SessionRepository extends BaseRepository {
  /**
   * Create a new session.
   */
  async create(data: {
    userId: string;
    token: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }) {
    return this.prisma.session.create({ data });
  }

  /**
   * Find a session by token.
   */
  async findByToken(token: string) {
    return this.prisma.session.findUnique({ where: { token } });
  }

  /**
   * Find all sessions for a user.
   */
  async findByUserId(userId: string) {
    return this.prisma.session.findMany({
      where: { userId },
      orderBy: { lastActivity: 'desc' },
    });
  }

  /**
   * Update session last activity.
   */
  async updateActivity(id: string) {
    return this.prisma.session.update({
      where: { id },
      data: { lastActivity: new Date() },
    });
  }

  /**
   * Delete a session by ID.
   */
  async delete(id: string) {
    await this.prisma.session.delete({ where: { id } });
  }

  /**
   * Delete all sessions for a user.
   */
  async deleteAllForUser(userId: string) {
    await this.prisma.session.deleteMany({ where: { userId } });
  }

  /**
   * Delete expired sessions.
   */
  async deleteExpired() {
    await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  /**
   * Count active sessions for a user.
   */
  async countActiveForUser(userId: string) {
    return this.prisma.session.count({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    });
  }
}
