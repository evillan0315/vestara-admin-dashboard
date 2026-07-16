import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { AuthResponseDTO, UserRole } from '@vestara/types';
import { createUserSchema, loginSchema, scorePasswordStrength } from '@vestara/validation';
import { PASSWORD_POLICY, COMMON_PASSWORDS } from '@vestara/constants';
import { authService } from '../services/index.js';
import { JwtService } from '../utils/jwt.js';
import { userRepository } from '../repositories/index.js';

const router = Router();

/**
 * POST /auth/register - Register a new user
 */
router.post('/register', validate(createUserSchema), async (req, res, next) => {
  try {
    const authResult = await authService.register(req.body);
    // Create AuthResponseDTO from auth result
    const response: AuthResponseDTO = {
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        firstName: authResult.user.firstName,
        lastName: authResult.user.lastName,
        role: authResult.user.role as unknown as UserRole,
        isActive: authResult.user.isActive,
        organizationId: authResult.user.organizationId,
        avatarUrl: authResult.user.avatarUrl ?? undefined,
        createdAt: authResult.user.createdAt.toISOString(),
        updatedAt: authResult.user.updatedAt.toISOString(),
      },
      tokens: {
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        expiresIn: 3600,
      },
    };
    res.status(201).json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/login - Authenticate user and get tokens
 */
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { ipAddress, userAgent, ...loginData } = req.body;
    const authResult = await authService.login({
      ...loginData,
      ipAddress: ipAddress || req.ip || undefined,
      userAgent: userAgent || req.get('User-Agent') || undefined,
    });

    // Create AuthResponseDTO from auth result
    const response: AuthResponseDTO = {
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        firstName: authResult.user.firstName,
        lastName: authResult.user.lastName,
        role: authResult.user.role as unknown as UserRole,
        isActive: authResult.user.isActive,
        organizationId: authResult.user.organizationId,
        avatarUrl: authResult.user.avatarUrl ?? undefined,
        lastLoginAt: authResult.user.lastLoginAt?.toISOString(),
        createdAt: authResult.user.createdAt.toISOString(),
        updatedAt: authResult.user.updatedAt.toISOString(),
      },
      tokens: {
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        expiresIn: 3600,
      },
    };
    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/refresh - Refresh access token using refresh token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Refresh token is required',
        },
      });
    }

    const tokens = await authService.refreshToken(refreshToken);
    res.json({
      success: true,
      data: {
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: 3600,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/logout - Logout user and invalidate tokens
 */
router.post('/logout', async (req, res, next) => {
  try {
    const { userId, refreshToken, organizationId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'User ID is required',
        },
      });
    }

    await authService.logout({ userId, refreshToken, organizationId });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/me - Get current user
 */
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: 'Access token is required',
        },
      });
    }

    const accessToken = authHeader.substring(7);
    const payload = JwtService.validateAccessToken(accessToken);
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: 'Invalid access token',
        },
      });
    }

    const user = await userRepository.findById(payload.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'User account is inactive',
        },
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/password-strength - Server-authoritative password strength check.
 *
 * The SPA's `PasswordStrength` component estimates strength client-side, but
 * this endpoint lets the UI confirm against the same policy the server enforces
 * on registration (length, character classes, common-password blocklist) and
 * returns a 0–4 score plus human-readable feedback. It performs no persistence
 * and requires no authentication.
 */
router.post('/password-strength', (req, res) => {
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  const score = scorePasswordStrength(password);
  const feedback: string[] = [];

  if (password.length < PASSWORD_POLICY.MIN_LENGTH) {
    feedback.push(`Use at least ${PASSWORD_POLICY.MIN_LENGTH} characters`);
  }
  if (!/[a-z]/.test(password)) feedback.push('Add a lowercase letter');
  if (!/[A-Z]/.test(password)) feedback.push('Add an uppercase letter');
  if (!/[0-9]/.test(password)) feedback.push('Add a number');
  if (!/[^A-Za-z0-9]/.test(password)) feedback.push('Add a symbol (e.g. !@#$%)');
  if (PASSWORD_POLICY.BLOCK_COMMON_PASSWORDS && COMMON_PASSWORDS.has(password.toLowerCase())) {
    feedback.push('This password is too common or has appeared in a known breach');
  }

  const strength = password.length === 0 ? 'none' : score < 3 ? 'weak' : score === 3 ? 'medium' : 'strong';

  res.json({
    success: true,
    data: { score, strength, feedback },
  });
});

export default router;
