import helmet from 'helmet';
import type { RequestHandler } from 'express';

/**
 * Security header stack via Helmet.
 *
 * The API is consumed by a browser SPA (and the Swagger UI), so we allow
 * `script-src 'self'` and `style-src 'self' 'unsafe-inline'` (MUI injects
 * inline styles at runtime and Swagger UI needs inline assets). We lock down
 * everything else: no third-party framing, no mixed content, strict referrer
 * leakage, and a permissions policy that disables powerful features we never
 * use (camera, microphone, geolocation, etc.).
 *
 * HSTS is enforced in production. On localhost/HTTP the browser ignores it,
 * which is fine for local development.
 */
const isProduction = process.env.NODE_ENV === 'production';

export const securityHeaders: RequestHandler = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      fontSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:', 'wss:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: isProduction ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: isProduction
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' },
  xssFilter: true,
  noSniff: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  ieNoOpen: true,
});

/**
 * Permissions Policy — disable browser features the admin dashboard never
 * requests. Reduces the attack surface for drive-by exploits.
 */
export const permissionsPolicy: RequestHandler = (_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()',
      'browsing-topics=()',
      'payment=()',
    ].join(', '),
  );
  next();
};
