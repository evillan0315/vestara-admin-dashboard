import bcrypt from 'bcryptjs';
import type { UserRole } from '@vestara/types';
import { ERROR_CODES } from '@vestara/constants';
import { JwtService } from '../utils/jwt.js';
import { ConflictError } from '../utils/errors.js';
import {
  userRepository,
  sessionRepository,
  refreshTokenRepository,
  auditLogRepository,
  organizationRepository,
} from '../repositories/index.js';

export interface OnboardUserData {
  email: string;
  password?: string; // Optional for OAuth
  firstName: string;
  lastName: string;
  role?: UserRole; // Optional, defaults to 'support'
  organizationName: string;
  organizationSlug: string;
  organizationLogoUrl?: string;
  provider?: string; // For OAuth
  providerId?: string;
  avatarUrl?: string;
}

export interface OnboardResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    organizationId: string;
    avatarUrl?: string;
    provider?: string;
    createdAt: Date;
    updatedAt: Date;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export class OnboardingService {
  /**
   * Complete onboarding: create organization + user + generate tokens
   */
  async onboard(data: OnboardUserData) {
    const {
      email,
      password,
      firstName,
      lastName,
      role = 'support' as UserRole,
      organizationName,
      organizationSlug,
      organizationLogoUrl,
    } = data;

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered', ERROR_CODES.USER_ALREADY_EXISTS);
    }

    // Check if organization slug exists
    const existingOrg = await organizationRepository.findBySlug(organizationSlug);
    if (existingOrg) {
      throw new ConflictError(
        'Organization slug already taken',
        ERROR_CODES.ORGANIZATION_SLUG_EXISTS,
      );
    }

    // Hash password if provided (for local registration)
    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await bcrypt.hash(password, 12);
    }

    // Create organization
    const organization = await organizationRepository.create({
      name: organizationName,
      slug: organizationSlug,
      logoUrl: organizationLogoUrl,
    });

    // Create user with organization
    const user = await userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      organizationId: organization.id,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, organization.id);

    // Create session
    await sessionRepository.create({
      userId: user.id,
      organizationId: organization.id,
      token: tokens.accessToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Log audit
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
        provider: user.provider,
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
   * Log onboarding-related audit entries.
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
