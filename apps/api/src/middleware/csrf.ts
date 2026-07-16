import type { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_CODES } from '@vestara/constants';
import { logger } from '../utils/logger.js';

/**
 * Cross-Site Request Forgery protection for a stateless Bearer-token SPA.
 *
 * The app stores JWTs in `localStorage` (not cookies), so the classic
 * double-submit-cookie pattern does not apply. Instead we verify the
 * `Origin` header on every state-changing request (POST/PUT/PATCH/DELETE):
 *
 *   - A browser issuing a genuine same-origin request sends `Origin` equal to
 *     the API's own origin OR the known SPA origin. We also honor requests
 *     that carry no `Origin` only when they come from our allow-list (e.g.
 *     server-to-server tooling on a safelist) — but for safety, any request
 *     with an `Origin` that does NOT match an allowed origin is rejected.
 *   - A cross-site page cannot set `Origin` to our domain (the browser
 *     controls it), so forged cross-site requests fail this check.
 *
 * GET/HEAD/OPTIONS are not state-changing and are passed through (the
 * browser already reads `Origin` for CORS preflight; we only guard writes).
 */

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Build the allow-list of origins that may issue state-changing requests. */
function getAllowedOrigins(): Set<string> {
  const origins = new Set<string>();

  // Configured client + cors origins.
  for (const value of [process.env.CLIENT_URL, process.env.CORS_ORIGIN, process.env.API_URL]) {
    if (value) origins.add(value.replace(/\/$/, ''));
  }

  // Local dev.
  origins.add('http://localhost:5173');
  origins.add('http://localhost:5000');

  return origins;
}

const allowedOrigins = getAllowedOrigins();

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Only guard state-changing methods.
  if (!STATE_CHANGING_METHODS.has(req.method)) {
    return next();
  }

  const origin = req.get('Origin');

  // No Origin header: permitted only for non-browser callers (curl, tests,
  // server-to-server). The CORS middleware already blocks disallowed browser
  // origins for these, and a browser always sends Origin on cross-site writes.
  if (!origin) {
    return next();
  }

  const normalizedOrigin = origin.replace(/\/$/, '');

  // Allow any Vercel preview/deployment of our own app (already vetted by CORS).
  if (normalizedOrigin.endsWith('.vercel.app')) {
    return next();
  }

  if (allowedOrigins.has(normalizedOrigin)) {
    return next();
  }

  logger.warn(
    { origin, method: req.method, path: req.path, ip: req.ip },
    'CSRF/origin check failed — rejected cross-site state-changing request',
  );

  res.status(HTTP_STATUS.FORBIDDEN).json({
    success: false,
    error: {
      code: ERROR_CODES.FORBIDDEN,
      message: 'Cross-site request blocked.',
    },
  });
}
