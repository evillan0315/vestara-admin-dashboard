import { type Request, type Response, type NextFunction } from 'express';
import type { UserRole } from '@vestara/types';
import { JwtService } from '../utils/jwt.js';
import { userRepository } from '../repositories/index.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

/**
 * Middleware that authenticates a user via JWT Bearer token.
 *
 * Extracts the token from the `Authorization` header, validates it,
 * looks up the user in the database, and attaches the user object
 * to `req.user`. Returns 401 if any step fails.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const payload = JwtService.validateAccessToken(token);
    if (!payload) {
      throw new UnauthorizedError('Invalid or expired access token');
    }

    const user = await userRepository.findById(payload.id);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is inactive');
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware factory that restricts access to specific roles.
 * Must be used after `authenticate` middleware.
 *
 * @example
 * ```ts
 * router.get('/users', authenticate, requireRole(UserRole.SUPER_ADMIN), handler);
 * ```
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          `Requires one of: ${roles.join(', ')}`,
        ),
      );
      return;
    }

    next();
  };
}
