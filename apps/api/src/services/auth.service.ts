import bcrypt from 'bcryptjs';
import type { UserRole } from '@vestara/types';
import { ERROR_CODES } from '@vestara/constants';
import { JwtService } from '../utils/jwt.js';
import { ConflictError, UnauthorizedError } from '../utils/errors.js';
import {
  userRepository,
  sessionRepository,
  refreshTokenRepository,
  auditLogRepository,
  organizationRepository,
} from '../repositories/index.js';

export class AuthService {
  /**
   * Register a new user with hashed password.
   */
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }) {
    const { email, password, firstName, lastName, role } = data;

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered', ERROR_CODES.USER_ALREADY_EXISTS);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Assign the user to the default organization (creating it if needed).
    const organization = await organizationRepository.findDefaultOrCreate();

    const user = await userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      organizationId: organization.id,
    });

    const tokens = await this.generateTokens(user.id, user.organizationId);

    await this.logAudit('REGISTER', 'user', user.id, user.organizationId, {
      email: user.email,
      role: user.role,
    });

    return { user, ...tokens };
  }

  /**
   * Authenticate user and generate tokens.
   */
  async login(data: { email: string; password: string; ipAddress?: string; userAgent?: string }) {
    const { email, password, ipAddress, userAgent } = data;

    const user = await userRepository.findByEmail(email);
    if (!user || !user.isActive || !user.passwordHash) {
      throw new UnauthorizedError('Invalid credentials', ERROR_CODES.INVALID_CREDENTIALS);
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials', ERROR_CODES.INVALID_CREDENTIALS);
    }

    await userRepository.updateLastLogin(user.id);

    const tokens = await this.generateTokens(user.id, user.organizationId);

    await sessionRepository.create({
      userId: user.id,
      organizationId: user.organizationId,
      token: tokens.accessToken,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await this.logAudit('LOGIN', 'user', user.id, user.organizationId, {
      ipAddress,
      userAgent: userAgent ? '***' : undefined,
    });

    return { user, ...tokens };
  }

  /**
   * Refresh access token using refresh token.
   */
  async refreshToken(refreshToken: string) {
    const refreshTokenRecord = await refreshTokenRepository.findByToken(refreshToken);
    if (!refreshTokenRecord || refreshTokenRecord.revokedAt) {
      throw new UnauthorizedError('Invalid refresh token', ERROR_CODES.REFRESH_TOKEN_INVALID);
    }

    const tokenUser = JwtService.validateRefreshToken(refreshToken);
    if (!tokenUser) {
      throw new UnauthorizedError('Invalid refresh token', ERROR_CODES.REFRESH_TOKEN_INVALID);
    }

    const user = await userRepository.findByIdOrThrow(tokenUser.id);
    if (!user.isActive) {
      throw new UnauthorizedError('User account is inactive', ERROR_CODES.ACCOUNT_DISABLED);
    }

    // generateTokens already persists a new refresh token record for the rotated token.
    const tokens = await this.generateTokens(user.id, user.organizationId);

    // Revoke the previously-used refresh token to complete the rotation.
    await refreshTokenRepository.revoke(refreshTokenRecord.id);

    await this.logAudit('REFRESH_TOKEN', 'user', user.id, user.organizationId);

    return tokens;
  }

  /**
   * Logout user and invalidate tokens.
   */
  async logout(data: { userId: string; organizationId?: string; refreshToken?: string }) {
    const { userId, organizationId, refreshToken } = data;

    if (refreshToken) {
      const refreshTokenRecord = await refreshTokenRepository.findByToken(refreshToken);
      if (refreshTokenRecord && !refreshTokenRecord.revokedAt) {
        await refreshTokenRepository.revoke(refreshTokenRecord.id);
      }
    }

    await refreshTokenRepository.revokeAllForUser(userId);
    await sessionRepository.deleteAllForUser(userId);

    const orgId = organizationId ?? (await userRepository.findById(userId))?.organizationId ?? '';
    await this.logAudit('LOGOUT', 'user', userId, orgId);

    return { success: true };
  }

  /**
   * Generate JWT access and refresh tokens.
   */
  private async generateTokens(userId: string, organizationId: string) {
    const accessToken = JwtService.generateAccessToken(userId, organizationId);
    const refreshToken = JwtService.generateRefreshToken(userId, organizationId);

    await refreshTokenRepository.create({
      token: refreshToken,
      userId,
      organizationId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken };
  }

  /**
   * Find or create a user from an OAuth provider (Google, GitHub).
   * Returns the existing user if already linked, or creates a new one.
   */
  async oauthLogin(data: {
    provider: string;
    providerId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { provider, providerId, email, firstName, lastName, avatarUrl, ipAddress, userAgent } = data;

    // 1. Check if a user already exists for this provider+providerId
    const user = await userRepository.findByProvider(provider, providerId);

    if (user) {
      // Existing OAuth user — update last login
      await userRepository.updateLastLogin(user.id);
      const tokens = await this.generateTokens(user.id, user.organizationId);
      await this.logAudit('OAUTH_LOGIN', 'user', user.id, user.organizationId, { provider });
      return { user, ...tokens };
    }

    // 2. Check if a user with the same email exists (email/password account)
    const existingByEmail = await userRepository.findByEmail(email);
    if (existingByEmail) {
      // Log them in with their existing account
      await userRepository.updateLastLogin(existingByEmail.id);
      const tokens = await this.generateTokens(existingByEmail.id, existingByEmail.organizationId);
      await sessionRepository.create({
        userId: existingByEmail.id,
        organizationId: existingByEmail.organizationId,
        token: tokens.accessToken,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await this.logAudit('OAUTH_LOGIN', 'user', existingByEmail.id, existingByEmail.organizationId, {
        provider,
        linked: true,
      });
      return { user: existingByEmail, ...tokens };
    }

    // 3. Create a new user from OAuth data, assigned to the default organization.
    const organization = await organizationRepository.findDefaultOrCreate();
    const newUser = await userRepository.create({
      email,
      firstName,
      lastName,
      role: 'admin' as import('@vestara/types').UserRole,
      organizationId: organization.id,
      provider,
      providerId,
      avatarUrl,
    });

    const tokens = await this.generateTokens(newUser.id, newUser.organizationId);

    await sessionRepository.create({
      userId: newUser.id,
      organizationId: newUser.organizationId,
      token: tokens.accessToken,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await this.logAudit('OAUTH_REGISTER', 'user', newUser.id, newUser.organizationId, { provider });

    return { user: newUser, ...tokens };
  }

  /**
   * Log authentication-related audit entries.
   */
  private async logAudit(
    action: string,
    entity: string,
    entityId: string,
    organizationId: string,
    metadata?: Record<string, unknown>,
  ) {
    await auditLogRepository.create({
      action,
      entity,
      entityId,
      userId: entityId,
      organizationId,
      metadata,
    });
  }
}
