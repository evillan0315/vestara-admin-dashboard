import bcrypt from 'bcryptjs';
import type { UserRole } from '@vestara/types';
import { ERROR_CODES, ACCOUNT_LOCKOUT } from '@vestara/constants';
import { JwtService } from '../utils/jwt.js';
import { ConflictError, UnauthorizedError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
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
   * Complete onboarding: create organization + user + generate tokens
   * Used for first-time setup where a new organization is created.
   */
  async onboard(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
    organizationSlug: string;
    organizationLogoUrl?: string;
  }) {
    const { email, password, firstName, lastName, organizationName, organizationSlug, organizationLogoUrl } = data;

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered', ERROR_CODES.USER_ALREADY_EXISTS);
    }

    // Check if organization slug exists
    const existingOrg = await organizationRepository.findBySlug(organizationSlug);
    if (existingOrg) {
      throw new ConflictError('Organization slug already taken', ERROR_CODES.ORGANIZATION_SLUG_EXISTS);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create organization
    const organization = await organizationRepository.create({
      name: organizationName,
      slug: organizationSlug,
      ...(organizationLogoUrl ? { logoUrl: organizationLogoUrl } : {}),
    });

    // Create user with super_admin role in the new organization
    const user = await userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'super_admin' as UserRole,
      organizationId: organization.id,
    });

    const tokens = await this.generateTokens(user.id, organization.id);

    await this.logAudit('REGISTER', 'user', user.id, organization.id, {
      email: user.email,
      role: user.role,
      organizationName: organization.name,
      organizationSlug: organization.slug,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        organizationId: user.organizationId,
        avatarUrl: user.avatarUrl ?? undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logoUrl: organization.logoUrl,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 3600,
      },
    };
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

    // ── Account lockout check ──────────────────────────────────────
    // If the account is currently locked, reject immediately without
    // comparing the password (prevents timing-based enumeration).
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.logAudit('LOGIN_FAILED_LOCKED', 'user', user.id, user.organizationId, {
        ipAddress,
        lockedUntil: user.lockedUntil.toISOString(),
      });
      throw new UnauthorizedError(
        'Account is temporarily locked due to too many failed login attempts',
        ERROR_CODES.ACCOUNT_LOCKED,
      );
    }

    // If the lockout has expired, reset the counter before checking.
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await userRepository.updateLoginAttempts(user.id, 0, null);
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      // ── Increment failed attempts ────────────────────────────────
      const attempts = (user.failedLoginAttempts ?? 0) + 1;
      const shouldLock = attempts >= ACCOUNT_LOCKOUT.MAX_FAILED_ATTEMPTS;
      const lockedUntil = shouldLock
        ? new Date(Date.now() + ACCOUNT_LOCKOUT.LOCKOUT_DURATION_MS)
        : null;

      await userRepository.updateLoginAttempts(user.id, attempts, lockedUntil);

      logger.warn(
        { userId: user.id, email: user.email, attempts, locked: shouldLock },
        'Failed login attempt',
      );

      await this.logAudit('LOGIN_FAILED', 'user', user.id, user.organizationId, {
        ipAddress,
        attempts,
        locked: shouldLock,
      });

      if (shouldLock) {
        throw new UnauthorizedError(
          'Account locked due to too many failed login attempts',
          ERROR_CODES.ACCOUNT_LOCKED,
        );
      }

      throw new UnauthorizedError('Invalid credentials', ERROR_CODES.INVALID_CREDENTIALS);
    }

    // ── Successful login — reset failed attempts ───────────────────
    if ((user.failedLoginAttempts ?? 0) > 0) {
      await userRepository.updateLoginAttempts(user.id, 0, null);
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
      role: 'support' as import('@vestara/types').UserRole,
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
