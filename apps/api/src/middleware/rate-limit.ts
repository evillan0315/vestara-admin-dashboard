import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { HTTP_STATUS, ERROR_CODES, RATE_LIMIT } from '@vestara/constants';
import { logger } from '../utils/logger.js';

/**
 * Rate limiting is disabled under test so the auth test-suite can register
 * many users (and deliberately trigger duplicate-email 409s) without tripping
 * the brute-force ceiling. In all other environments it is enforced.
 */
const isTest = process.env.NODE_ENV === 'test';
const noop = { skip: (_req: Request, _res: Response) => true } as const;

/**
 * Standard rate-limit response body, matching the API's `{ success, error }`
 * envelope so clients parse it like any other error.
 */
function makeRateLimitHandler(reason: string) {
  return (_req: Request, res: Response): void => {
    logger.warn(
      { ip: _req.ip, path: _req.path },
      `Rate limit reached (${reason}) — possible abuse`,
    );
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      error: {
        code: ERROR_CODES.RATE_LIMITED,
        message: 'Too many requests, please try again later.',
      },
    });
  };
}

/**
 * Strict limiter for authentication endpoints (login, register, refresh,
 * forgot/reset password). Brute-force protection — low ceiling, short window.
 * Keyed by IP; only counts failed attempts so legitimate users are unaffected.
 */
export const authRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.AUTH_WINDOW_MS,
  max: RATE_LIMIT.AUTH_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: isTest ? noop.skip : undefined,
  handler: makeRateLimitHandler('auth'),
});

/**
 * General API limiter applied to all authenticated routes. Protects against
 * abuse and accidental thundering herds without impeding normal usage.
 */
export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.API_WINDOW_MS,
  max: RATE_LIMIT.API_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTest ? noop.skip : undefined,
  handler: makeRateLimitHandler('api'),
});

/**
 * More permissive limiter for the health check endpoint so uptime monitors
 * and load balancers are never throttled.
 */
export const healthRateLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 60,
  standardHeaders: false,
  legacyHeaders: false,
  handler: makeRateLimitHandler('health'),
});
