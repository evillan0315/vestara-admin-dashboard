import type { Request, Response, NextFunction } from 'express';
import { sanitizeObject } from '../utils/sanitize.js';

/**
 * Defense-in-depth input sanitization.
 *
 * Zod validates the *shape* and *type* of incoming data at the route boundary.
 * This middleware additionally neutralizes *content* hazards in free-text
 * fields (script tags, inline event handlers, `javascript:` URIs, control
 * characters) before the request reaches the service layer — so stored XSS
 * payloads cannot survive the round trip even if a client bypasses front-end
 * validation or a new field is added without its own guard.
 *
 * It mutates `req.body`, `req.query`, and `req.params` in place with sanitized
 * copies. Binary uploads are unaffected (multer runs before this in the chain
 * and only parses multipart, leaving `req.body` for text fields).
 */
export function sanitizeInput(_req: Request, _res: Response, next: NextFunction): void {
  // `sanitizeObject` is a pure transformation; reassign the request parts.
  // Express 5 makes `req.query` getter-only, so guard with defineProperty.
  const req = _req as Request & {
    body?: unknown;
    query?: unknown;
    params?: unknown;
  };

  if (req.body !== undefined && req.body !== null) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query !== undefined && req.query !== null) {
    try {
      Object.defineProperty(req, 'query', {
        value: sanitizeObject(req.query),
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } catch {
      // If the query object is non-configurable, skip sanitizing it rather
      // than crashing the request (query params are not persisted anyway).
    }
  }

  if (req.params !== undefined && req.params !== null) {
    req.params = sanitizeObject(req.params);
  }

  next();
}
