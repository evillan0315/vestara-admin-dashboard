import { BaseRepository } from './base.repository.js';

export class RefreshTokenRepository extends BaseRepository {
  /**
   * Create a new refresh token.
   */
  async create(data: {
    token: string;
    userId: string;
    organizationId: string;
    expiresAt: Date;
  }) {
    return this.prisma.refreshToken.create({ data });
  }

  /**
   * Find a refresh token by its value.
   */
  async findByToken(token: string) {
    return this.prisma.refreshToken.findUnique({ where: { token } });
  }

  /**
   * Revoke a refresh token.
   */
  async revoke(id: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoke all refresh tokens for a user.
   */
  async revokeAllForUser(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Delete expired refresh tokens.
   */
  async deleteExpired() {
    await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
